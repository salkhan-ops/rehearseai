"use client";

import { ShieldCheck } from "lucide-react";
import type { CameraSignalState } from "@/lib/local-signals/types";
import type { FaceConversationSignal } from "@/lib/mediapipe/faceSignalTypes";

type Props = {
  enabled: boolean;
  state: CameraSignalState;
  message: string;
  conversationSignal?: FaceConversationSignal;
};

function cameraLabel(enabled: boolean, state: CameraSignalState, message: string, signal?: FaceConversationSignal) {
  if (!enabled) return "Camera timing off";
  if (state === "face_not_found" || signal?.recommendedAction === "ignore_camera") return "Face not detected · voice-only";
  if (signal?.recommendedAction === "send_now") return "Face detected · likely finished";
  if (signal?.recommendedAction === "wait_longer" || signal?.recommendedAction === "continue_listening") return "Face detected · waiting naturally";
  if (state === "active") return "Face detected · camera timing active";
  return message;
}

export function CameraTimingStatus({ enabled, state, message, conversationSignal }: Props) {
  const label = cameraLabel(enabled, state, message, conversationSignal);
  const active = enabled && state === "active";
  return (
    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ring-1 backdrop-blur-2xl ${active ? "bg-emerald-300/12 text-emerald-50 ring-emerald-200/20" : "bg-white/[0.08] text-white/56 ring-white/10"}`}>
      <ShieldCheck size={14} /> {label}
      {enabled && <span className="rounded-full bg-white/10 px-2 py-0.5">local only</span>}
    </div>
  );
}
