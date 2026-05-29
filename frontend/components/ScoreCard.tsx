"use client";

import { AnimatedNumber } from "./animations";

export function ScoreCard({ label, score }: { label: string; score: number }) {
  return (
    <div className="rounded-[1.5rem] surface-low p-5">
      <div className="text-sm font-semibold text-tertiary-token">{label}</div>
      <div className="mt-3 flex items-end gap-3">
        <span className="text-4xl font-semibold tracking-[-0.045em] text-primary-token"><AnimatedNumber value={score} /></span>
        <span className="pb-1 text-sm text-tertiary-token">/100</span>
      </div>
      <div className="mt-4 h-2 rounded-full bg-[var(--surface-secondary)]">
        <div className="h-2 rounded-full bg-gradient-to-r from-[#8b00ff] to-[#5577ff]" style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}
