import type { FaceLandmarkerResult } from "@mediapipe/tasks-vision";

export type MediaPipeFaceStatus =
  | "idle"
  | "loading_model"
  | "requesting_permission"
  | "active"
  | "no_face"
  | "error"
  | "unavailable";

export type LookDirection = "center" | "left" | "right" | "up" | "down" | "unknown";

export type FaceEngagement = "engaged" | "thinking" | "looking_away" | "inactive" | "no_face";

export type FaceSignalState = {
  faceDetected: boolean;
  faceConfidence: number;
  blinking: boolean;
  blinkRateApprox: number;
  mouthOpen: boolean;
  mouthOpenScore: number;
  lipMoving: boolean;
  lipMovementScore: number;
  mouthStillnessMs: number;
  smiling: boolean;
  smileScore: number;
  laughingLikely: boolean;
  lookingAway: boolean;
  lookDirection: LookDirection;
  lookingAwayScore: number;
  headMoving: boolean;
  headMovementIntensity: number;
  headYaw?: number;
  headPitch?: number;
  headRoll?: number;
  visualStillnessMs: number;
  engagement: FaceEngagement;
  timestamp: number;
};

export type FaceConversationSignal = {
  cameraAvailable: boolean;
  faceDetected: boolean;
  userStateEstimate:
    | "no_signal"
    | "actively_speaking"
    | "likely_continuing"
    | "thinking"
    | "engaged_pause"
    | "looking_away"
    | "likely_finished"
    | "frozen";
  confidence: number;
  recommendedAction:
    | "ignore_camera"
    | "continue_listening"
    | "wait_longer"
    | "send_now"
    | "gentle_prompt";
  reason: string;
};

export type FaceFrameInput = {
  result: FaceLandmarkerResult;
  timestamp: number;
};

export const defaultFaceSignalState: FaceSignalState = {
  faceDetected: false,
  faceConfidence: 0,
  blinking: false,
  blinkRateApprox: 0,
  mouthOpen: false,
  mouthOpenScore: 0,
  lipMoving: false,
  lipMovementScore: 0,
  mouthStillnessMs: 0,
  smiling: false,
  smileScore: 0,
  laughingLikely: false,
  lookingAway: false,
  lookDirection: "unknown",
  lookingAwayScore: 0,
  headMoving: false,
  headMovementIntensity: 0,
  visualStillnessMs: 0,
  engagement: "no_face",
  timestamp: 0,
};

export const defaultFaceConversationSignal: FaceConversationSignal = {
  cameraAvailable: false,
  faceDetected: false,
  userStateEstimate: "no_signal",
  confidence: 0,
  recommendedAction: "ignore_camera",
  reason: "camera_not_active",
};
