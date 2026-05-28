"use client";

import { useEffect, useRef, useState } from "react";

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
};

type SpeechRecognitionEvent = {
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

export function useSpeech() {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const shouldListenRef = useRef(false);
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [liveMode, setLiveMode] = useState(false);

  useEffect(() => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSupported(Boolean(Recognition));
    if (!Recognition) return;

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      let nextTranscript = "";
      for (let index = 0; index < event.results.length; index += 1) {
        nextTranscript += event.results[index][0].transcript;
      }
      setTranscript(nextTranscript.trim());
    };
    recognition.onend = () => {
      setListening(false);
      if (shouldListenRef.current && !window.speechSynthesis?.speaking) {
        window.setTimeout(() => {
          try {
            recognition.start();
            setListening(true);
          } catch {
            setListening(false);
          }
        }, 250);
      }
    };
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;

    return () => recognition.stop();
  }, []);

  function startListening(clearTranscript = true) {
    if (!recognitionRef.current) return;
    shouldListenRef.current = true;
    if (clearTranscript) setTranscript("");
    setListening(true);
    try {
      recognitionRef.current.start();
    } catch {
      setListening(false);
    }
  }

  function stopListening() {
    shouldListenRef.current = false;
    recognitionRef.current?.stop();
    setListening(false);
  }

  function clearTranscript() {
    setTranscript("");
  }

  function enableLiveMode() {
    setLiveMode(true);
    startListening();
  }

  function disableLiveMode() {
    setLiveMode(false);
    stopListening();
    stopSpeaking();
  }

  function speak(text: string): Promise<void> {
    if (typeof window === "undefined" || !window.speechSynthesis) return Promise.resolve();
    window.speechSynthesis.cancel();
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      utterance.voice = voices.find((voice) => voice.lang.startsWith("en") && /Google|Samantha|Alex|Natural/i.test(voice.name)) || voices.find((voice) => voice.lang.startsWith("en")) || null;
      utterance.rate = 0.98;
      utterance.pitch = 1;
      utterance.onstart = () => {
        setSpeaking(true);
        if (recognitionRef.current) recognitionRef.current.stop();
      };
      utterance.onend = () => {
        setSpeaking(false);
        resolve();
      };
      utterance.onerror = () => {
        setSpeaking(false);
        resolve();
      };
      window.speechSynthesis.speak(utterance);
    });
  }

  function stopSpeaking() {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }

  return {
    supported,
    listening,
    speaking,
    transcript,
    liveMode,
    enableLiveMode,
    disableLiveMode,
    clearTranscript,
    startListening,
    stopListening,
    speak,
    stopSpeaking
  };
}
