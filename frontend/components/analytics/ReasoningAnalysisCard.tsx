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
    <div className="rounded-[1.5rem] surface-low p-6">
      <h3 className="text-xl font-semibold tracking-[-0.03em] text-primary-token">Reasoning Intelligence</h3>
      <p className="mt-2 font-medium leading-7 text-secondary-token">{analytics.reasoningSummary}</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {blocks.map(([title, items]) => (
          <div key={title as string} className="rounded-2xl surface-medium p-4">
            <div className="font-semibold text-primary-token">{title}</div>
            <ul className="mt-3 space-y-2 text-sm font-medium text-secondary-token">
              {(items as string[]).map((item) => <li key={item}>• {item}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
