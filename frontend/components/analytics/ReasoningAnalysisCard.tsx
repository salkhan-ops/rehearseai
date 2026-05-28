"use client";

import type { PerformanceAnalytics } from "@/lib/types";

export function ReasoningAnalysisCard({ analytics }: { analytics: PerformanceAnalytics }) {
  const blocks = [
    ["Reasoning strengths", analytics.reasoningStrengths],
    ["Reasoning gaps", analytics.reasoningGaps],
    ["Missing evidence", analytics.missingEvidence],
    ["Stronger structures", analytics.strongerStructures],
    ["Cognitive coaching", analytics.coachingSuggestions],
  ];

  return (
    <div className="rounded-[1.5rem] bg-white p-6 shadow-[0_14px_40px_rgba(35,45,75,0.04)] ring-1 ring-slate-200/75 dark:bg-white/10 dark:ring-white/10">
      <h3 className="text-xl font-semibold tracking-[-0.03em] text-slate-900 dark:text-white">Reasoning Intelligence</h3>
      <p className="mt-2 font-medium leading-7 text-slate-600 dark:text-white/60">{analytics.reasoningSummary}</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {blocks.map(([title, items]) => (
          <div key={title as string} className="rounded-2xl bg-slate-50 p-4 dark:bg-white/10">
            <div className="font-semibold text-slate-900 dark:text-white">{title}</div>
            <ul className="mt-3 space-y-2 text-sm font-medium text-slate-600 dark:text-white/60">
              {(items as string[]).map((item) => <li key={item}>• {item}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
