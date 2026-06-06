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

  if (face.lipMoving || face.lipMovementScore > 0.24 || face.mouthOpenScore > 0.42) {
    return {
      cameraAvailable: true,
      faceDetected: true,
      userStateEstimate: "actively_speaking",
      confidence: clamp01(0.58 + face.lipMovementScore + face.mouthOpenScore * 0.25),
      recommendedAction: "continue_listening",
      reason: "mouth_or_lip_movement_detected",
    };
  }

  if (face.headMoving && face.headMovementIntensity > 0.16) {
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

  if (face.visualStillnessMs > 6500) {
    return {
      cameraAvailable: true,
      faceDetected: true,
      userStateEstimate: "frozen",
      confidence: 0.82,
      recommendedAction: context.hasTranscript ? "send_now" : "gentle_prompt",
      reason: "visual_stillness_very_high",
    };
  }

  if (
    context.hasTranscript &&
    (context.transcriptStableMs || 0) > 1300 &&
    face.mouthStillnessMs > 1200 &&
    face.visualStillnessMs > 1000 &&
    face.mouthOpenScore < 0.24 &&
    face.lipMovementScore < 0.12
  ) {
    return {
      cameraAvailable: true,
      faceDetected: true,
      userStateEstimate: "likely_finished",
      confidence: 0.78,
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
