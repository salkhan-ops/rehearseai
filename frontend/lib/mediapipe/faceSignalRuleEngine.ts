import type { FaceConversationSignal, FaceSignalState } from "./faceSignalTypes";

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function faceSignalRuleEngine(
  face: FaceSignalState | null,
  context: { transcriptStableMs?: number; silenceMs?: number; hasTranscript?: boolean } = {},
): FaceConversationSignal {
  if (!face?.faceDetected) {
    return {
      cameraAvailable: Boolean(face),
      faceDetected: false,
      userStateEstimate: "no_signal",
      confidence: 0,
      recommendedAction: "ignore_camera",
      reason: "no_face_detected",
    };
  }

  // Lowered thresholds: was lip>0.24 || mouth>0.42 — now catches softer/lateral speech
  if (face.lipMoving || face.lipMovementScore > 0.15 || face.mouthOpenScore > 0.28 || face.lateralLipScore > 0.14) {
    return {
      cameraAvailable: true,
      faceDetected: true,
      userStateEstimate: "actively_speaking",
      confidence: clamp01(0.58 + face.lipMovementScore + face.mouthOpenScore * 0.25 + face.lateralLipScore * 0.2),
      recommendedAction: "continue_listening",
      reason: "mouth_or_lip_movement_detected",
    };
  }

  // Lowered head movement threshold: was 0.16, now 0.12
  if (face.headMoving && face.headMovementIntensity > 0.12) {
    return {
      cameraAvailable: true,
      faceDetected: true,
      userStateEstimate: "likely_continuing",
      confidence: clamp01(0.58 + face.headMovementIntensity),
      recommendedAction: "wait_longer",
      reason: "head_movement_suggests_continuing",
    };
  }

  if (face.lookingAway && face.headMovementIntensity > 0.05) {
    return {
      cameraAvailable: true,
      faceDetected: true,
      userStateEstimate: "looking_away",
      confidence: clamp01(0.56 + face.lookingAwayScore),
      recommendedAction: "wait_longer",
      reason: "looking_away_or_thinking",
    };
  }

  // Lowered visual stillness threshold: was 6500ms, now 5000ms (more responsive)
  if (face.visualStillnessMs > 5000) {
    return {
      cameraAvailable: true,
      faceDetected: true,
      userStateEstimate: "frozen",
      confidence: 0.82,
      recommendedAction: context.hasTranscript ? "send_now" : "gentle_prompt",
      reason: "visual_stillness_very_high",
    };
  }

  // Lowered stillness requirements: transcriptStable 900→700ms, mouthStillness 900→700ms, visualStillness 800→600ms
  if (
    context.hasTranscript &&
    (context.transcriptStableMs || 0) > 700 &&
    face.mouthStillnessMs > 700 &&
    face.visualStillnessMs > 600 &&
    face.mouthOpenScore < 0.22 &&
    face.lipMovementScore < 0.12 &&
    face.lateralLipScore < 0.10 &&
    face.headMovementIntensity < 0.10
  ) {
    return {
      cameraAvailable: true,
      faceDetected: true,
      userStateEstimate: "likely_finished",
      confidence: 0.80,
      recommendedAction: "send_now",
      reason: "mouth_closed_and_transcript_stable",
    };
  }

  if (face.engagement === "thinking" || face.lookingAwayScore > 0.32) {
    return {
      cameraAvailable: true,
      faceDetected: true,
      userStateEstimate: "thinking",
      confidence: 0.66,
      recommendedAction: "wait_longer",
      reason: "visual_thinking_cues",
    };
  }

  return {
    cameraAvailable: true,
    faceDetected: true,
    userStateEstimate: "engaged_pause",
    confidence: 0.58,
    recommendedAction: "wait_longer",
    reason: "engaged_pause",
  };
}
