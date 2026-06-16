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

// Persistent canvas for lighting score computation — allocated once, reused each frame
let lightingCanvas: HTMLCanvasElement | null = null;
let lightingCtx: CanvasRenderingContext2D | null = null;

function getLightingCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
  if (typeof document === "undefined") return null;
  if (!lightingCanvas) {
    lightingCanvas = document.createElement("canvas");
    lightingCanvas.width = 32;
    lightingCanvas.height = 32;
    lightingCtx = lightingCanvas.getContext("2d", { willReadFrequently: true });
  }
  if (!lightingCtx) return null;
  return { canvas: lightingCanvas, ctx: lightingCtx };
}

function computeLightingScore(video: HTMLVideoElement): number {
  try {
    if (video.readyState < 2 || video.videoWidth === 0) return 1;
    const lc = getLightingCanvas();
    if (!lc) return 1;
    lc.ctx.drawImage(video, 0, 0, 32, 32);
    const data = lc.ctx.getImageData(0, 0, 32, 32).data;
    let totalLum = 0;
    for (let i = 0; i < data.length; i += 4) {
      totalLum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }
    const avgLum = totalLum / (data.length / 4); // 0-255
    if (avgLum < 15) return 0.1;
    if (avgLum > 235) return 0.25;
    if (avgLum < 35) return 0.4;
    if (avgLum > 215) return 0.5;
    // Normalize comfortable range 35-215 → 0.5-1.0
    return Math.min(1, 0.5 + (Math.min(avgLum, 165) - 35) / 260);
  } catch {
    return 1;
  }
}

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
  const lightingFrameCountRef = useRef(0);
  const conversationContextRef = useRef({ transcriptStableMs, silenceMs, hasTranscript });
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

  useEffect(() => {
    conversationContextRef.current = { transcriptStableMs, silenceMs, hasTranscript };
  }, [hasTranscript, silenceMs, transcriptStableMs]);

  const sample = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const result = faceLandmarkerService.detectFrame(video);
    const timestamp = Date.now();
    const nextFace = extractorRef.current.extract(result, timestamp);

    // Compute lighting score every 10 frames to keep overhead low
    lightingFrameCountRef.current += 1;
    let lightingScore = nextFace.lightingScore;
    if (lightingFrameCountRef.current % 10 === 0) {
      lightingScore = computeLightingScore(video);
    }

    const faceWithLighting = { ...nextFace, lightingScore };
    const nextConversation = faceSignalRuleEngine(faceWithLighting, conversationContextRef.current);
    setFaceSignalState(faceWithLighting);
    setConversationSignal(nextConversation);
  }, []);

  const start = useCallback(async () => {
    if (!enabled) return;
    const video = videoRef.current;
    if (!video) return;
    stopTimer();
    extractorRef.current.reset();
    lightingFrameCountRef.current = 0;
    setError("");
    setStatus("loading_model");
    try {
      await faceLandmarkerService.startCamera(video);
      // Allow up to 24fps (42ms interval); default fps=12 → 83ms
      const intervalMs = Math.max(42, Math.round(1000 / Math.max(10, Math.min(24, fps))));
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
    setFaceSignalState((current) => current === defaultFaceSignalState ? current : defaultFaceSignalState);
    setConversationSignal((current) => current === defaultFaceConversationSignal ? current : defaultFaceConversationSignal);
    setError((current) => current === "" ? current : "");
    setStatus((current) => current === "idle" ? current : "idle");
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
