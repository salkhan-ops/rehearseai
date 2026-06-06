import { pauseFusionEngine } from "@/lib/local-signals/pauseFusionEngine";
import type { LocalCameraSignals, PauseFusionDecision, PersonalTimingBaseline } from "@/lib/local-signals/types";

export type NaturalTurnDecision =
  | "keep_listening"
  | "wait_longer"
  | "send_now"
  | "gentle_prompt"
  | "force_resolution"
  | "interrupt_ai";

export type NaturalPauseState =
  | "continue_listening"
  | "probably_thinking"
  | "uncertain"
  | "probably_finished"
  | "send_now"
  | "gentle_prompt"
  | "force_resolution";

export const SHORT_PAUSE_MS = 1200;
export const THINKING_PAUSE_MS = 3500;
export const SOFT_PROMPT_MS = 6000;
export const FORCE_DECISION_MS = 9000;
export const HARD_TIMEOUT_MS = 12000;

export type NaturalTurnTakingInput = {
  interimTranscript?: string;
  finalTranscript?: string;
  silenceMs: number;
  speechDurationMs: number;
  lastTranscriptUpdateMs?: number;
  gentlePromptShownAt?: number;
  hardTimeoutAt?: number;
  deepgramEndpointing?: boolean;
  cameraSignals?: LocalCameraSignals | null;
  personalBaseline?: PersonalTimingBaseline;
  aiSpeaking?: boolean;
};

export type NaturalTurnTakingResult = {
  decision: NaturalTurnDecision;
  pauseDecision: "continue_listening" | "wait_longer" | "send_now" | "gentle_prompt" | "force_resolution" | "interrupt_ai";
  pauseState: NaturalPauseState;
  reason: string;
  confidence: number;
  adjustedWaitMs: number;
  cameraAssisted: boolean;
  sourceDecision?: PauseFusionDecision;
};

const explicitWaitPhrases = [
  /\bwait\b/i,
  /\bone second\b/i,
  /\blet me think\b/i,
  /\bgive me a moment\b/i,
  /\bhold on\b/i,
  /\bjust a moment\b/i,
];

function hasText(input: NaturalTurnTakingInput) {
  return Boolean(`${input.finalTranscript || ""} ${input.interimTranscript || ""}`.trim());
}

function hasExplicitWaitPhrase(text: string) {
  return explicitWaitPhrases.some((pattern) => pattern.test(text));
}

function mapPauseDecision(decision: PauseFusionDecision): NaturalTurnTakingResult {
  if (decision.pauseDecision === "respond") {
    return {
      decision: "send_now",
      pauseDecision: "send_now",
      pauseState: "send_now",
      reason: decision.reason,
      confidence: decision.confidence,
      adjustedWaitMs: decision.adjustedWaitMs,
      cameraAssisted: decision.cameraAssisted,
      sourceDecision: decision,
    };
  }
  if (decision.pauseDecision === "gentle_prompt") {
    return {
      decision: "gentle_prompt",
      pauseDecision: "gentle_prompt",
      pauseState: "gentle_prompt",
      reason: decision.reason,
      confidence: decision.confidence,
      adjustedWaitMs: decision.adjustedWaitMs,
      cameraAssisted: decision.cameraAssisted,
      sourceDecision: decision,
    };
  }
  return {
    decision: decision.pauseDecision === "wait" ? "wait_longer" : "keep_listening",
    pauseDecision: decision.pauseDecision === "wait" ? "wait_longer" : "continue_listening",
    pauseState: decision.pauseDecision === "wait" ? "probably_thinking" : "continue_listening",
    reason: decision.reason,
    confidence: decision.confidence,
    adjustedWaitMs: decision.adjustedWaitMs,
    cameraAssisted: decision.cameraAssisted,
    sourceDecision: decision,
  };
}

