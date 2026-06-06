"use client";

import { Camera } from "lucide-react";

type Props = {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
};

export function CameraAssistedTimingToggle({ enabled, onChange }: Props) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.08] px-4 py-3 text-sm font-bold text-white/74 ring-1 ring-white/12 backdrop-blur-2xl">
      <span>
        <span className="inline-flex items-center gap-2">
          <Camera size={15} /> Camera-assisted timing
        </span>
        <span className="mt-1 block text-xs font-semibold leading-5 text-white/48">
          Use local camera signals to help the AI wait more naturally while you think. Video never leaves your device.
        </span>
      </span>
      <input
        type="checkbox"
        checked={enabled}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-cyan-300"
      />
    </label>
  );
}
