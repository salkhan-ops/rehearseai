import { extractLocalPauseFeatures } from "@/lib/local-ml/localFeatureExtractor";
import { predictPauseIntent } from "@/lib/local-ml/localPauseClassifier";
import type {
  LocalCameraSignals,
  PauseFusionDecision,
  PersonalTimingBaseline,
  VoiceTimingSignals,
} from "./types";

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function pauseFusionEngine(
  voice: VoiceTimingSignals,
  camera: LocalCameraSignals | null,
  baseline: PersonalTimingBaseline = {},
): PauseFusionDecision {
  const features = extractLocalPauseFeatures(voice, camera, baseline);
  const prediction = predictPauseIntent(features);
  const cameraAssisted = Boolean(camera?.faceDetected);
  const adjustedWaitMs = Math.max(
    1800,
    Math.min(9000, Math.round((baseline.longPauseThresholdMs || 3400) * (1 + Math.min(0.45, features.hesitationMarkerRate || 0)))),
  );
  const extremeWaitMs = Math.max(8500, adjustedWaitMs * 2.35);

  if (features.hasExplicitWaitPhrase) {
    return {
      pauseDecision: "wait",
      confidence: 0.94,
      reason: "explicit_wait_phrase",
      adjustedWaitMs,
      userStateApprox: "thinking",
      cameraAssisted,
    };
  }

  if (!cameraAssisted && voice.deepgramEndpointing && voice.silenceMs >= adjustedWaitMs) {
    return {
      pauseDecision: "respond",
      confidence: 0.72,
      reason: "voice_endpoint_detected",
      adjustedWaitMs,
      userStateApprox: "finished",
      cameraAssisted: false,
    };
  }

  if (!cameraAssisted && voice.silenceMs < adjustedWaitMs) {
    return {
      pauseDecision: "keep_listening",
      confidence: 0.64,
      reason: "no_face_signal",
      adjustedWaitMs,
      userStateApprox: "continue_listening",
      cameraAssisted: false,
    };
  }

  const visualPreparing =
    features.mouthMovementActivity > 0.18 ||
    features.headMovementIntensity > 0.14 ||
    features.gazeShiftFrequency > 0.12 ||
    features.lookingAwayScore > 0.42;

  if (cameraAssisted && voice.silenceMs >= adjustedWaitMs && visualPreparing) {
    return {
      pauseDecision: "keep_listening",
      confidence: clamp01(0.66 + features.mouthMovementActivity + features.headMovementIntensity),
      reason: "visual_preparing_to_continue",
      adjustedWaitMs,
      userStateApprox: "continue_listening",
      cameraAssisted,
    };
  }

  if (voice.silenceMs >= extremeWaitMs && cameraAssisted && features.visualStillnessMs >= adjustedWaitMs) {
    return {
      pauseDecision: "gentle_prompt",
      confidence: 0.83,
      reason: "frozen_long_pause",
      adjustedWaitMs,
      userStateApprox: "frozen",
      cameraAssisted,
    };
  }

  if (prediction.intent === "continue_listening" || prediction.intent === "thinking") {
    return {
      pauseDecision: voice.silenceMs >= adjustedWaitMs ? "wait" : "keep_listening",
      confidence: prediction.confidence,
      reason: "user_still_thinking",
      adjustedWaitMs,
      userStateApprox: prediction.intent === "thinking" ? "thinking" : "continue_listening",
      cameraAssisted,
    };
  }

  if (voice.speechDurationMs > 90000 || (voice.wordsPerMinute || 0) > Math.max(180, (baseline.averageWordsPerMinute || 125) * 1.45)) {
    return {
      pauseDecision: "respond",
      confidence: 0.72,
      reason: "overlong_answer",
      adjustedWaitMs,
      userStateApprox: "finished",
      cameraAssisted,
    };
  }

  return {
    pauseDecision: "respond",
    confidence: prediction.confidence,
    reason: "user_finished",
    adjustedWaitMs,
    userStateApprox: prediction.intent === "confused_or_hesitant" ? "confused_or_hesitant" : "finished",
    cameraAssisted,
  };
}
