"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const SHORT_PAUSE_MS = 1300;
export const LONG_PAUSE_MS = 3200;
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
  const english = voices.filter((voice) => voice.lang.startsWith("en"));
  return (
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
    .replace(/([.!?])\s+/g, "$1 ")
    .replace(/, /g, ", ")
    .trim();
}

export function useContinuousVoice(language = "en-US") {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const callbackRef = useRef<FinalTranscriptCallback | null>(null);
  const shouldListenRef = useRef(false);
  const finalBufferRef = useRef("");
  const interimBufferRef = useRef("");
  const finalizingRef = useRef(false);
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
    interimBufferRef.current = "";
    finalizingRef.current = false;
    setTranscript("");
    setInterimTranscript("");
  }, []);

  const finalizeTurn = useCallback(() => {
    if (finalizingRef.current) return;
    const finalText = `${finalBufferRef.current} ${interimBufferRef.current}`.replace(/\s+/g, " ").trim();
    if (!finalText) {
      setVoiceState(shouldListenRef.current ? "listening" : "idle");
      return;
    }
    finalizingRef.current = true;
    shouldListenRef.current = false;
    clearTimers();
    setVoiceState("processing");
    setTranscript(finalText);
    setInterimTranscript("");
    interimBufferRef.current = "";
    try {
      recognitionRef.current?.stop();
    } catch {
      recognitionRef.current?.abort?.();
    }
    callbackRef.current?.(finalText);
  }, [clearTimers]);

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

  const waitForVoices = useCallback(() => new Promise<void>((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve();
      return;
    }
    if (window.speechSynthesis.getVoices().length > 0) {
      resolve();
      return;
    }
    const timeout = window.setTimeout(resolve, 450);
    window.speechSynthesis.onvoiceschanged = () => {
      window.clearTimeout(timeout);
      resolve();
    };
  }), []);

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
      waitForVoices().then(() => {
      const utterance = new SpeechSynthesisUtterance(humanizeSpeech(text));
      utterance.voice = pickVoice();
      utterance.rate = 0.88;
      utterance.pitch = 1.02;
      utterance.volume = 1;
      let resolved = false;
      const finish = () => {
        if (resolved) return;
        resolved = true;
        setVoiceState("idle");
        resolve();
      };
      utterance.onstart = () => {
        setVoiceState("ai_speaking");
        window.speechSynthesis.resume();
      };
      utterance.onend = () => {
        finish();
      };
      utterance.onerror = () => {
        finish();
      };
      window.speechSynthesis.speak(utterance);
      window.speechSynthesis.resume();
      window.setTimeout(finish, Math.max(3000, text.length * 95));
      });
    });
  }, [clearTimers, waitForVoices]);

  useEffect(() => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSupported(Boolean(Recognition));
    if (!Recognition) return;

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;
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
      interimBufferRef.current = interimText.trim();
      setInterimTranscript(interimBufferRef.current);
      if (finalText || interimText) {
        finalizingRef.current = false;
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
  }, [clearTimers, language, schedulePauseDetection]);

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
