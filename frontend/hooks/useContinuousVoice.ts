"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const SHORT_PAUSE_MS = 800;
export const LONG_PAUSE_MS = 1800;
export const MAX_TURN_MS = 60000;

type VoiceState = "idle" | "listening" | "user_speaking" | "silence_detected" | "processing" | "ai_speaking";
type FinalTranscriptCallback = (transcript: string) => void | Promise<void>;

type SpeechRecognitionConstructor = new () => SpeechRecognition;

type SpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort?: () => void;
};

type SpeechRecognitionEvent = {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: { transcript: string };
    };
  };
};

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

function pickVoice() {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  return voices.find((voice) => voice.lang.startsWith("en") && /Google|Samantha|Alex|Natural/i.test(voice.name)) || voices.find((voice) => voice.lang.startsWith("en")) || null;
}

export function useContinuousVoice() {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const callbackRef = useRef<FinalTranscriptCallback | null>(null);
  const shouldListenRef = useRef(false);
  const finalBufferRef = useRef("");
  const shortPauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxTurnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [supported, setSupported] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");

  const clearTimers = useCallback(() => {
    if (shortPauseTimerRef.current) clearTimeout(shortPauseTimerRef.current);
    if (longPauseTimerRef.current) clearTimeout(longPauseTimerRef.current);
    if (maxTurnTimerRef.current) clearTimeout(maxTurnTimerRef.current);
  }, []);

  const resetTranscript = useCallback(() => {
    finalBufferRef.current = "";
    setTranscript("");
    setInterimTranscript("");
  }, []);

  const finalizeTurn = useCallback(() => {
    const finalText = `${finalBufferRef.current} ${interimTranscript}`.replace(/\s+/g, " ").trim();
    if (!finalText) return;
    shouldListenRef.current = false;
    clearTimers();
    setVoiceState("processing");
    setTranscript(finalText);
    setInterimTranscript("");
    try {
      recognitionRef.current?.stop();
    } catch {
      recognitionRef.current?.abort?.();
    }
    callbackRef.current?.(finalText);
  }, [clearTimers, interimTranscript]);

  const schedulePauseDetection = useCallback(() => {
    if (shortPauseTimerRef.current) clearTimeout(shortPauseTimerRef.current);
    if (longPauseTimerRef.current) clearTimeout(longPauseTimerRef.current);
    shortPauseTimerRef.current = setTimeout(() => setVoiceState("silence_detected"), SHORT_PAUSE_MS);
    longPauseTimerRef.current = setTimeout(finalizeTurn, LONG_PAUSE_MS);
  }, [finalizeTurn]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    if (voiceState === "ai_speaking") window.speechSynthesis?.cancel();
    shouldListenRef.current = true;
    resetTranscript();
    clearTimers();
    setVoiceState("listening");
    maxTurnTimerRef.current = setTimeout(finalizeTurn, MAX_TURN_MS);
    try {
      recognitionRef.current.start();
    } catch {
      setVoiceState("listening");
    }
  }, [clearTimers, finalizeTurn, resetTranscript, voiceState]);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    clearTimers();
    try {
      recognitionRef.current?.stop();
    } catch {
      recognitionRef.current?.abort?.();
    }
    setVoiceState("idle");
  }, [clearTimers]);

  const onFinalTranscript = useCallback((callback: FinalTranscriptCallback) => {
    callbackRef.current = callback;
    return () => {
      if (callbackRef.current === callback) callbackRef.current = null;
    };
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setVoiceState(shouldListenRef.current ? "listening" : "idle");
  }, []);

  const speak = useCallback((text: string): Promise<void> => {
    if (typeof window === "undefined" || !window.speechSynthesis) return Promise.resolve();
    shouldListenRef.current = false;
    clearTimers();
    try {
      recognitionRef.current?.stop();
    } catch {
      recognitionRef.current?.abort?.();
    }
    window.speechSynthesis.cancel();
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = pickVoice();
      utterance.rate = 0.98;
      utterance.pitch = 1;
      utterance.onstart = () => setVoiceState("ai_speaking");
      utterance.onend = () => {
        setVoiceState("idle");
        resolve();
      };
      utterance.onerror = () => {
        setVoiceState("idle");
        resolve();
      };
      window.speechSynthesis.speak(utterance);
    });
  }, [clearTimers]);

  useEffect(() => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSupported(Boolean(Recognition));
    if (!Recognition) return;

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const text = event.results[index][0].transcript;
        if (event.results[index].isFinal) finalText += text;
        else interimText += text;
      }
      if (finalText) {
        finalBufferRef.current = `${finalBufferRef.current} ${finalText}`.replace(/\s+/g, " ").trim();
        setTranscript(finalBufferRef.current);
      }
      setInterimTranscript(interimText.trim());
      if (finalText || interimText) {
        setVoiceState("user_speaking");
        schedulePauseDetection();
      }
    };
    recognition.onend = () => {
      if (shouldListenRef.current) {
        window.setTimeout(() => {
          try {
            recognition.start();
          } catch {
            setVoiceState("listening");
          }
        }, 160);
      }
    };
    recognition.onerror = () => {
      if (shouldListenRef.current) setVoiceState("listening");
      else setVoiceState("idle");
    };
    recognitionRef.current = recognition;

    return () => {
      shouldListenRef.current = false;
      clearTimers();
      recognition.stop();
      window.speechSynthesis?.cancel();
    };
  }, [clearTimers, schedulePauseDetection]);

  return {
    supported,
    voiceState,
    isListening: voiceState === "listening" || voiceState === "user_speaking" || voiceState === "silence_detected",
    isSpeaking: voiceState === "ai_speaking",
    isProcessing: voiceState === "processing",
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    onFinalTranscript,
    speak,
    stopSpeaking,
  };
}
