"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { synthesizeSpeech } from "@/lib/api";
import { AudioFeatureExtractor, classifySilence, type AudioFeatures, type SilenceCategory } from "@/lib/conversation/AudioFeatureExtractor";
import { useContinuousVoice } from "./useContinuousVoice";

type VoiceState = "idle" | "connecting" | "listening" | "user_speaking" | "silence_detected" | "processing" | "ai_speaking" | "error";
type Provider = "deepgram" | "mock";
export type VoiceTurnMetrics = { speechDurationMs: number; silenceMs: number; silenceCategory?: SilenceCategory };
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

function humanizeSpeech(text: string) {
  return text
    .replace(/^(AI persona|Coach|Assistant)\s*:\s*/i, "")
    .replace(/\s+/g, " ")
    .replace(/\b(Stay focused on your goal:)\s*/gi, "")
    .trim();
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

  useEffect(() => {
    fallbackRef.current = fallback;
  }, [fallback]);

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
      try {
        wsRef.current.send(JSON.stringify({ type: "Finalize" }));
        wsRef.current.close();
      } catch {
        wsRef.current.close();
      }
    }
    wsRef.current = null;
    setDiagnostics((current) => ({ ...current, deepgramConnected: false }));
  }, []);

  const resetTranscript = useCallback(() => {
    finalBufferRef.current = "";
    interimBufferRef.current = "";
    finalizingRef.current = false;
    lastFinalTextRef.current = "";
    speechStartedAtRef.current = null;
    lastSpeechAtRef.current = null;
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
    finalizingRef.current = true;
    setVoiceState("processing");
    setTranscript(text);
    setInterimTranscript("");
    const now = Date.now();
    const metrics = {
      speechDurationMs: speechStartedAtRef.current ? now - speechStartedAtRef.current : 0,
      silenceMs: lastSpeechAtRef.current ? now - lastSpeechAtRef.current : 0,
      silenceCategory: classifySilence(lastSpeechAtRef.current ? now - lastSpeechAtRef.current : 0),
    };
    cleanupDeepgram();
    callbackRef.current?.(text, metrics);
  }, [cleanupDeepgram]);

  const schedulePause = useCallback(() => {
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => {
      setVoiceState("silence_detected");
      finalizeTurn();
    }, longPauseMs);
  }, [finalizeTurn, longPauseMs]);

  const startMock = useCallback((reason: string) => {
      if (speakingRef.current) return;
      setProvider("mock");
      setProviderReason(reason);
      setDiagnostics((current) => ({ ...current, deepgramConnected: false }));
      fallback.startListening();
    }, [fallback]);

  const startListening = useCallback(async () => {
    if (speakingRef.current || listeningActiveRef.current) return;
    listeningActiveRef.current = true;
    const runId = ++listeningRunRef.current;
    resetTranscript();
    setDiagnostics((current) => ({
      ...current,
      audioChunksStreaming: 0,
      transcriptReceived: false,
      ttsError: "",
    }));
    if (!navigator.mediaDevices?.getUserMedia || typeof WebSocket === "undefined" || typeof MediaRecorder === "undefined") {
      startMock("Microphone streaming is not supported in this browser. Using browser speech fallback.");
      return;
    }

    setVoiceState("connecting");
    setProviderReason("");
    setProvider("deepgram");
    try {
      setDiagnostics((current) => ({ ...current, micPermission: "prompt", deepgramConnected: false }));
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      if (runId !== listeningRunRef.current || speakingRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        listeningActiveRef.current = false;
        return;
      }
      streamRef.current = stream;
      await audioExtractorRef.current.connect(stream);
      audioFeatureTimerRef.current = setInterval(() => {
        const now = Date.now();
        const silenceMs = lastSpeechAtRef.current ? now - lastSpeechAtRef.current : 0;
        setAudioFeatures(audioExtractorRef.current.sample({
          silenceMs,
          transcript: `${finalBufferRef.current} ${interimBufferRef.current}`.trim(),
          speechDurationMs: speechStartedAtRef.current ? now - speechStartedAtRef.current : 0,
        }));
      }, 100);
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
        try {
          if (runId !== listeningRunRef.current || speakingRef.current) {
            cleanupDeepgram();
            return;
          }
          if (connectionTimerRef.current) clearTimeout(connectionTimerRef.current);
          connectionTimerRef.current = null;
          const mimeType = getMimeType();
          setDiagnostics((current) => ({ ...current, micPermission: "granted", deepgramConnected: true }));
          const currentStream = streamRef.current;
          if (!currentStream) throw new Error("Microphone stream was stopped before Deepgram connected.");
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
        } catch (error) {
          cleanupDeepgram();
          setVoiceState("error");
          setDiagnostics((current) => ({
            ...current,
            micPermission: error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") ? "denied" : "error",
            deepgramConnected: false,
          }));
          startMock(error instanceof Error ? error.message : "Microphone permission failed. Voice-only fallback could not start.");
        }
      };

      socket.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        if (payload.type === "proxy_ready") {
          setProvider("deepgram");
          setProviderReason("");
          return;
        }
        if (payload.type === "error") {
          cleanupDeepgram();
          setVoiceState("error");
          startMock(payload.reason || "Deepgram proxy failed. Falling back to browser speech.");
          return;
        }
        if (payload.type === "UtteranceEnd") {
          setSpeechFinal(true);
          finalizeTurn();
          return;
        }
        const text = payload.channel?.alternatives?.[0]?.transcript?.trim();
        if (runId !== listeningRunRef.current || speakingRef.current) return;
        if (!text) return;
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
          if (payload.speech_final) {
            setSpeechFinal(true);
            finalizeTurn();
          }
          else schedulePause();
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
    cleanupDeepgram();
    fallback.stopListening();
    setVoiceState("ai_speaking");
    audioExtractorRef.current.markAiAudioEnded();
    setDiagnostics((current) => ({ ...current, aiResponseReceived: Boolean(text.trim()), ttsStarted: false, ttsError: "" }));
    const cleanText = humanizeSpeech(text);
    return new Promise(async (resolve) => {
      const playBrowserFallback = () => {
        if (runId !== speakRunRef.current) {
          setVoiceState("idle");
          speakingRef.current = false;
          resolve();
          return;
        }
        if (typeof window === "undefined" || !window.speechSynthesis) {
          setDiagnostics((current) => ({ ...current, ttsError: "Browser speech synthesis unavailable." }));
          setVoiceState("idle");
          speakingRef.current = false;
          resolve();
          return;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = speechCode;
        utterance.voice = pickVoice(speechCode);
        utterance.rate = 0.88;
        utterance.pitch = 1.02;
        utterance.volume = 1;
        utterance.onend = () => {
          if (runId !== speakRunRef.current) return;
          audioExtractorRef.current.markAiAudioEnded();
          setVoiceState("idle");
          speakingRef.current = false;
          resolve();
        };
        utterance.onerror = () => {
          if (runId !== speakRunRef.current) return;
          setVoiceState("idle");
          speakingRef.current = false;
          resolve();
        };
        setDiagnostics((current) => ({ ...current, ttsStarted: true }));
        window.speechSynthesis.speak(utterance);
        window.speechSynthesis.resume();
      };
      try {
        audioRef.current?.pause();
        if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
        const blob = await synthesizeSpeech(cleanText, voiceId);
        if (runId !== speakRunRef.current) {
          setVoiceState("idle");
          speakingRef.current = false;
          resolve();
          return;
        }
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audioUrlRef.current = audioUrl;
        audio.onplay = () => setDiagnostics((current) => ({ ...current, ttsStarted: true }));
        audio.onended = () => {
          if (runId !== speakRunRef.current) return;
          audioExtractorRef.current.markAiAudioEnded();
          setVoiceState("idle");
          speakingRef.current = false;
          URL.revokeObjectURL(audioUrl);
          if (audioUrlRef.current === audioUrl) audioUrlRef.current = null;
          resolve();
        };
        audio.onerror = () => {
          if (runId !== speakRunRef.current) return;
          URL.revokeObjectURL(audioUrl);
          if (audioUrlRef.current === audioUrl) audioUrlRef.current = null;
          audioRef.current = null;
          setDiagnostics((current) => ({ ...current, ttsError: "Cartesia audio failed. Using browser speech fallback." }));
          playBrowserFallback();
        };
        await audio.play();
        return;
      } catch {
        audioRef.current = null;
        setDiagnostics((current) => ({ ...current, ttsError: "TTS request failed. Using browser speech fallback." }));
        playBrowserFallback();
      }
    });
  }, [browserSpeechCode, cleanupDeepgram, fallback]);

  const stopSpeaking = useCallback(() => {
    speakRunRef.current += 1;
    speakingRef.current = false;
    audioRef.current?.pause();
    audioRef.current = null;
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    window.speechSynthesis?.cancel();
    setVoiceState("idle");
    fallback.stopSpeaking();
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
    return () => {
      if (callbackRef.current === callback) callbackRef.current = null;
    };
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
