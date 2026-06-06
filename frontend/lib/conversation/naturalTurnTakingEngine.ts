import { pauseFusionEngine } from "@/lib/local-signals/pauseFusionEngine";
import type { LocalCameraSignals, PauseFusionDecision, PersonalTimingBaseline } from "@/lib/local-signals/types";

export type NaturalTurnDecision =
  | "keep_listening"
  | "wait_longer"
  | "send_now"
  | "gentle_prompt"
  | "interrupt_ai";

export type NaturalTurnTakingInput = {
  interimTranscript?: string;
  finalTranscript?: string;
  silenceMs: number;
  speechDurationMs: number;
  lastTranscriptUpdateMs?: number;
  deepgramEndpointing?: boolean;
  cameraSignals?: LocalCameraSignals | null;
  personalBaseline?: PersonalTimingBaseline;
  aiSpeaking?: boolean;
};

export type NaturalTurnTakingResult = {
  decision: NaturalTurnDecision;
  pauseDecision: "continue_listening" | "wait_longer" | "send_now" | "gentle_prompt" | "interrupt_ai";
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
  const shortSilenceMs = Math.max(900, Math.round((baseline.shortPauseThresholdMs || 1300) * 0.85));
  const longSilenceMs = Math.max(2200, baseline.longPauseThresholdMs || 3400);

  if (input.aiSpeaking && hasText(input)) {
    return {
      decision: "interrupt_ai",
      pauseDecision: "interrupt_ai",
      reason: "user_started_speaking_over_ai",
      confidence: 0.92,
      adjustedWaitMs: longSilenceMs,
      cameraAssisted: Boolean(input.cameraSignals?.faceDetected),
    };
  }

  if (!transcript) {
    return {
      decision: "keep_listening",
      pauseDecision: "continue_listening",
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
      reason: "short_silence",
      confidence: 0.8,
      adjustedWaitMs: longSilenceMs,
      cameraAssisted: Boolean(input.cameraSignals?.faceDetected),
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