export function naturalTurnTakingEngine(input: NaturalTurnTakingInput): NaturalTurnTakingResult {
  const transcript = `${input.finalTranscript || ""} ${input.interimTranscript || ""}`.replace(/\s+/g, " ").trim();
  const baseline = input.personalBaseline || {};
  const shortSilenceMs = SHORT_PAUSE_MS;
  const longSilenceMs = Math.max(THINKING_PAUSE_MS, Math.min(FORCE_DECISION_MS, baseline.longPauseThresholdMs || THINKING_PAUSE_MS));
  const transcriptStableMs = input.lastTranscriptUpdateMs ? Date.now() - input.lastTranscriptUpdateMs : 0;
  const cameraThinking =
    Boolean(input.cameraSignals?.faceDetected) &&
    ((input.cameraSignals?.mouthMovementIntensity || 0) > 0.14 ||
      (input.cameraSignals?.headMovementIntensity || 0) > 0.12 ||
      (input.cameraSignals?.gazeShiftFrequency || 0) > 0.1 ||
      (input.cameraSignals?.lookingAwayScore || 0) > 0.42);

  if (input.aiSpeaking && hasText(input)) {
    return {
      decision: "interrupt_ai",
      pauseDecision: "interrupt_ai",
      pauseState: "force_resolution",
      reason: "user_started_speaking_over_ai",
      confidence: 0.92,
      adjustedWaitMs: longSilenceMs,
      cameraAssisted: Boolean(input.cameraSignals?.faceDetected),
    };
  }

  if (input.silenceMs >= HARD_TIMEOUT_MS) {
    return {
      decision: "force_resolution",
      pauseDecision: "force_resolution",
      pauseState: "force_resolution",
      reason: transcript ? "hard_timeout_with_transcript" : "hard_timeout_empty_transcript",
      confidence: 1,
      adjustedWaitMs: HARD_TIMEOUT_MS,
      cameraAssisted: Boolean(input.cameraSignals?.faceDetected),
    };
  }

  if (input.silenceMs >= FORCE_DECISION_MS) {
    return {
      decision: "force_resolution",
      pauseDecision: "force_resolution",
      pauseState: "force_resolution",
      reason: transcript ? "force_resolution_with_transcript" : "force_resolution_empty_transcript",
      confidence: 0.96,
      adjustedWaitMs: FORCE_DECISION_MS,
      cameraAssisted: Boolean(input.cameraSignals?.faceDetected),
    };
  }

  if (!transcript) {
    if (input.silenceMs >= SOFT_PROMPT_MS) {
      return {
        decision: "gentle_prompt",
        pauseDecision: "gentle_prompt",
        pauseState: "gentle_prompt",
        reason: "empty_transcript_soft_prompt",
        confidence: 0.86,
        adjustedWaitMs: SOFT_PROMPT_MS,
        cameraAssisted: Boolean(input.cameraSignals?.faceDetected),
      };
    }
    return {
      decision: "keep_listening",
      pauseDecision: "continue_listening",
      pauseState: input.silenceMs >= shortSilenceMs ? "probably_thinking" : "continue_listening",
      reason: "empty_transcript",
      confidence: 0.72,
      adjustedWaitMs: longSilenceMs,
      cameraAssisted: Boolean(input.cameraSignals?.faceDetected),
    };
  }

  if (hasExplicitWaitPhrase(transcript)) {
    return {
      decision: "wait_longer",
      pauseDecision: "wait_longer",
      pauseState: "probably_thinking",
      reason: "explicit_wait_phrase",
      confidence: 0.95,
      adjustedWaitMs: longSilenceMs,
      cameraAssisted: Boolean(input.cameraSignals?.faceDetected),
    };
  }

  if (input.silenceMs < shortSilenceMs) {
    return {
      decision: "keep_listening",
      pauseDecision: "continue_listening",
      pauseState: "continue_listening",
      reason: "short_silence",
      confidence: 0.8,
      adjustedWaitMs: longSilenceMs,
      cameraAssisted: Boolean(input.cameraSignals?.faceDetected),
    };
  }

  if (input.silenceMs < THINKING_PAUSE_MS) {
    return {
      decision: "wait_longer",
      pauseDecision: "wait_longer",
      pauseState: "probably_thinking",
      reason: "thinking_pause_window",
      confidence: 0.78,
      adjustedWaitMs: longSilenceMs,
      cameraAssisted: Boolean(input.cameraSignals?.faceDetected),
    };
  }

  if (input.silenceMs >= SOFT_PROMPT_MS) {
    return {
      decision: "gentle_prompt",
      pauseDecision: "gentle_prompt",
      pauseState: "gentle_prompt",
      reason: cameraThinking ? "soft_prompt_camera_thinking" : "soft_prompt_uncertain",
      confidence: 0.82,
      adjustedWaitMs: SOFT_PROMPT_MS,
      cameraAssisted: Boolean(input.cameraSignals?.faceDetected),
    };
  }

  if (input.silenceMs >= THINKING_PAUSE_MS && transcriptStableMs >= 3000 && !cameraThinking) {
    return {
      decision: "send_now",
      pauseDecision: "send_now",
      pauseState: "probably_finished",
      reason: "stable_transcript_no_visual_continue",
      confidence: 0.86,
      adjustedWaitMs: longSilenceMs,
      cameraAssisted: Boolean(input.cameraSignals?.faceDetected),
    };
  }

  if (cameraThinking) {
    return {
      decision: "wait_longer",
      pauseDecision: "wait_longer",
      pauseState: "probably_thinking",
      reason: "camera_suggests_thinking_bounded",
      confidence: 0.82,
      adjustedWaitMs: Math.min(FORCE_DECISION_MS, longSilenceMs + 1200),
      cameraAssisted: true,
    };
  }

  return mapPauseDecision(pauseFusionEngine(
    {
      finalTranscript: input.finalTranscript,
      interimTranscript: input.interimTranscript,
      speechDurationMs: input.speechDurationMs,
      silenceMs: input.silenceMs,
      deepgramEndpointing: input.deepgramEndpointing,
    },
    input.cameraSignals || null,
    baseline,
  ));
}
