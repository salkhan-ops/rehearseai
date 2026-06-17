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
  const label = adaptiveReady
    ? enabled ? "Adaptive timing" : "Adaptive timing"
    : `Learning ${turnCount}/${MIN_TURNS_FOR_ADAPTATION}`;

  const description = adaptiveReady
    ? enabled
      ? "Pause thresholds personalised to your speaking rhythm."
      : "Enough data collected. Enable to use your personal timing."
    : "Watching your pause patterns across turns to calibrate timing.";

  return (
    <label
      title={description}
      className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.08] px-4 py-3 text-sm font-bold text-white/74 ring-1 ring-white/12 backdrop-blur-2xl"
    >
      <span>
        <span className="inline-flex items-center gap-2">
          <Sparkles
            size={15}
            className={adaptiveReady && enabled ? "text-violet-300" : "text-white/40"}
          />
          {label}
        </span>
        <span className="mt-1 block text-xs font-semibold leading-5 text-white/48">
          {description}
        </span>
      </span>
      <input
        type="checkbox"
        checked={enabled && adaptiveReady}
        disabled={!adaptiveReady}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-violet-300 disabled:opacity-40"
      />
    </label>
  );
}
