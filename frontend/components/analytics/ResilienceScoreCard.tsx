"use client";

import { AnimatedNumber } from "@/components/animations";

function value(metrics: Record<string, string | number | boolean | string[]>, key: string) {
  return Number(metrics[key] || 0);
}

export function ResilienceScoreCard({ metrics }: { metrics: Record<string, string | number | boolean | string[]> }) {
  const items = [
    ["Pressure Stability", value(metrics, "pressureStabilityScore")],
    ["Emotional Recovery", value(metrics, "emotionalRecoveryScore")],
    ["Resilience", value(metrics, "resilienceScore")],
  ];

  return (
    <div className="rounded-[1.5rem] bg-[#6200a8] p-6 text-white shadow-[0_18px_55px_rgba(98,0,168,0.16)]">
      <div className="text-sm font-semibold uppercase tracking-[0.16em] text-white/60">Resilience system</div>
      <h3 className="mt-3 text-2xl font-semibold tracking-[-0.035em]">Pressure resistance profile</h3>
      <div className="mt-6 grid gap-3">
        {items.map(([label, score]) => (
          <div key={String(label)} className="rounded-2xl bg-white/12 p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="font-semibold text-white/80">{label}</span>
              <span className="text-3xl font-semibold tracking-[-0.04em]"><AnimatedNumber value={Number(score)} /></span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-white/15">
              <div className="h-2 rounded-full bg-white" style={{ width: `${score}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
