"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PersonalTimingBaseline } from "@/lib/local-signals/types";
import {
  appendOutcome,
  computeAdaptiveBaseline,
  loadOutcomes,
  MIN_TURNS_FOR_ADAPTATION,
  patchLastOutcome,
  type TurnOutcome,
} from "@/lib/local-ml/adaptiveTimingStore";

export type RecordTurnInput = {
  silenceAtSendMs: number;
  speechDurationMs: number;
  reason: string;
  wasForced: boolean;
  cameraAssisted: boolean;
};

type Options = {
  userId: string | null;
  enabled: boolean;
};

export function useAdaptiveTiming({ userId, enabled }: Options) {
  const [baseline, setBaseline] = useState<PersonalTimingBaseline | null>(null);
  const [turnCount, setTurnCount] = useState(0);
  const lastSendAtRef = useRef(0);

  useEffect(() => {
    if (!userId) return;
    const outcomes = loadOutcomes(userId);
    setTurnCount(outcomes.length);
    setBaseline(computeAdaptiveBaseline(outcomes));
  }, [userId]);

  const recordTurn = useCallback(
    (input: RecordTurnInput) => {
      if (!userId) return;
      lastSendAtRef.current = Date.now();
      const outcome: TurnOutcome = { ...input, premature: false, ts: Date.now() };
      const all = appendOutcome(userId, outcome);
      setTurnCount(all.length);
      setBaseline(computeAdaptiveBaseline(all));
    },
    [userId],
  );

  // Call when user resumes speaking soon after a send — the previous send was premature
  const markLastTurnPremature = useCallback(() => {
    if (!userId) return;
    if (Date.now() - lastSendAtRef.current > 2500) return;
    const all = patchLastOutcome(userId, { premature: true });
    setBaseline(computeAdaptiveBaseline(all));
  }, [userId]);

  const adaptiveReady = turnCount >= MIN_TURNS_FOR_ADAPTATION && baseline !== null;
  const activeBaseline: PersonalTimingBaseline | null = enabled && adaptiveReady ? baseline : null;

  return { activeBaseline, adaptiveReady, turnCount, recordTurn, markLastTurnPremature };
}
