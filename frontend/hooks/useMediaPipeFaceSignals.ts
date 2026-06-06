"use client";

import { RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaceFeatureExtractor } from "@/lib/mediapipe/faceFeatureExtractor";
import { faceLandmarkerService } from "@/lib/mediapipe/faceLandmarkerService";
import { faceSignalRuleEngine } from "@/lib/mediapipe/faceSignalRuleEngine";
import {
  defaultFaceConversationSignal,
  defaultFaceSignalState,
  type FaceConversationSignal,
  type FaceSignalState,
  type MediaPipeFaceStatus,
} from "@/lib/mediapipe/faceSignalTypes";

type Options = {
  enabled: boolean;
  fps?: number;
  transcriptStableMs?: number;
  silenceMs?: number;
  hasTranscript?: boolean;
};

export function useMediaPipeFaceSignals({
  enabled,
  fps = 12,
  transcriptStableMs = 0,
  silenceMs = 0,
  hasTranscript = false,
}: Options): {
  enabled: boolean;
  status: MediaPipeFaceStatus;
  videoRef: RefObject<HTMLVideoElement | null>;
  start: () => Promise<void>;
  stop: () => void;
  faceSignalState: FaceSignalState;
  conversationSignal: FaceConversationSignal;
  error: string;
  mediaPipeLoaded: boolean;
  cameraPermission: "unknown" | "prompt" | "granted" | "denied" | "error";
} {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const extractorRef = useRef(new FaceFeatureExtractor());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [status, setStatus] = useState<MediaPipeFaceStatus>(enabled ? "idle" : "idle");
  const [error, setError] = useState("");
  const [mediaPipeLoaded, setMediaPipeLoaded] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<"unknown" | "prompt" | "granted" | "denied" | "error">("unknown");
  const [faceSignalState, setFaceSignalState] = useState<FaceSignalState>(defaultFaceSignalState);
  const [conversationSignal, setConversationSignal] = useState<FaceConversationSignal>(defaultFaceConversationSignal);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const sample = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const result = faceLandmarkerService.detectFrame(video);
    const timestamp = Date.now();
    const nextFace = extractorRef.current.extract(result, timestamp);
    const nextConversation = faceSignalRuleEngine(nextFace, { transcriptStableMs, silenceMs, hasTranscript });
    setFaceSignalState(nextFace);
    setConversationSignal(nextConversation);
  }, [hasTranscript, silenceMs, transcriptStableMs]);

  const start = useCallback(async () => {
    if (!enabled) return;
    const video = videoRef.current;
    if (!video) return;
    stopTimer();
    extractorRef.current.reset();
    setError("");
    setStatus("loading_model");
    try {
      await faceLandmarkerService.startCamera(video);
      const intervalMs = Math.max(66, Math.round(1000 / Math.max(10, Math.min(15, fps))));
      timerRef.current = setInterval(sample, intervalMs);
      sample();
    } catch (err) {
      faceLandmarkerService.stopCamera();
      setError(err instanceof Error ? err.message : "Camera-assisted timing failed.");
      setConversationSignal({ ...defaultFaceConversationSignal, reason: "camera_failed_voice_only_fallback" });
    }
  }, [enabled, fps, sample, stopTimer]);

  const stop = useCallback(() => {
    stopTimer();
    faceLandmarkerService.stopCamera();
    extractorRef.current.reset();
    setFaceSignalState(defaultFaceSignalState);
    setConversationSignal(defaultFaceConversationSignal);
    setError("");
    setStatus("idle");
  }, [stopTimer]);

  useEffect(() => {
    return faceLandmarkerService.subscribe((snapshot) => {
      setStatus(snapshot.status);
      setError(snapshot.error);
      setMediaPipeLoaded(snapshot.mediaPipeLoaded);
      setCameraPermission(snapshot.cameraPermission);
    });
  }, []);

  useEffect(() => {
    if (!enabled) {
      stop();
      return undefined;
    }
    let cancelled = false;
    window.setTimeout(() => {
      if (!cancelled) start().catch(() => undefined);
    }, 0);
    return () => {
      cancelled = true;
      stop();
    };
  }, [enabled, start, stop]);

  useEffect(() => {
    if (!enabled || !faceSignalState.timestamp) return;
    setConversationSignal(faceSignalRuleEngine(faceSignalState, { transcriptStableMs, silenceMs, hasTranscript }));
  }, [enabled, faceSignalState, hasTranscript, silenceMs, transcriptStableMs]);

  return useMemo(() => ({
    enabled,
    status,
    videoRef,
    start,
    stop,
    faceSignalState,
    conversationSignal,
    error,
    mediaPipeLoaded,
    cameraPermission,
  }), [cameraPermission, conversationSignal, enabled, error, faceSignalState, mediaPipeLoaded, start, status, stop]);
}
