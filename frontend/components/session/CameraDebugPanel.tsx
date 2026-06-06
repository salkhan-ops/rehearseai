"use client";

import type { FaceConversationSignal, FaceSignalState } from "@/lib/mediapipe/faceSignalTypes";
import type { PauseFusionDecision } from "@/lib/local-signals/types";

type Props = {
  visible: boolean;
  mediaPipeLoaded: boolean;
  cameraPermission: string;
  faceSignalState: FaceSignalState;
  conversationSignal: FaceConversationSignal;
  finalPauseDecision?: PauseFusionDecision | null;
  autoSendTriggered: boolean;
  blockedReason: string;
};

export function CameraDebugPanel({
  visible,
  mediaPipeLoaded,
  cameraPermission,
  faceSignalState,
  conversationSignal,
  finalPauseDecision,
  autoSendTriggered,
  blockedReason,
}: Props) {
  if (!visible) return null;
  const rows: Record<string, string | number | boolean> = {
    mediaPipeLoaded,
    cameraPermission,
    faceDetected: faceSignalState.faceDetected,
    mouthOpenScore: faceSignalState.mouthOpenScore.toFixed(3),
    lipMovementScore: faceSignalState.lipMovementScore.toFixed(3),
    blinkRateApprox: faceSignalState.blinkRateApprox.toFixed(3),
    lookingAway: faceSignalState.lookingAway,
    lookDirection: faceSignalState.lookDirection,
    headMovementIntensity: faceSignalState.headMovementIntensity.toFixed(3),
    visualStillnessMs: Math.round(faceSignalState.visualStillnessMs),
    engagement: faceSignalState.engagement,
    userStateEstimate: conversationSignal.userStateEstimate,
    recommendedAction: conversationSignal.recommendedAction,
    finalPauseDecision: finalPauseDecision?.pauseDecision || "",
    autoSendTriggered,
    blockedReason,
  };
  return (
    <div className="mb-3 rounded-xl bg-black/45 p-3 text-left text-[11px] font-semibold leading-5 text-cyan-50/75 ring-1 ring-cyan-100/15">
      <div className="mb-1 text-cyan-100">Camera debug</div>
      <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
        {Object.entries(rows).map(([key, value]) => (
          <div key={key} className="flex justify-between gap-3">
            <span className="text-white/38">{key}</span>
            <span className="truncate text-right">{String(value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
