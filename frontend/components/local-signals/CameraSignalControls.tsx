"use client";

import { Camera, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { CameraPrivacyNotice } from "./CameraPrivacyNotice";

type Props = {
  enabled: boolean;
  telemetryEnabled?: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onTelemetryChange?: (enabled: boolean) => void;
  showTelemetry?: boolean;
  disabled?: boolean;
};

export function CameraSignalControls({
  enabled,
  telemetryEnabled = false,
  onEnabledChange,
  onTelemetryChange,
  showTelemetry = false,
  disabled = false,
}: Props) {
  return (
    <section className="rounded-[1.5rem] bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-white/10 dark:ring-white/10">
      <label className="flex cursor-pointer items-start justify-between gap-4">
        <span className="min-w-0">
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-white">
            <Camera size={16} /> Camera-assisted timing
          </span>
          <span className="mt-1 block text-sm font-medium leading-6 text-slate-600 dark:text-white/60">
            Process face and movement signals locally on your device to help the AI understand when you are still thinking. Video never leaves your device.
          </span>
        </span>
        <input
          type="checkbox"
          checked={enabled}
          disabled={disabled}
          onChange={(event) => onEnabledChange(event.target.checked)}
          className="mt-1 size-5 shrink-0 accent-[#6200a8]"
        />
      </label>

      {showTelemetry && (
        <label className="mt-4 flex cursor-pointer items-start justify-between gap-4 rounded-2xl bg-white/70 p-3 ring-1 ring-slate-200 dark:bg-white/10 dark:ring-white/10">
          <span>
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <ShieldCheck size={15} /> Store anonymous numeric timing signals to improve personalization
            </span>
            <span className="mt-1 block text-xs font-medium leading-5 text-slate-500 dark:text-white/50">
              Camera processing can happen without storing telemetry.
            </span>
          </span>
          <input
            type="checkbox"
            checked={telemetryEnabled}
            disabled={disabled}
            onChange={(event) => onTelemetryChange?.(event.target.checked)}
            className="mt-1 size-5 shrink-0 accent-[#6200a8]"
          />
        </label>
      )}

      <CameraPrivacyNotice className="mt-4" />
      <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-600 ring-1 ring-slate-200 dark:bg-white/10 dark:text-white/65 dark:ring-white/10">
        {enabled ? <Eye size={14} /> : <EyeOff size={14} />} {enabled ? "Local signals enabled" : "Off by default"}
      </div>
    </section>
  );
}
