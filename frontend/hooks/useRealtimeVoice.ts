"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { synthesizeSpeech, synthesizeSpeechStream } from "@/lib/api";
import { AudioFeatureExtractor, classifySilence, type AudioFeatures, type SilenceCategory } from "@/lib/conversation/AudioFeatureExtractor";
import { analyzeSpeechEmotion, type SpeechEmotionResult } from "@/lib/conversation/SpeechEmotionAnalyzer";
import { useContinuousVoice } from "./useContinuousVoice";

type VoiceState = "idle" | "connecting" | "listening" | "user_speaking" | "silence_detected" | "processing" | "ai_speaking" | "error";
type Provider = "deepgram" | "mock";
export type VoiceTurnMetrics = { speechDurationMs: number; silenceMs: number; silenceCategory?: SilenceCategory; speechEmotion?: SpeechEmotionResult };
type FinalTranscriptCallback = (transcript: string, metrics?: VoiceTurnMetrics) => void | Promise<void>;
export type VoiceDiagnostics = {
  micPermission: "unknown" | "granted" | "denied" | "prompt" | "error";
  deepgramConnected: boolean;
  audioChunksStreaming: number;
  transcriptReceived: boolean;
  aiResponseReceived: boolean;
  ttsStarted: boolean;
  ttsError: string;
};

const DEEPGRAM_LONG_PAUSE_MS = 3400;
const DEEPGRAM_MAX_TURN_MS = 60000;
const VOICE_ACTIVITY_THRESHOLD = 0.015;
const MAX_PAUSE_HISTORY = 5;

function getVoiceWebSocketUrl(language = "en") {
  const suffix = `/ws/voice/deepgram?language=${encodeURIComponent(language)}`;
  const explicitUrl = process.env.NEXT_PUBLIC_API_WS_URL;
  if (explicitUrl) return `${explicitUrl.replace(/\/$/, "")}${suffix}`;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  return `${apiUrl.replace(/^http/, "ws").replace(/\/$/, "")}${suffix}`;
}

function getMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) return "audio/webm;codecs=opus";
  if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
  if (MediaRecorder.isTypeSupported("audio/mp4")) return "audio/mp4";
  return "";
}

function pickVoice(language = "en-US") {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const prefix = language.split("-")[0].toLowerCase();
  const localized = window.speechSynthesis.getVoices().filter((voice) => voice.lang.toLowerCase().startsWith(prefix));
  const english = window.speechSynthesis.getVoices().filter((voice) => voice.lang.startsWith("en"));
  return (
    localized.find((voice) => /Samantha|Victoria|Karen|Zira|Jenny|Aria|Sonia|Female|Google|Microsoft|Natural|Enhanced/i.test(voice.name)) ||
    localized[0] ||
    english.find((voice) => /Samantha|Victoria|Karen|Zira|Jenny|Aria|Sonia|Female|Google UK English Female/i.test(voice.name)) ||
    english.find((voice) => /Google|Microsoft|Natural|Enhanced/i.test(voice.name)) ||
    english[0] ||
    null
  );
}

function normalizeNumbersForSpeech(text: string): string {
  return text
    .replace(/£(\d[\d,.]*)\s*([kmb])\b/gi, (_, n, s) => `${n.replace(/,/g, "")} ${s.toLowerCase() === "k" ? "thousand" : s.toLowerCase() === "m" ? "million" : "billion"} pounds`)
    .replace(/\$(\d[\d,.]*)\s*([kmb])\b/gi, (_, n, s) => `${n.replace(/,/g, "")} ${s.toLowerCase() === "k" ? "thousand" : s.toLowerCase() === "m" ? "million" : "billion"} dollars`)
    .replace(/€(\d[\d,.]*)\s*([kmb])\b/gi, (_, n, s) => `${n.replace(/,/g, "")} ${s.toLowerCase() === "k" ? "thousand" : s.toLowerCase() === "m" ? "million" : "billion"} euros`)
    .replace(/£([\d,.]+)/g, (_, n) => `${n.replace(/,/g, "")} pounds`)
    .replace(/\$([\d,.]+)/g, (_, n) => `${n.replace(/,/g, "")} dollars`)
    .replace(/€([\d,.]+)/g, (_, n) => `${n.replace(/,/g, "")} euros`)
    .replace(/\b(\d+(?:\.\d+)?)\s*k\b/gi, (_, n) => `${n} thousand`)
    .replace(/\b(\d+(?:\.\d+)?)\s*m\b(?!\w)/gi, (_, n) => `${n} million`)
    .replace(/\b(\d+(?:\.\d+)?)\s*b\b(?!\w)/gi, (_, n) => `${n} billion`)
    .replace(/(\d+(?:\.\d+)?)%/g, "$1 percent")
    .replace(/\b(\d+)\s*[-–]\s*(\d+)\b/g, "$1 to $2");
}

