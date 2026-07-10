"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Camera, Sun, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CameraSignalState } from "@/lib/local-signals/types";

type Props = {
  enabled: boolean;
  cameraState: CameraSignalState;
  lightingScore: number;
  faceDetected: boolean;
};

export function CameraDetectionIssueCard({ enabled, cameraState, lightingScore, faceDetected }: Props) {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const isLightingIssue = enabled && cameraState === "active" && !faceDetected && lightingScore < 0.3;
  const isFaceNotFound = enabled && cameraState === "face_not_found";
  const isPoorCondition = isLightingIssue || isFaceNotFound;

  useEffect(() => {
    if (!isPoorCondition) {
      setOpen(false);
      setDismissed(false);
      return;
    }
    if (dismissed) return;
    const timer = window.setTimeout(() => setOpen(true), 4000);
    return () => clearTimeout(timer);
  }, [isPoorCondition, dismissed]);

  function handleDismiss() {
    setDismissed(true);
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={handleDismiss} />
      <div className="relative mx-auto my-8 w-full max-w-sm rounded-[2rem] bg-[#0d0020] p-6 ring-1 ring-white/10 shadow-[0_40px_120px_rgba(0,0,0,0.7)]">

        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-5 top-5 grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white/60 transition hover:bg-white/20"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>

        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/20 ring-1 ring-amber-400/20">
          <AlertTriangle size={18} className="text-amber-300" />
        </div>

        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Camera detection issue</p>
        <h2 className="mt-1.5 text-xl font-semibold tracking-[-0.03em] text-white">
          {isLightingIssue ? "Room appears too dark" : "Can't see your face clearly"}
        </h2>
        <p className="mt-2 text-sm text-white/60">
          {isLightingIssue
            ? "The camera signal is too dim to track accurately. The AI is falling back to voice timing only."
            : "No face detected in frame. The AI is using voice timing only until the camera picks you up."}
        </p>

        <div className="mt-4 space-y-2">
          {isLightingIssue ? (
            <>
              <TipRow icon={Sun} text="Move closer to a lamp or sit facing a window" />
              <TipRow icon={Camera} text="Avoid bright light sources directly behind you" />
            </>
          ) : (
            <>
              <TipRow icon={Camera} text="Sit centred in the camera view, about arm's length away" />
              <TipRow icon={Sun} text="A well-lit face improves detection accuracy significantly" />
            </>
          )}
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="mt-5 w-full rounded-2xl bg-white/10 py-2.5 text-sm font-bold text-white ring-1 ring-white/15 transition hover:bg-white/15"
        >
          Got it — I&apos;ll adjust
        </button>
      </div>
    </div>
  );
}

function TipRow({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/[0.05] px-3.5 py-2.5 ring-1 ring-white/10">
      <Icon size={14} className="shrink-0 text-white/50" />
      <span className="text-xs text-white/70">{text}</span>
    </div>
  );
}
