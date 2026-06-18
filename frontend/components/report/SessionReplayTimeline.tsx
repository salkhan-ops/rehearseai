"use client";

import { useEffect, useState } from "react";
import { getSessionAnalysis } from "@/lib/api";
import type { SessionAnalysis } from "@/lib/types";
import { OverallSummaryBar } from "./OverallSummaryBar";
import { TurnRow } from "./TurnRow";

type Props = {
  sessionId: string;
  token?: string | null;
};

export function SessionReplayTimeline({ sessionId, token }: Props) {
  const [analysis, setAnalysis] = useState<SessionAnalysis | null>(null);
  const [status, setStatus] = useState<"loading" | "generating" | "complete" | "unavailable">("loading");

  useEffect(() => {
    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout>;

    async function load() {
      try {
        const data = await getSessionAnalysis(sessionId, token);
        if (cancelled) return;

        if (!data || data.status === "not_found") {
          setStatus("unavailable");
          return;
        }
        if (data.status === "generating") {
          setStatus("generating");
          // Poll every 4s until complete
          pollTimer = setTimeout(load, 4000);
          return;
        }
        setAnalysis(data);
        setStatus("complete");
      } catch {
        if (!cancelled) setStatus("unavailable");
      }
    }

    load();
    return () => {
      cancelled = true;
      clearTimeout(pollTimer);
    };
  }, [sessionId, token]);

  if (status === "loading") {
    return <LoadingState label="Loading coaching replay…" />;
  }
  if (status === "generating") {
    return <LoadingState label="Generating your coaching report… this takes ~15 seconds" />;
  }
  if (status === "unavailable" || !analysis) {
    return null;
  }

  const { turns, summary } = analysis;
  if (!turns || turns.length === 0) return null;

  return (
    <section className="mt-8 space-y-6">
      <div>
        <h2 className="mb-1 text-xl font-bold text-white">Coaching replay</h2>
        <p className="text-sm text-white/45">
          Green — what you said · Orange — what could be stronger
        </p>
      </div>

      <OverallSummaryBar summary={summary} turnCount={turns.length} />

      <div className="mt-4">
        {turns.map((turn) => (
          <TurnRow
            key={turn.turnIndex}
            turn={turn}
            isStrongest={turn.turnIndex === summary.strongestTurn}
            isWeakest={turn.turnIndex === summary.weakestTurn}
          />
        ))}
      </div>
    </section>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="mt-8 flex items-center gap-3 rounded-2xl bg-white/[0.04] p-5 text-sm text-white/50 ring-1 ring-white/10">
      <svg className="h-4 w-4 animate-spin text-white/30" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      {label}
    </div>
  );
}
