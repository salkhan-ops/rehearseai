"use client";

import { AnimatedNumber } from "./animations";

export function ScoreCard({ label, score }: { label: string; score: number }) {
  return (
    <div className="rounded-[1.5rem] bg-white p-5 shadow-[0_14px_40px_rgba(35,45,75,0.04)] ring-1 ring-slate-200/75 dark:bg-white/10 dark:ring-white/10">
      <div className="text-sm font-semibold text-slate-500 dark:text-white/55">{label}</div>
      <div className="mt-3 flex items-end gap-3">
        <span className="text-4xl font-semibold tracking-[-0.045em] text-slate-900 dark:text-white"><AnimatedNumber value={score} /></span>
        <span className="pb-1 text-sm text-slate-400 dark:text-white/40">/100</span>
      </div>
      <div className="mt-4 h-2 rounded-full bg-slate-100 dark:bg-white/10">
        <div className="h-2 rounded-full bg-gradient-to-r from-[#8b00ff] to-[#5577ff]" style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}