function humanizeSpeech(text: string) {
  return normalizeNumbersForSpeech(text)
    .replace(/^(AI persona|Coach|Assistant)\s*:\s*/i, "")
    .replace(/\s+/g, " ")
    .replace(/\b(Stay focused on your goal:)\s*/gi, "")
    .trim();
}

function estimateSpeechDurationMs(text: string): number {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(2500, wordCount * 500);
}

function preWarmVoices() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) {
    window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.getVoices(); };
  }
}

function computeAdaptiveLongPauseMs(history: number[], defaultMs: number): number {
  if (history.length < 2) return defaultMs;
  const avg = history.reduce((sum, value) => sum + value, 0) / history.length;
  return Math.max(1800, Math.min(5000, Math.round(avg * 1.15)));
}

export function useRealtimeVoice({ browserSpeechCode = "en-US", deepgramCode = "en", longPauseMs = DEEPGRAM_LONG_PAUSE_MS } = {}) {
  const fallback = useContinuousVoice(browserSpeechCode);
  const fallbackRef = useRef(fallback);
  const callbackRef = useRef<FinalTranscriptCallback | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioExtractorRef = useRef(new AudioFeatureExtractor());
  const audioFeatureTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const speakRunRef = useRef(0);
  const speakResolveRef = useRef<(() => void) | null>(null);
  const finalBufferRef = useRef("");
  const interimBufferRef = useRef("");
  const finalizingRef = useRef(false);
  const listeningActiveRef = useRef(false);
  const listeningRunRef = useRef(0);
  const speakingRef = useRef(false);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speechStartedAtRef = useRef<number | null>(null);
  const lastSpeechAtRef = useRef<number | null>(null);
  const lastFinalTextRef = useRef("");
  const pauseHistoryRef = useRef<number[]>([]);
  const adaptiveLongPauseMsRef = useRef(longPauseMs);
  const f0SamplesRef = useRef<number[]>([]);
  const rmsSamplesRef = useRef<number[]>([]);
  // Pre-warm: WebSocket + mic stream opened during AI speech so listen starts instantly
  const prewarmWsRef = useRef<WebSocket | null>(null);
  const prewarmStreamRef = useRef<MediaStream | null>(null);
  const prewarmRunRef = useRef(0);

  const [provider, setProvider] = useState<Provider>("mock");
  const [providerReason, setProviderReason] = useState("");
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [transcriptIsFinal, setTranscriptIsFinal] = useState(false);
  const [speechFinal, setSpeechFinal] = useState(false);
  const [audioFeatures, setAudioFeatures] = useState<AudioFeatures>(() => ({
    volume_rms: 0,
    silence_category: "micro_pause",
    filler_rate: 0,
    voice_onset_delay_ms: 0,
    pitch_rising: false,
    volume_rising: false,
    has_voice_activity: false,
    sampled_at: 0,
  }));
  const [supported, setSupported] = useState(false);
  const [diagnostics, setDiagnostics] = useState<VoiceDiagnostics>({
    micPermission: "unknown",
    deepgramConnected: false,
    audioChunksStreaming: 0,
    transcriptReceived: false,
    aiResponseReceived: false,
    ttsStarted: false,
    ttsError: "",
  });

  useEffect(() => { preWarmVoices(); }, []);

  useEffect(() => { adaptiveLongPauseMsRef.current = longPauseMs; }, [longPauseMs]);

  useEffect(() => { fallbackRef.current = fallback; }, [fallback]);

  useEffect(() => {
    setSupported(Boolean(navigator.mediaDevices?.getUserMedia) || fallback.supported);
  }, [fallback.supported]);

  useEffect(
    () => fallback.onFinalTranscript((text) => callbackRef.current?.(text)),
    [fallback.onFinalTranscript],
  );

  const cleanupDeepgram = useCallback(() => {
    listeningActiveRef.current = false;
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
    if (connectionTimerRef.current) clearTimeout(connectionTimerRef.current);
    if (audioFeatureTimerRef.current) clearInterval(audioFeatureTimerRef.current);
    audioFeatureTimerRef.current = null;
    connectionTimerRef.current = null;
    recorderRef.current?.state === "recording" && recorderRef.current.stop();
    recorderRef.current = null;
    audioExtractorRef.current.disconnect();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (wsRef.current && wsRef.current.readyState <= WebSocket.OPEN) {
      try { wsRef.current.send(JSON.stringify({ type: "Finalize" })); wsRef.current.close(); }
      catch { wsRef.current.close(); }
    }
    wsRef.current = null;
    // Cancel any in-progress pre-warm so its resources don't linger
    prewarmRunRef.current += 1;
    try { prewarmWsRef.current?.close(); } catch { /* ignore */ }
    prewarmWsRef.current = null;
    prewarmStreamRef.current?.getTracks().forEach((track) => track.stop());
    prewarmStreamRef.current = null;
    setDiagnostics((current) => ({ ...current, deepgramConnected: false }));
  }, []);

  // Open mic + WebSocket connection in the background while AI is speaking, so
  // startListening() can start the MediaRecorder immediately with ~0ms setup delay.
  const prewarmConnection = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof WebSocket === "undefined" || typeof MediaRecorder === "undefined") return;
    const runId = ++prewarmRunRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      if (runId !== prewarmRunRef.current) { stream.getTracks().forEach((t) => t.stop()); return; }
      prewarmStreamRef.current = stream;
      const socket = new WebSocket(getVoiceWebSocketUrl(deepgramCode));
      if (runId !== prewarmRunRef.current) {
        socket.close();
        stream.getTracks().forEach((t) => t.stop());
        prewarmStreamRef.current = null;
        return;
      }
      prewarmWsRef.current = socket;
      // Minimal handlers — real handlers attached when startListening() takes ownership
      socket.onerror = () => { if (prewarmWsRef.current === socket) prewarmWsRef.current = null; };
      socket.onclose = () => { if (prewarmWsRef.current === socket) prewarmWsRef.current = null; };
    } catch {
      if (prewarmStreamRef.current) { prewarmStreamRef.current.getTracks().forEach((t) => t.stop()); prewarmStreamRef.current = null; }
    }
  }, [deepgramCode]);

  const resetTranscript = useCallback(() => {
    finalBufferRef.current = "";
    interimBufferRef.current = "";
    finalizingRef.current = false;
    lastFinalTextRef.current = "";
    speechStartedAtRef.current = null;
    lastSpeechAtRef.current = null;
    f0SamplesRef.current = [];
    rmsSamplesRef.current = [];
    setTranscript("");
    setInterimTranscript("");
    setTranscriptIsFinal(false);
    setSpeechFinal(false);
    fallback.resetTranscript();
    setDiagnostics((current) => ({ ...current, transcriptReceived: false }));
  }, [fallback]);

  const finalizeTurn = useCallback(() => {
    if (finalizingRef.current) return;
    const text = `${finalBufferRef.current} ${interimBufferRef.current}`.replace(/\s+/g, " ").trim();
    if (!text) return;
    if (!audioExtractorRef.current.hasRealVoiceActivity && !finalBufferRef.current.trim()) return;
    finalizingRef.current = true;
    setVoiceState("processing");
    setTranscript(text);
    setInterimTranscript("");
    const now = Date.now();
    const silenceMs = lastSpeechAtRef.current ? now - lastSpeechAtRef.current : 0;
    const speechDurationMs = speechStartedAtRef.current ? now - speechStartedAtRef.current : 0;
    const speechEmotion = analyzeSpeechEmotion({
      f0Samples: f0SamplesRef.current,
      rmsSamples: rmsSamplesRef.current,
      transcript: text,
      speechDurationMs,
    });
    const metrics: VoiceTurnMetrics = {
      speechDurationMs,
      silenceMs,
      silenceCategory: classifySilence(silenceMs),
      speechEmotion,
    };
    if (silenceMs > 200 && silenceMs < 8000) {
      pauseHistoryRef.current = [...pauseHistoryRef.current.slice(-MAX_PAUSE_HISTORY + 1), silenceMs];
      adaptiveLongPauseMsRef.current = computeAdaptiveLongPauseMs(pauseHistoryRef.current, longPauseMs);
    }
    cleanupDeepgram();
    callbackRef.current?.(text, metrics);
  }, [cleanupDeepgram, longPauseMs]);

  const schedulePause = useCallback(() => {
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => {
      setVoiceState("silence_detected");
      finalizeTurn();
    }, adaptiveLongPauseMsRef.current);
  }, [finalizeTurn]);

  const startMock = useCallback((reason: string) => {
    if (speakingRef.current) return;
    setProvider("mock");
    setProviderReason(reason);
    setDiagnostics((current) => ({ ...current, deepgramConnected: false }));
    fallback.startListening();
  }, [fallback]);

  const startListening = useCallback(async () => {
    // If stale: listeningActive=true but genuinely nothing running — reset so we can proceed
    if (listeningActiveRef.current && !wsRef.current && !recorderRef.current) {
      listeningActiveRef.current = false;
    }
    if (speakingRef.current || listeningActiveRef.current) return;
    listeningActiveRef.current = true;
    const runId = ++listeningRunRef.current;
    resetTranscript();
    setDiagnostics((current) => ({ ...current, audioChunksStreaming: 0, transcriptReceived: false, ttsError: "" }));

    if (!navigator.mediaDevices?.getUserMedia || typeof WebSocket === "undefined" || typeof MediaRecorder === "undefined") {
      startMock("Microphone streaming is not supported in this browser. Using browser speech fallback.");
      return;
    }

    setVoiceState("connecting");
    setProviderReason("");
    setProvider("deepgram");

    // Shared recorder + handler setup used by both the prewarm fast-path and the cold path.
    // Once the socket is open and the stream is active, this attaches everything and starts recording.
    let transcriptEverReceived = false;
    let transcriptWatchdog: ReturnType<typeof setTimeout> | null = null;

    const attachAndRun = async (socket: WebSocket, stream: MediaStream) => {
      if (runId !== listeningRunRef.current || speakingRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        listeningActiveRef.current = false;
        return;
      }
      streamRef.current = stream;
      wsRef.current = socket;
      // Wrap connect() — an unhandled error here leaves listeningActiveRef stuck at true
      try {
        await audioExtractorRef.current.connect(stream);
      } catch {
        // Audio analysis won't work but recording can still proceed; log and continue
      }
      audioFeatureTimerRef.current = setInterval(() => {
        const now = Date.now();
        const silenceMs = lastSpeechAtRef.current ? now - lastSpeechAtRef.current : 0;
        const features = audioExtractorRef.current.sample({
          silenceMs,
          transcript: `${finalBufferRef.current} ${interimBufferRef.current}`.trim(),
          speechDurationMs: speechStartedAtRef.current ? now - speechStartedAtRef.current : 0,
        });
        setAudioFeatures(features);
        if (features.has_voice_activity && pauseTimerRef.current) {
          clearTimeout(pauseTimerRef.current);
          pauseTimerRef.current = setTimeout(() => {
            setVoiceState("silence_detected");
            finalizeTurn();
          }, adaptiveLongPauseMsRef.current);
        }
      }, 100);
      setDiagnostics((current) => ({ ...current, micPermission: "granted", deepgramConnected: true }));
      try {
        if (runId !== listeningRunRef.current || speakingRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          listeningActiveRef.current = false;
          return;
        }
        const mimeType = getMimeType();
        const currentStream = streamRef.current;
        if (!currentStream) throw new Error("Microphone stream was stopped before recording started.");
        const recorder = new MediaRecorder(currentStream, mimeType ? { mimeType } : undefined);
        recorderRef.current = recorder;
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
            socket.send(event.data);
            setDiagnostics((current) => ({ ...current, audioChunksStreaming: current.audioChunksStreaming + 1 }));
          }
        };
        recorder.start(250);
        setVoiceState("listening");
        maxTimerRef.current = setTimeout(finalizeTurn, DEEPGRAM_MAX_TURN_MS);
        // If Deepgram receives audio but never sends a transcript, the VETO handler
        // tries to restart but listeningActiveRef is still true so it's a no-op.
        // Detect this within 6s and fall back to browser STT immediately.
        transcriptWatchdog = setTimeout(() => {
          if (runId !== listeningRunRef.current || transcriptEverReceived) return;
          cleanupDeepgram();
          startMock("Deepgram not transcribing. Switching to browser speech.");
        }, 6000);
      } catch (error) {
        cleanupDeepgram();
        setVoiceState("error");
        setDiagnostics((current) => ({
          ...current,
          micPermission: error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") ? "denied" : "error",
          deepgramConnected: false,
        }));
        startMock(error instanceof Error ? error.message : "Microphone permission failed. Voice-only fallback could not start.");
        return;
      }

      socket.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        if (payload.type === "proxy_ready") { setProvider("deepgram"); setProviderReason(""); return; }
        if (payload.type === "prosody") {
          // Accumulate prosody samples for speech emotion analysis at turn end
          if (payload.f0 >= 80 && payload.f0 <= 400) f0SamplesRef.current.push(payload.f0);
          if (payload.rms > 0) rmsSamplesRef.current.push(payload.rms);
          setAudioFeatures((current) => ({
            ...current,
            volume_rms: payload.rms > 0 ? Math.max(current.volume_rms, payload.rms) : current.volume_rms,
            has_voice_activity: payload.rms > VOICE_ACTIVITY_THRESHOLD || current.has_voice_activity,
          }));
          return;
        }
        if (payload.type === "error") { cleanupDeepgram(); setVoiceState("error"); startMock(payload.reason || "Deepgram proxy failed. Falling back to browser speech."); return; }
        // UtteranceEnd means ~3s of silence has passed — give 1s grace before finalizing
        // so a thoughtful speaker who resumes after 3s doesn't get cut off
        if (payload.type === "UtteranceEnd") {
          setSpeechFinal(true);
          if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
          pauseTimerRef.current = setTimeout(() => {
            setVoiceState("silence_detected");
            finalizeTurn();
          }, 1000);
          return;
        }
        const text = payload.channel?.alternatives?.[0]?.transcript?.trim();
        if (runId !== listeningRunRef.current || speakingRef.current) return;
        if (!text) return;
        // First real transcript — Deepgram is working, cancel the silence watchdog
        if (!transcriptEverReceived) {
          transcriptEverReceived = true;
          if (transcriptWatchdog) { clearTimeout(transcriptWatchdog); transcriptWatchdog = null; }
        }
        setDiagnostics((current) => ({ ...current, transcriptReceived: true }));
        finalizingRef.current = false;
        if (!speechStartedAtRef.current) speechStartedAtRef.current = Date.now();
        lastSpeechAtRef.current = Date.now();
        setVoiceState("user_speaking");
        if (payload.is_final) {
          setTranscriptIsFinal(true);
          if (text !== lastFinalTextRef.current && !finalBufferRef.current.endsWith(text)) {
            finalBufferRef.current = `${finalBufferRef.current} ${text}`.replace(/\s+/g, " ").trim();
            lastFinalTextRef.current = text;
          }
          interimBufferRef.current = "";
          setTranscript(finalBufferRef.current);
          setInterimTranscript("");
          // speech_final is demoted: it schedules the adaptive pause timer.
          // UtteranceEnd (above) is the primary trigger that finalizes immediately.
          // This prevents premature sends on mid-sentence pauses.
          setSpeechFinal(true);
          schedulePause();
        } else {
          setTranscriptIsFinal(false);
          setSpeechFinal(false);
          interimBufferRef.current = text;
          setInterimTranscript(text);
          schedulePause();
        }
      };

      socket.onerror = () => {
        if (runId !== listeningRunRef.current) return;
        cleanupDeepgram();
        setVoiceState("error");
        startMock("Deepgram connection failed. Falling back to browser speech.");
      };

      socket.onclose = () => {
        if (runId === listeningRunRef.current) listeningActiveRef.current = false;
        if (!finalizingRef.current && voiceState !== "processing" && !speakingRef.current) setVoiceState("idle");
      };
    };

    // Fast path: reuse the connection pre-warmed during AI speech
    const pwSocket = prewarmWsRef.current;
    const pwStream = prewarmStreamRef.current;
    if (pwSocket?.readyState === WebSocket.OPEN && pwStream?.active) {
      prewarmWsRef.current = null;
      prewarmStreamRef.current = null;
      await attachAndRun(pwSocket, pwStream);
      return;
    }

    // Cold path: open mic + WebSocket from scratch
    try {
      setDiagnostics((current) => ({ ...current, micPermission: "prompt", deepgramConnected: false }));
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      if (runId !== listeningRunRef.current || speakingRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        listeningActiveRef.current = false;
        return;
      }
      setDiagnostics((current) => ({ ...current, micPermission: "granted" }));
      const socket = new WebSocket(getVoiceWebSocketUrl(deepgramCode));
      wsRef.current = socket;
      connectionTimerRef.current = setTimeout(() => {
        if (socket.readyState !== WebSocket.OPEN) {
          cleanupDeepgram();
          setVoiceState("error");
          startMock("Deepgram connection timed out. Using browser speech fallback.");
        }
      }, 5000);
      socket.onopen = async () => {
        if (connectionTimerRef.current) clearTimeout(connectionTimerRef.current);
        connectionTimerRef.current = null;
        await attachAndRun(socket, stream);
      };
      socket.onerror = () => {
        if (runId !== listeningRunRef.current) return;
        cleanupDeepgram();
        setVoiceState("error");
        startMock("Deepgram connection failed. Falling back to browser speech.");
      };
      socket.onclose = () => {
        if (runId === listeningRunRef.current) listeningActiveRef.current = false;
        if (!finalizingRef.current && voiceState !== "processing" && !speakingRef.current) setVoiceState("idle");
      };
    } catch (error) {
      if (runId !== listeningRunRef.current) return;
      cleanupDeepgram();
      setVoiceState("error");
      setDiagnostics((current) => ({
        ...current,
        micPermission: error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") ? "denied" : "error",
        deepgramConnected: false,
      }));
      startMock(error instanceof Error ? error.message : "Could not start Deepgram proxy. Using browser speech fallback.");
    }
  }, [cleanupDeepgram, deepgramCode, fallback, finalizeTurn, resetTranscript, schedulePause, startMock, voiceState]);

  const stopListening = useCallback(() => {
    listeningRunRef.current += 1;
    listeningActiveRef.current = false;
    cleanupDeepgram();
    fallback.stopListening();
    setVoiceState("idle");
  }, [cleanupDeepgram, fallback]);

  const speak = useCallback((text: string, voiceId?: string, speechCode = browserSpeechCode): Promise<void> => {
    const runId = ++speakRunRef.current;
    speakingRef.current = true;
    listeningRunRef.current += 1;
    cleanupDeepgram(); // also cancels any in-progress prewarm
    fallback.stopListening();
    setVoiceState("ai_speaking");
    audioExtractorRef.current.markAiAudioEnded();
    setDiagnostics((current) => ({ ...current, aiResponseReceived: Boolean(text.trim()), ttsStarted: false, ttsError: "" }));
    const cleanText = humanizeSpeech(text);

    // Pre-warm the next listen session while audio plays — by the time speak() resolves,
    // the WebSocket is open and mic is granted, so startListening() costs ~0ms.
    prewarmConnection();

    return new Promise(async (resolve) => {
      speakResolveRef.current = resolve;
      const finish = () => {
        if (runId !== speakRunRef.current) return;
        speakResolveRef.current = null;
        audioExtractorRef.current.markAiAudioEnded();
        setVoiceState("idle");
        speakingRef.current = false;
        resolve();
      };

      const playBrowserFallback = () => {
        if (runId !== speakRunRef.current) { setVoiceState("idle"); speakingRef.current = false; resolve(); return; }
        if (typeof window === "undefined" || !window.speechSynthesis) {
          setDiagnostics((current) => ({ ...current, ttsError: "Browser speech synthesis unavailable." }));
          setVoiceState("idle"); speakingRef.current = false; resolve(); return;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = speechCode;
        utterance.voice = pickVoice(speechCode);
        utterance.rate = 0.88;
        utterance.pitch = 1.02;
        utterance.volume = 1;
        utterance.onend = () => { if (runId !== speakRunRef.current) return; finish(); };
        utterance.onerror = () => { if (runId !== speakRunRef.current) return; setVoiceState("idle"); speakingRef.current = false; resolve(); };
        setDiagnostics((current) => ({ ...current, ttsStarted: true }));
        window.speechSynthesis.speak(utterance);
        window.speechSynthesis.resume();
        window.setTimeout(() => { if (runId !== speakRunRef.current) return; setVoiceState("idle"); speakingRef.current = false; resolve(); }, estimateSpeechDurationMs(cleanText));
      };

      const playBlobAudio = (blob: Blob) => {
        if (runId !== speakRunRef.current) { setVoiceState("idle"); speakingRef.current = false; resolve(); return; }
        audioRef.current?.pause();
        if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audioUrlRef.current = audioUrl;
        audio.onplay = () => setDiagnostics((current) => ({ ...current, ttsStarted: true }));
        audio.onended = () => {
          if (runId !== speakRunRef.current) return;
          URL.revokeObjectURL(audioUrl);
          if (audioUrlRef.current === audioUrl) audioUrlRef.current = null;
          finish();
        };
        audio.onerror = () => {
          if (runId !== speakRunRef.current) return;
          URL.revokeObjectURL(audioUrl);
          if (audioUrlRef.current === audioUrl) audioUrlRef.current = null;
          audioRef.current = null;
          setDiagnostics((current) => ({ ...current, ttsError: "Cartesia audio failed. Using browser speech fallback." }));
          playBrowserFallback();
        };
        audio.play().catch(() => { URL.revokeObjectURL(audioUrl); playBrowserFallback(); });
      };

      const tryStreamingMse = async (): Promise<boolean> => {
        if (typeof window === "undefined" || !window.MediaSource || !MediaSource.isTypeSupported("audio/mpeg")) return false;
        try {
          audioRef.current?.pause();
          if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
          const stream = await synthesizeSpeechStream(cleanText, voiceId);
          if (runId !== speakRunRef.current) { setVoiceState("idle"); speakingRef.current = false; resolve(); return true; }
          const mediaSource = new MediaSource();
          const audioUrl = URL.createObjectURL(mediaSource);
          const audio = new Audio(audioUrl);
          audioRef.current = audio;
          audioUrlRef.current = audioUrl;
          audio.onended = () => {
            if (runId !== speakRunRef.current) return;
            URL.revokeObjectURL(audioUrl);
            if (audioUrlRef.current === audioUrl) audioUrlRef.current = null;
            finish();
          };
          audio.onerror = () => {
            if (runId !== speakRunRef.current) return;
            URL.revokeObjectURL(audioUrl);
            if (audioUrlRef.current === audioUrl) audioUrlRef.current = null;
            audioRef.current = null;
            setDiagnostics((current) => ({ ...current, ttsError: "Streaming audio failed. Using browser speech fallback." }));
            playBrowserFallback();
          };
          await new Promise<void>((streamResolve, streamReject) => {
            mediaSource.addEventListener("sourceopen", async () => {
              try {
                const sourceBuffer = mediaSource.addSourceBuffer("audio/mpeg");
                const reader = stream.getReader();
                let playStarted = false;
                const pump = async () => {
                  if (runId !== speakRunRef.current) { reader.cancel().catch(() => undefined); return; }
                  const { done, value } = await reader.read();
                  if (done) {
                    const endStream = () => { if (mediaSource.readyState === "open") mediaSource.endOfStream(); };
                    if (sourceBuffer.updating) { sourceBuffer.addEventListener("updateend", endStream, { once: true }); } else { endStream(); }
                    streamResolve(); return;
                  }
                  const doAppend = () => {
                    if (mediaSource.readyState !== "open") return;
                    sourceBuffer.appendBuffer(value);
                    if (!playStarted) {
                      playStarted = true;
                      audio.play().then(() => { setDiagnostics((current) => ({ ...current, ttsStarted: true })); }).catch(() => undefined);
                    }
                    sourceBuffer.addEventListener("updateend", pump, { once: true });
                  };
                  if (sourceBuffer.updating) { sourceBuffer.addEventListener("updateend", doAppend, { once: true }); } else { doAppend(); }
                };
                await pump();
              } catch (err) { streamReject(err); }
            }, { once: true });
          });
          return true;
        } catch { return false; }
      };

      try {
        const didStream = await tryStreamingMse();
        if (didStream) return;
        try {
          audioRef.current?.pause();
          if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
          const stream = await synthesizeSpeechStream(cleanText, voiceId);
          if (runId !== speakRunRef.current) { setVoiceState("idle"); speakingRef.current = false; resolve(); return; }
          const reader = stream.getReader();
          const chunks: Uint8Array[] = [];
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
          }
          if (runId !== speakRunRef.current) { setVoiceState("idle"); speakingRef.current = false; resolve(); return; }
          playBlobAudio(new Blob(chunks, { type: "audio/mpeg" }));
          return;
        } catch { /* fall through */ }
        const blob = await synthesizeSpeech(cleanText, voiceId);
        if (runId !== speakRunRef.current) { setVoiceState("idle"); speakingRef.current = false; resolve(); return; }
        playBlobAudio(blob);
      } catch {
        audioRef.current = null;
        setDiagnostics((current) => ({ ...current, ttsError: "TTS request failed. Using browser speech fallback." }));
        playBrowserFallback();
      }
    });
  }, [browserSpeechCode, cleanupDeepgram, fallback, prewarmConnection]);

  const stopSpeaking = useCallback(() => {
    // Grab and clear the pending resolve BEFORE incrementing speakRunRef so finish() can't race
    const pendingResolve = speakResolveRef.current;
    speakResolveRef.current = null;
    speakRunRef.current += 1;
    speakingRef.current = false;
    audioRef.current?.pause();
    audioRef.current = null;
    if (audioUrlRef.current) { URL.revokeObjectURL(audioUrlRef.current); audioUrlRef.current = null; }
    window.speechSynthesis?.cancel();
    setVoiceState("idle");
    fallback.stopSpeaking();
    // Resolve the hanging speak() Promise so sendNaturalTurnDirect can continue
    pendingResolve?.();
  }, [fallback]);

  useEffect(() => () => {
    speakRunRef.current += 1;
    speakingRef.current = false;
    cleanupDeepgram();
    fallbackRef.current.stopListening();
    fallbackRef.current.stopSpeaking();
    audioRef.current?.pause();
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = null;
    audioRef.current = null;
    window.speechSynthesis?.cancel();
  }, [cleanupDeepgram]);

  const onFinalTranscript = useCallback((callback: FinalTranscriptCallback) => {
    callbackRef.current = callback;
    return () => { if (callbackRef.current === callback) callbackRef.current = null; };
  }, []);

  const activeMock = provider === "mock";
  const realtimeBusy = speakingRef.current || ["connecting", "listening", "user_speaking", "silence_detected", "processing", "ai_speaking"].includes(voiceState);
  return useMemo(() => ({
    supported,
    provider,
    providerReason,
    voiceState: activeMock && !realtimeBusy ? fallback.voiceState : voiceState,
    isListening: activeMock && !realtimeBusy ? fallback.isListening : ["connecting", "listening", "user_speaking", "silence_detected"].includes(voiceState),
    isSpeaking: activeMock && !realtimeBusy ? fallback.isSpeaking : speakingRef.current || voiceState === "ai_speaking",
    isProcessing: activeMock && !realtimeBusy ? fallback.isProcessing : voiceState === "processing",
    transcript: activeMock && !realtimeBusy ? fallback.transcript : transcript,
    interimTranscript: activeMock && !realtimeBusy ? fallback.interimTranscript : interimTranscript,
    diagnostics,
    transcriptIsFinal,
    speechFinal,
    audioFeatures,
    startListening,
    stopListening,
    resetTranscript,
    onFinalTranscript,
    speak,
    stopSpeaking,
  }), [
    activeMock,
    audioFeatures,
    diagnostics,
    fallback.interimTranscript,
    fallback.isListening,
    fallback.isProcessing,
    fallback.isSpeaking,
    fallback.resetTranscript,
    fallback.startListening,
    fallback.stopListening,
    fallback.stopSpeaking,
    fallback.supported,
    fallback.transcript,
    fallback.voiceState,
    interimTranscript,
    onFinalTranscript,
    provider,
    providerReason,
    realtimeBusy,
    resetTranscript,
    speak,
    speechFinal,
    startListening,
    stopListening,
    stopSpeaking,
    supported,
    transcript,
    transcriptIsFinal,
    voiceState,
  ]);
}
