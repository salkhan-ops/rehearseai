"use client";

import { ShieldCheck } from "lucide-react";
import type { CameraSignalState } from "@/lib/local-signals/types";

type Props = {
  enabled: boolean;
  state: CameraSignalState;
  message: string;
};

export function CameraTimingStatus({ enabled, state, message }: Props) {
  const label = !enabled ? "Camera timing off" : message;
  const active = enabled && state === "active";
  return (
    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ring-1 backdrop-blur-2xl ${active ? "bg-emerald-300/12 text-emerald-50 ring-emerald-200/20" : "bg-white/[0.08] text-white/56 ring-white/12"}`}>
      <ShieldCheck size={14} /> {label}
      {enabled && <span className="rounded-full bg-white/10 px-2 py-0.5">local only</span>}
    </div>
  );
}
