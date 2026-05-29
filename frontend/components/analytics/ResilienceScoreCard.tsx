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
    <div className="rounded-[1.5rem] surface-high p-6">
      <div className="text-sm font-semibold uppercase tracking-[0.16em] text-tertiary-token">Resilience system</div>
      <h3 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-primary-token">Pressure resistance profile</h3>
      <div className="mt-6 grid gap-3">
        {items.map(([label, score]) => (
          <div key={String(label)} className="rounded-2xl surface-medium p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="font-semibold text-secondary-token">{label}</span>
              <span className="text-3xl font-semibold tracking-[-0.04em] text-primary-token"><AnimatedNumber value={Number(score)} /></span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-[var(--surface-primary)]">
              <div className="h-2 rounded-full bg-gradient-to-r from-cyan-300 to-violet-400" style={{ width: `${score}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
