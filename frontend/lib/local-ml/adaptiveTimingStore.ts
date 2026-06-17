import type { PersonalTimingBaseline } from "@/lib/local-signals/types";

export type TurnOutcome = {
  silenceAtSendMs: number;
  speechDurationMs: number;
  reason: string;
  wasForced: boolean;
  cameraAssisted: boolean;
  premature: boolean;
  ts: number;
};

const KEY_PREFIX = "rehearseai_outcomes_";
const ROLLING_WINDOW = 30;
export const MIN_TURNS_FOR_ADAPTATION = 5;

export function storageKey(userId: string) {
  return `${KEY_PREFIX}${userId}`;
}

export function loadOutcomes(userId: string): TurnOutcome[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? (JSON.parse(raw) as TurnOutcome[]) : [];
  } catch {
    return [];
  }
}

export function saveOutcomes(userId: string, outcomes: TurnOutcome[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(outcomes.slice(-ROLLING_WINDOW)));
  } catch {}
}

export function appendOutcome(userId: string, outcome: TurnOutcome): TurnOutcome[] {
  const next = [...loadOutcomes(userId), outcome].slice(-ROLLING_WINDOW);
  saveOutcomes(userId, next);
  return next;
}

export function patchLastOutcome(userId: string, patch: Partial<TurnOutcome>): TurnOutcome[] {
  const outcomes = loadOutcomes(userId);
  if (outcomes.length === 0) return outcomes;
  const patched = [...outcomes.slice(0, -1), { ...outcomes[outcomes.length - 1], ...patch }];
  saveOutcomes(userId, patched);
  return patched;
}

function pct(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  return sorted[Math.max(0, Math.min(sorted.length - 1, Math.floor(sorted.length * p)))];
}

export function computeAdaptiveBaseline(outcomes: TurnOutcome[]): PersonalTimingBaseline | null {
  if (outcomes.length < MIN_TURNS_FOR_ADAPTATION) return null;

  // Use only non-premature turns with real silence data to measure natural finish silence
  const valid = outcomes.filter((o) => !o.premature && o.silenceAtSendMs >= 400);
  if (valid.length < 3) return null;

  const silences = valid.map((o) => o.silenceAtSendMs).sort((a, b) => a - b);
  const median = pct(silences, 0.5);
  const p65 = pct(silences, 0.65);

  // Premature rate > 0 → system sends too early → push threshold up
  const prematureRate = outcomes.filter((o) => o.premature).length / outcomes.length;
  // High forced rate → user consistently hits timeout → threshold too high, pull down
  const forcedRate = outcomes.filter((o) => o.wasForced && !o.premature).length / outcomes.length;

  let longPauseThresholdMs = Math.round(p65 + prematureRate * 1800 - forcedRate * 900);
  longPauseThresholdMs = Math.max(1600, Math.min(6500, longPauseThresholdMs));

  return {
    averagePauseMs: Math.round(median),
    longPauseThresholdMs,
    hesitationMarkerRate: Math.round(forcedRate * 100) / 100,
  };
}
