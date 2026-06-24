"use client";

import { Camera } from "lucide-react";

type Props = {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
};

export function CameraAssistedTimingToggle({ enabled, onChange }: Props) {
  return (
    <label
      title="Use local camera signals to help the AI wait more naturally while you think. Video never leaves your device."
      className="flex cursor-pointer items-center gap-2 rounded-full bg-white/[0.08] px-3 py-2 text-xs font-semibold text-white/70 ring-1 ring-white/10 backdrop-blur-2xl"
    >
      <Camera size={13} />
      Camera timing
      <input
        type="checkbox"
        checked={enabled}
        onChange={(event) => onChange(event.target.checked)}
        className="h-3.5 w-3.5 accent-cyan-300"
      />
    </label>
  );
}
