import type { LocalPauseFeatures } from "./localFeatureExtractor";

export type LocalPauseIntent = "thinking" | "finished" | "frozen" | "confused_or_hesitant" | "continue_listening";

export type LocalPausePrediction = {
  intent: LocalPauseIntent;
  confidence: number;
};

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function predictPauseIntent(features: LocalPauseFeatures): LocalPausePrediction {
  const longPause = Math.max(1800, features.longPauseThresholdMs);
  const extremePause = Math.max(8500, longPause * 2.35);
  const visualActivity = features.mouthMovementActivity + features.headMovementIntensity + features.gazeShiftFrequency;

  if (features.hasExplicitWaitPhrase) {
    return { intent: "thinking", confidence: 0.92 };
  }

  if (features.transcriptGrowing || visualActivity > 0.34) {
    return { intent: "continue_listening", confidence: clamp01(0.58 + visualActivity * 0.42) };
  }

  if (features.silenceMs > extremePause && features.faceDetected && features.visualStillnessMs > longPause) {
    return { intent: "frozen", confidence: 0.84 };
  }

  if (features.silenceMs > longPause && features.fillerWordRate > Math.max(0.08, features.hesitationMarkerRate)) {
    return { intent: "confused_or_hesitant", confidence: 0.72 };
  }

  if (features.silenceMs > longPause) {
    return { intent: "finished", confidence: features.faceDetected ? 0.78 : 0.7 };
  }

  return { intent: "thinking", confidence: 0.62 };
}
