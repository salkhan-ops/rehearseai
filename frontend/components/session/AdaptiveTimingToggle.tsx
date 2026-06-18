"use client";

import { Sparkles } from "lucide-react";
import { MIN_TURNS_FOR_ADAPTATION } from "@/lib/local-ml/adaptiveTimingStore";

type Props = {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  adaptiveReady: boolean;
  turnCount: number;
};

export function AdaptiveTimingToggle({ enabled, onChange, adaptiveReady, turnCount }: Props) {
  const label = adaptiveReady ? "Adaptive timing" : `Learning ${turnCount}/${MIN_TURNS_FOR_ADAPTATION}`;
  const description = adaptiveReady
    ? enabled
      ? "Pause thresholds personalised to your speaking rhythm."
      : "Enough data collected. Enable to use your personal timing."
    : "Watching your pause patterns across turns to calibrate timing.";

  return (
    <label
      title={description}
      className="flex cursor-pointer items-center gap-2 rounded-full bg-white/[0.08] px-3 py-2 text-xs font-semibold text-white/70 ring-1 ring-white/12 backdrop-blur-2xl"
    >
      <Sparkles
        size={13}
        className={adaptiveReady && enabled ? "text-violet-300" : "text-white/40"}
      />
      {label}
      <input
        type="checkbox"
        checked={enabled && adaptiveReady}
        disabled={!adaptiveReady}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.5 w-3.5 accent-violet-300 disabled:opacity-40"
      />
    </label>
  );
}
