import type { Difficulty, PracticeType, Report, Session, VoiceProfile } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type PrivacySettings = {
  allowTelemetry: boolean;
  allowModelImprovement: boolean;
  allowRawAudioStorage: boolean;
};

export type TurnTelemetryPayload = {
  userId: string;
  sessionId: string;
  turnId?: string;
  practiceType: PracticeType | string;
  difficulty: Difficulty | string;
  language?: string;
  transcript: string;
  speechDurationMs?: number;
  silenceBeforeMs?: number;
  silenceAfterMs?: number;
  silenceMs?: number;
  pausesMs?: number[];
  userTurnIndex?: number;
  aiTurnIndex?: number;
  responseLatencyMs?: number;
  aiWaitedMs?: number;
  aiResponseText?: string;
  recommendedAiTone?: string;
  recommendedResponseLength?: string;
  detectedUserState?: string;
  detectedPressureState?: string;
  detectedPauseType?: string;
  userInterruptedAi?: boolean;
  aiInterruptedUser?: boolean;
};

export type SessionOutcomePayload = {
  userId: string;
  sessionId: string;
  practiceType: PracticeType | string;
  difficulty: Difficulty | string;
  completed: boolean;
  abandoned: boolean;
  totalTurns: number;
  totalDurationMs: number;
  averageConfidenceScore?: number;
  averageReasoningScore?: number;
  averageClarityScore?: number;
  pressureRecoveryScore?: number;
  userReturnedWithin7Days?: boolean;
  userStartedAnotherSession?: boolean;
};

async function telemetryRequest<T>(path: string, payload?: unknown, token?: string | null): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: payload ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: payload ? JSON.stringify(payload) : undefined,
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Telemetry request failed: ${response.status}`);
  return response.json() as Promise<T>;
}

export function sendTurnTelemetry(payload: TurnTelemetryPayload, token?: string | null) {
  return telemetryRequest<{ saved: boolean }>("/api/telemetry/turn", payload, token);
}

export function sendSessionOutcome(payload: SessionOutcomePayload, token?: string | null) {
  return telemetryRequest<{ saved: boolean }>("/api/telemetry/session-outcome", payload, token);
}

export function getTelemetryConsent(userId: string, token?: string | null) {
  return telemetryRequest<PrivacySettings>(`/api/telemetry/privacy-settings/${encodeURIComponent(userId)}`, undefined, token);
}

export function getPersonalSpeechProfile(userId: string, token?: string | null) {
  return telemetryRequest<VoiceProfile>(`/api/telemetry/speech-profile/${encodeURIComponent(userId)}`, undefined, token);
}

export function updateTelemetryConsent(userId: string, settings: PrivacySettings, token?: string | null) {
  return telemetryRequest<PrivacySettings>("/api/telemetry/privacy-settings", { userId, ...settings }, token);
}

export function outcomeFromReport(session: Session, report: Report, elapsedSeconds: number): SessionOutcomePayload {
  return {
    userId: session.userId,
    sessionId: session.id,
    practiceType: session.practiceType,
    difficulty: session.difficulty,
    completed: true,
    abandoned: false,
    totalTurns: session.turnCount,
    totalDurationMs: elapsedSeconds * 1000,
    averageConfidenceScore: report.confidenceScore,
    averageReasoningScore: report.structureScore,
    averageClarityScore: report.clarityScore,
    pressureRecoveryScore: report.calmnessScore,
  };
}
