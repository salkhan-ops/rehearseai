"use client";

import type { AnalysisSummary } from "@/lib/types";

type Props = {
  summary: AnalysisSummary;
  turnCount: number;
};

export function OverallSummaryBar({ summary, turnCount }: Props) {
  return (
    <div className="rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-white">Session overview</h3>
        <div className="flex gap-4 text-sm text-white/50">
          <span>{turnCount} turns</span>
          <span>Avg confidence: <span className="font-semibold text-white/80">{summary.avgConfidenceScore}%</span></span>
          <span>Dominant: <span className="font-semibold capitalize text-white/80">{summary.dominantEmotion}</span></span>
        </div>
      </div>

      {/* Confidence bar */}
      <div className="mb-4">
        <div className="mb-1 flex justify-between text-xs text-white/40">
          <span>Overall confidence</span>
          <span>{summary.avgConfidenceScore}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all"
            style={{ width: `${summary.avgConfidenceScore}%` }}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {summary.topStrengths.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-400/70">
              Strengths
            </p>
            <ul className="space-y-1">
              {summary.topStrengths.map((s, i) => (
                <li key={i} className="flex gap-2 text-xs text-white/65">
                  <span className="mt-0.5 text-emerald-400">✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {summary.topImprovements.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-orange-400/70">
              Focus areas
            </p>
            <ul className="space-y-1">
              {summary.topImprovements.map((s, i) => (
                <li key={i} className="flex gap-2 text-xs text-white/65">
                  <span className="mt-0.5 text-orange-400">→</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
