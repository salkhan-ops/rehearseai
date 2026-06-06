"use client";

import { RefObject, useMemo, useState } from "react";
import { useMediaPipeFaceSignals } from "@/hooks/useMediaPipeFaceSignals";
import { defaultCameraSignals, type CameraSignalState, type LocalCameraSignals } from "@/lib/local-signals/types";

type Options = {
  enabled: boolean;
  fps?: number;
  transcriptStableMs?: number;
  silenceMs?: number;
  hasTranscript?: boolean;
};

function stateMessage(state: CameraSignalState) {
  if (state === "disabled") return "Camera timing off";
  if (state === "active") return "Camera timing active";
  if (state === "face_not_found") return "Face not detected";
  if (state === "unavailable") return "MediaPipe unavailable";
  if (state === "permission_required") return "Voice-only fallback";
  if (state === "initializing") return "Loading MediaPipe camera timing";
  return "Voice-only fallback";
}

function mapStatus(status: ReturnType<typeof useMediaPipeFaceSignals>["status"], enabled: boolean): CameraSignalState {
  if (!enabled) return "disabled";
  if (status === "loading_model" || status === "requesting_permission" || status === "idle") return "initializing";
  if (status === "active") return "active";
  if (status === "no_face") return "face_not_found";
  if (status === "unavailable") return "unavailable";
  return "error";
}

export function useLocalCameraSignals({ enabled, fps = 12, transcriptStableMs = 0, silenceMs = 0, hasTranscript = false }: Options): {
  videoRef: RefObject<HTMLVideoElement | null>;
  state: CameraSignalState;
  message: string;
  signals: LocalCameraSignals;
  error: string;
  previewVisible: boolean;
  setPreviewVisible: (visible: boolean) => void;
  stop: () => void;
  mediaPipeLoaded: boolean;
  cameraPermission: "unknown" | "prompt" | "granted" | "denied" | "error";
  faceSignalState: ReturnType<typeof useMediaPipeFaceSignals>["faceSignalState"];
  conversationSignal: ReturnType<typeof useMediaPipeFaceSignals>["conversationSignal"];
} {
  const mediaPipe = useMediaPipeFaceSignals({ enabled, fps, transcriptStableMs, silenceMs, hasTranscript });
  const [previewVisible, setPreviewVisible] = useState(false);
  const state = mapStatus(mediaPipe.status, enabled);
  const signals = useMemo<LocalCameraSignals>(() => {
    const face = mediaPipe.faceSignalState;
    if (!enabled || !face.faceDetected) return defaultCameraSignals;
    return {
      faceDetected: face.faceDetected,
      faceConfidence: face.faceConfidence,
      headStabilityScore: Math.max(0, Math.min(1, 1 - face.headMovementIntensity)),
      headMovementIntensity: face.headMovementIntensity,
      headTiltApprox: Math.max(-1, Math.min(1, ((face.headRoll || 0) / 30 + 1) / 2)),
      lookingAwayScore: face.lookingAwayScore,
      gazeApproximation: Math.max(0, Math.min(1, 1 - face.lookingAwayScore)),
      gazeAwayCount: face.lookingAway ? 1 : 0,
      blinkRateApprox: face.blinkRateApprox,
      eyeStabilityScore: face.blinking ? 0.2 : 0.9,
      mouthOpenScore: face.mouthOpenScore,
      mouthMovementIntensity: face.lipMovementScore,
      lipMovementActivity: face.lipMovementScore,
      mouthStillnessDurationMs: face.mouthStillnessMs,
      visualStillnessMs: face.visualStillnessMs,
      gazeShiftFrequency: face.lookingAwayScore,
      postureShiftFrequency: face.headMovementIntensity,
      lightingScore: 1,
      sampledAt: face.timestamp,
    };
  }, [enabled, mediaPipe.faceSignalState]);

  return useMemo(() => ({
    videoRef: mediaPipe.videoRef,
    state,
    message: stateMessage(state),
    signals,
    error: mediaPipe.error,
    previewVisible,
    setPreviewVisible,
    stop: mediaPipe.stop,
    mediaPipeLoaded: mediaPipe.mediaPipeLoaded,
    cameraPermission: mediaPipe.cameraPermission,
    faceSignalState: mediaPipe.faceSignalState,
    conversationSignal: mediaPipe.conversationSignal,
  }), [mediaPipe, previewVisible, signals, state]);
}
