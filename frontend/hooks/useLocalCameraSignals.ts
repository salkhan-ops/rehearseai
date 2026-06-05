"use client";

import { RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { defaultCameraSignals, type CameraSignalState, type LocalCameraSignals } from "@/lib/local-signals/types";

type Options = {
  enabled: boolean;
  sampleMs?: number;
};

type NativeFaceDetector = {
  detect: (source: CanvasImageSource) => Promise<Array<{ boundingBox?: DOMRectReadOnly }>>;
};

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function stateMessage(state: CameraSignalState) {
  if (state === "disabled") return "Camera assistance is off.";
  if (state === "active") return "Camera assistance active. Video stays on your device.";
  if (state === "face_not_found") return "Face not detected.";
  if (state === "poor_lighting") return "Lighting may be too low.";
  if (state === "unavailable") return "Camera unavailable.";
  if (state === "permission_required") return "Camera permission required.";
  if (state === "initializing") return "Starting camera assistance.";
  return "Camera assistance could not start.";
}

function regionAverage(data: Uint8ClampedArray, width: number, x0: number, y0: number, x1: number, y1: number) {
  let total = 0;
  let count = 0;
  const sx = Math.max(0, Math.floor(x0));
  const sy = Math.max(0, Math.floor(y0));
  const ex = Math.min(width, Math.ceil(x1));
  const ey = Math.min(Math.floor(data.length / 4 / width), Math.ceil(y1));
  for (let y = sy; y < ey; y += 2) {
    for (let x = sx; x < ex; x += 2) {
      const index = (y * width + x) * 4;
      total += (data[index] + data[index + 1] + data[index + 2]) / 3;
      count += 1;
    }
  }
  return count ? total / count / 255 : 0;
}

export function useLocalCameraSignals({ enabled, sampleMs = 240 }: Options): {
  videoRef: RefObject<HTMLVideoElement | null>;
  state: CameraSignalState;
  message: string;
  signals: LocalCameraSignals;
  error: string;
  previewVisible: boolean;
  setPreviewVisible: (visible: boolean) => void;
  stop: () => void;
} {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<NativeFaceDetector | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastDataRef = useRef<Uint8ClampedArray | null>(null);
  const lastMouthRef = useRef(0);
  const lastEyeRef = useRef(0);
  const lastCenterRef = useRef<{ x: number; y: number } | null>(null);
  const lastActiveAtRef = useRef(Date.now());
  const lastMouthActiveAtRef = useRef(Date.now());
  const gazeAwayCountRef = useRef(0);
  const blinkCountRef = useRef(0);
  const [state, setState] = useState<CameraSignalState>(enabled ? "permission_required" : "disabled");
  const [signals, setSignals] = useState<LocalCameraSignals>(defaultCameraSignals);
  const [error, setError] = useState("");
  const [previewVisible, setPreviewVisible] = useState(false);

  const stop = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    lastDataRef.current = null;
    setSignals(defaultCameraSignals);
    setState("disabled");
  }, []);

  const sample = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;
    const width = 160;
    const height = 120;
    const canvas = canvasRef.current || document.createElement("canvas");
    canvasRef.current = canvas;
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;
    context.drawImage(video, 0, 0, width, height);
    const image = context.getImageData(0, 0, width, height);
    const data = image.data;
    const lightingScore = regionAverage(data, width, 0, 0, width, height);

    let faceBox = { x: width * 0.22, y: height * 0.12, width: width * 0.56, height: height * 0.76 };
    let faceDetected = lightingScore > 0.12;
    let faceConfidence = faceDetected ? 0.42 : 0;
    try {
      const faces = detectorRef.current ? await detectorRef.current.detect(canvas) : [];
      const box = faces[0]?.boundingBox;
      if (box) {
        faceBox = { x: box.x, y: box.y, width: box.width, height: box.height };
        faceDetected = true;
        faceConfidence = 0.86;
      }
    } catch {
      detectorRef.current = null;
    }

    const last = lastDataRef.current;
    let frameDelta = 0;
    if (last && last.length === data.length) {
      for (let index = 0; index < data.length; index += 16) {
        frameDelta += Math.abs(data[index] - last[index]);
      }
      frameDelta = frameDelta / (data.length / 16) / 255;
    }
    lastDataRef.current = new Uint8ClampedArray(data);

    const eye = regionAverage(data, width, faceBox.x + faceBox.width * 0.18, faceBox.y + faceBox.height * 0.22, faceBox.x + faceBox.width * 0.82, faceBox.y + faceBox.height * 0.42);
    const mouth = regionAverage(data, width, faceBox.x + faceBox.width * 0.28, faceBox.y + faceBox.height * 0.62, faceBox.x + faceBox.width * 0.72, faceBox.y + faceBox.height * 0.82);
    const mouthMovementIntensity = Math.abs(mouth - lastMouthRef.current);
    const eyeMovement = Math.abs(eye - lastEyeRef.current);
    lastMouthRef.current = mouth;
    lastEyeRef.current = eye;

    const center = { x: faceBox.x + faceBox.width / 2, y: faceBox.y + faceBox.height / 2 };
    const previousCenter = lastCenterRef.current;
    const headMovementIntensity = previousCenter ? clamp01((Math.abs(center.x - previousCenter.x) + Math.abs(center.y - previousCenter.y)) / 34 + frameDelta) : frameDelta;
    lastCenterRef.current = center;
    const lookingAwayScore = clamp01(Math.abs(center.x - width / 2) / (width / 2));
    const active = headMovementIntensity > 0.08 || mouthMovementIntensity > 0.05 || eyeMovement > 0.04;
    if (active) lastActiveAtRef.current = Date.now();
    if (mouthMovementIntensity > 0.035) lastMouthActiveAtRef.current = Date.now();
    if (lookingAwayScore > 0.42) gazeAwayCountRef.current += 1;
    if (eyeMovement > 0.08) blinkCountRef.current += 1;

    const next: LocalCameraSignals = {
      faceDetected,
      faceConfidence,
      headStabilityScore: clamp01(1 - headMovementIntensity),
      headMovementIntensity: clamp01(headMovementIntensity),
      headTiltApprox: clamp01((center.x - width / 2) / (width / 2)),
      lookingAwayScore,
      gazeApproximation: clamp01(1 - lookingAwayScore),
      gazeAwayCount: gazeAwayCountRef.current,
      blinkRateApprox: clamp01(blinkCountRef.current / 30),
      eyeStabilityScore: clamp01(1 - eyeMovement),
      mouthOpenScore: clamp01(mouth),
      mouthMovementIntensity: clamp01(mouthMovementIntensity * 4),
      lipMovementActivity: clamp01((mouthMovementIntensity + frameDelta) * 3),
      mouthStillnessDurationMs: Date.now() - lastMouthActiveAtRef.current,
      visualStillnessMs: Date.now() - lastActiveAtRef.current,
      gazeShiftFrequency: clamp01(eyeMovement * 4 + lookingAwayScore * 0.25),
      postureShiftFrequency: clamp01(headMovementIntensity),
      lightingScore,
      sampledAt: Date.now(),
    };
    setSignals(next);
    setState(!faceDetected ? "face_not_found" : lightingScore < 0.16 ? "poor_lighting" : "active");
  }, []);

  useEffect(() => {
    if (!enabled) {
      stop();
      return undefined;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setState("unavailable");
      return undefined;
    }
    let cancelled = false;
    setState("initializing");
    setError("");
    const Detector = (window as unknown as { FaceDetector?: new (options?: unknown) => NativeFaceDetector }).FaceDetector;
    detectorRef.current = Detector ? new Detector({ fastMode: true, maxDetectedFaces: 1 }) : null;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 320 }, height: { ideal: 240 } }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.muted = true;
          videoRef.current.playsInline = true;
          videoRef.current.play().catch(() => undefined);
        }
        timerRef.current = setInterval(() => sample().catch(() => undefined), sampleMs);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Camera permission was not granted.");
        setState("permission_required");
      });
    return () => {
      cancelled = true;
      stop();
    };
  }, [enabled, sample, sampleMs, stop]);

  return useMemo(() => ({
    videoRef,
    state,
    message: stateMessage(state),
    signals,
    error,
    previewVisible,
    setPreviewVisible,
    stop,
  }), [error, previewVisible, signals, state, stop]);
}
