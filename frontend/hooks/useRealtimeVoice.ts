"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { synthesizeSpeech } from "@/lib/api";
import { useContinuousVoice } from "./useContinuousVoice";

type VoiceState = "idle" | "connecting" | "listening" | "user_speaking" | "silence_detected" | "processing" | "ai_speaking" | "error";
type Provider = "deepgram" | "mock";
type FinalTranscriptCallback = (transcript: string) => void | Promise<void>;

const DEEPGRAM_LONG_PAUSE_MS = 3400;
const DEEPGRAM_MAX_TURN_MS = 60000;

function getVoiceWebSocketUrl() {
  const explicitUrl = process.env.NEXT_PUBLIC_API_WS_URL;
  if (explicitUrl) return `${explicitUrl.replace(/\/$/, "")}/ws/voice/deepgram`;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  return `${apiUrl.replace(/^http/, "ws").replace(/\/$/, "")}/ws/voice/deepgram`;
}

function getMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) return "audio/webm;codecs=opus";
  if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
  if (MediaRecorder.isTypeSupported("audio/mp4")) return "audio/mp4";
  return "";
}

function pickVoice() {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const english = window.speechSynthesis.getVoices().filter((voice) => voice.lang.startsWith("en"));
  return (
    english.find((voice) => /Samantha|Victoria|Karen|Zira|Jenny|Aria|Sonia|Female|Google UK English Female/i.test(voice.name)) ||
    english.find((voice) => /Google|Microsoft|Natural|Enhanced/i.test(voice.name)) ||
    english[0] ||
    null
  );
}

export function useRealtimeVoice() {
  const fallback = useContinuousVoice();
  const callbackRef = useRef<FinalTranscriptCallback | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const finalBufferRef = useRef("");
  const interimBufferRef = useRef("");
  const finalizingRef = useRef(false);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [provider, setProvider] = useState<Provider>("mock");
  const [providerReason, setProviderReason] = useState("");
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [supported, setSupported] = useState(false);

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
  }, []);

  const resetTranscript = useCallback(() => {
    finalBufferRef.current = "";
    interimBufferRef.current = "";
    finalizingRef.current = false;
    setTranscript("");
    setInterimTranscript("");
    fallback.resetTranscript();
  }, [fallback]);

  const finalizeTurn = useCallback(() => {
    if (finalizingRef.current) return;
    const text = `${finalBufferRef.current} ${interimBufferRef.current}`.replace(/\s+/g, " ").trim();
    if (!text) return;
    finalizingRef.current = true;
    setVoiceState("processing");
    setTranscript(text);
    setInterimTranscript("");
    cleanupDeepgram();
    callbackRef.current?.(text);
  }, [cleanupDeepgram]);

  const schedulePause = useCallback(() => {
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => {
      setVoiceState("silence_detected");
      finalizeTurn();
    }, DEEPGRAM_LONG_PAUSE_MS);
  }, [finalizeTurn]);

  const startMock = useCallback((reason: string) => {
    setProvider("mock");
    setProviderReason(reason);
    fallback.startListening();
  }, [fallback]);

  const startListening = useCallback(async () => {
    resetTranscript();
    if (!navigator.mediaDevices?.getUserMedia || typeof WebSocket === "undefined" || typeof MediaRecorder === "undefined") {
      startMock("Microphone streaming is not supported in this browser. Using browser speech fallback.");
      return;
    }

    setVoiceState("connecting");
    setProviderReason("");
    try {
      const socket = new WebSocket(getVoiceWebSocketUrl());
      wsRef.current = socket;
      setProvider("deepgram");

      socket.onopen = async () => {
        const mimeType = getMimeType();
        const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
        streamRef.current = stream;
        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        recorderRef.current = recorder;
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) socket.send(event.data);
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
        finalizingRef.current = false;
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
      startMock(error instanceof Error ? error.message : "Could not start Deepgram proxy. Using browser speech fallback.");
    }
  }, [cleanupDeepgram, fallback, finalizeTurn, resetTranscript, schedulePause, startMock, voiceState]);

  const stopListening = useCallback(() => {
    cleanupDeepgram();
    fallback.stopListening();
    setVoiceState("idle");
  }, [cleanupDeepgram, fallback]);

  const speak = useCallback((text: string): Promise<void> => {
    cleanupDeepgram();
    fallback.stopListening();
    setVoiceState("ai_speaking");
    const cleanText = text.replace(/\s+/g, " ").trim();
    return new Promise(async (resolve) => {
      const playBrowserFallback = () => {
        if (typeof window === "undefined" || !window.speechSynthesis) {
          setVoiceState("idle");
          resolve();
          return;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.voice = pickVoice();
        utterance.rate = 0.92;
        utterance.pitch = 1.08;
        utterance.volume = 1;
        utterance.onend = () => {
          setVoiceState("idle");
          resolve();
        };
        utterance.onerror = () => {
          setVoiceState("idle");
          resolve();
        };
        window.speechSynthesis.speak(utterance);
        window.speechSynthesis.resume();
      };
      try {
        audioRef.current?.pause();
        if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
        const blob = await synthesizeSpeech(cleanText);
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audioUrlRef.current = audioUrl;
        audio.onended = () => {
          setVoiceState("idle");
          URL.revokeObjectURL(audioUrl);
          if (audioUrlRef.current === audioUrl) audioUrlRef.current = null;
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          if (audioUrlRef.current === audioUrl) audioUrlRef.current = null;
          audioRef.current = null;
          playBrowserFallback();
        };
        await audio.play();
        return;
      } catch {
        audioRef.current = null;
        playBrowserFallback();
      }
    });
  }, [cleanupDeepgram, fallback]);

  const stopSpeaking = useCallback(() => {
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
    startListening,
    stopListening,
    resetTranscript,
    onFinalTranscript,
    speak,
    stopSpeaking,
  };
}
