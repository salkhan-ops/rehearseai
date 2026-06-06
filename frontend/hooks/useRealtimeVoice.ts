"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { synthesizeSpeech } from "@/lib/api";
import { useContinuousVoice } from "./useContinuousVoice";

type VoiceState = "idle" | "connecting" | "listening" | "user_speaking" | "silence_detected" | "processing" | "ai_speaking" | "error";
type Provider = "deepgram" | "mock";
export type VoiceTurnMetrics = { speechDurationMs: number; silenceMs: number };
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
  const speakRunRef = useRef(0);
  const finalBufferRef = useRef("");
  const interimBufferRef = useRef("");
  const finalizingRef = useRef(false);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speechStartedAtRef = useRef<number | null>(null);
  const lastSpeechAtRef = useRef<number | null>(null);
  const [provider, setProvider] = useState<Provider>("mock");
  const [providerReason, setProviderReason] = useState("");
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
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
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
    recorderRef.current?.state === "recording" && recorderRef.current.stop();
    recorderRef.current = null;
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
    speechStartedAtRef.current = null;
    lastSpeechAtRef.current = null;
    setTranscript("");
    setInterimTranscript("");
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
      setProvider("mock");
      setProviderReason(reason);
      setDiagnostics((current) => ({ ...current, deepgramConnected: false }));
      fallback.startListening();
    }, [fallback]);

  const startListening = useCallback(async () => {
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
    try {
      const socket = new WebSocket(getVoiceWebSocketUrl(deepgramCode));
      wsRef.current = socket;
      setProvider("deepgram");

      socket.onopen = async () => {
        const mimeType = getMimeType();
        const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
        setDiagnostics((current) => ({ ...current, micPermission: "granted", deepgramConnected: true }));
        streamRef.current = stream;
        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
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
          finalizeTurn();
          return;
        }
        const text = payload.channel?.alternatives?.[0]?.transcript?.trim();
        if (!text) return;
        setDiagnostics((current) => ({ ...current, transcriptReceived: true }));
        finalizingRef.current = false;
        if (!speechStartedAtRef.current) speechStartedAtRef.current = Date.now();
        lastSpeechAtRef.current = Date.now();
        setVoiceState("user_speaking");
        if (payload.is_final) {
          finalBufferRef.current = `${finalBufferRef.current} ${text}`.replace(/\s+/g, " ").trim();
          interimBufferRef.current = "";
          setTranscript(finalBufferRef.current);
          setInterimTranscript("");
          if (payload.speech_final) finalizeTurn();
          else schedulePause();
        } else {
          interimBufferRef.current = text;
          setInterimTranscript(text);
          schedulePause();
        }
      };

      socket.onerror = () => {
        cleanupDeepgram();
        setVoiceState("error");
        startMock("Deepgram connection failed. Falling back to browser speech.");
      };

      socket.onclose = () => {
        if (!finalizingRef.current && voiceState !== "processing") setVoiceState("idle");
      };
    } catch (error) {
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
    cleanupDeepgram();
    fallback.stopListening();
    setVoiceState("idle");
  }, [cleanupDeepgram, fallback]);

  const speak = useCallback((text: string, voiceId?: string, speechCode = browserSpeechCode): Promise<void> => {
    const runId = ++speakRunRef.current;
    cleanupDeepgram();
    fallback.stopListening();
    setVoiceState("ai_speaking");
    setDiagnostics((current) => ({ ...current, aiResponseReceived: Boolean(text.trim()), ttsStarted: false, ttsError: "" }));
    const cleanText = humanizeSpeech(text);
    return new Promise(async (resolve) => {
      const playBrowserFallback = () => {
        if (runId !== speakRunRef.current) {
          setVoiceState("idle");
          resolve();
          return;
        }
        if (typeof window === "undefined" || !window.speechSynthesis) {
          setDiagnostics((current) => ({ ...current, ttsError: "Browser speech synthesis unavailable." }));
          setVoiceState("idle");
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
          setVoiceState("idle");
          resolve();
        };
        utterance.onerror = () => {
          if (runId !== speakRunRef.current) return;
          setVoiceState("idle");
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
          setVoiceState("idle");
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
  return {
    supported,
    provider,
    providerReason,
    voiceState: activeMock ? fallback.voiceState : voiceState,
    isListening: activeMock ? fallback.isListening : ["connecting", "listening", "user_speaking", "silence_detected"].includes(voiceState),
    isSpeaking: activeMock ? fallback.isSpeaking : voiceState === "ai_speaking",
    isProcessing: activeMock ? fallback.isProcessing : voiceState === "processing",
    transcript: activeMock ? fallback.transcript : transcript,
    interimTranscript: activeMock ? fallback.interimTranscript : interimTranscript,
    diagnostics,
    startListening,
    stopListening,
    resetTranscript,
    onFinalTranscript,
    speak,
    stopSpeaking,
  };
}
