import type { VoiceProfile } from "@/lib/types";

export type CameraSignalState =
  | "unavailable"
  | "disabled"
  | "permission_required"
  | "initializing"
  | "active"
  | "face_not_found"
  | "poor_lighting"
  | "error";

export type LocalCameraSignals = {
  faceDetected: boolean;
  faceConfidence: number;
  headStabilityScore: number;
  headMovementIntensity: number;
  headTiltApprox: number;
  lookingAwayScore: number;
  gazeApproximation: number;
  gazeAwayCount: number;
  blinkRateApprox: number;
  eyeStabilityScore: number;
  mouthOpenScore: number;
  mouthMovementIntensity: number;
  lipMovementActivity: number;
  mouthStillnessDurationMs: number;
  visualStillnessMs: number;
  gazeShiftFrequency: number;
  postureShiftFrequency: number;
  lightingScore: number;
  sampledAt: number;
};

export type VoiceTimingSignals = {
  silenceMs: number;
  speechDurationMs: number;
  interimTranscript?: string;
  finalTranscript?: string;
  deepgramEndpointing?: boolean;
  fillerWords?: number;
  wordsPerMinute?: number;
};

export type PersonalTimingBaseline = Partial<VoiceProfile> & {
  averagePauseMs?: number;
  longPauseThresholdMs?: number;
  averageWordsPerMinute?: number;
  hesitationMarkerRate?: number;
  averageVisualThinkingPauseMs?: number;
  typicalMouthActivityBeforeContinue?: number;
  typicalGazeShiftDuringThinking?: number;
};

export type PauseDecision = "wait" | "respond" | "gentle_prompt" | "interrupt" | "keep_listening";

export type PauseDecisionReason =
  | "user_still_thinking"
  | "user_finished"
  | "visual_preparing_to_continue"
  | "frozen_long_pause"
  | "no_face_signal"
  | "voice_endpoint_detected"
  | "explicit_wait_phrase"
  | "overlong_answer";

export type PauseFusionDecision = {
  pauseDecision: PauseDecision;
  confidence: number;
  reason: PauseDecisionReason;
  adjustedWaitMs: number;
  userStateApprox: "thinking" | "finished" | "frozen" | "confused_or_hesitant" | "continue_listening";
  cameraAssisted: boolean;
};

export const defaultCameraSignals: LocalCameraSignals = {
  faceDetected: false,
  faceConfidence: 0,
  headStabilityScore: 1,
  headMovementIntensity: 0,
  headTiltApprox: 0,
  lookingAwayScore: 0,
  gazeApproximation: 0,
  gazeAwayCount: 0,
  blinkRateApprox: 0,
  eyeStabilityScore: 1,
  mouthOpenScore: 0,
  mouthMovementIntensity: 0,
  lipMovementActivity: 0,
  mouthStillnessDurationMs: 0,
  visualStillnessMs: 0,
  gazeShiftFrequency: 0,
  postureShiftFrequency: 0,
  lightingScore: 0,
  sampledAt: 0,
};
