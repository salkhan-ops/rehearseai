"use client";

import { Pause, Play, Send, Square, ToggleLeft } from "lucide-react";
import { naturalConversationStatusText, type NaturalConversationState } from "@/lib/conversation/conversationStateMachine";

export function NaturalConversationControls({
  state,
  supported,
  disabled,
  onStart,
  onPause,
  onResume,
  onSendNow,
  onEnd,
  onSwitchToManual,
  countdown,
}: {
  state: NaturalConversationState;
  supported: boolean;
  disabled?: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onSendNow: () => void;
  onEnd: () => void;
  onSwitchToManual: () => void;
  countdown?: number | null;
}) {
  const started = state !== "idle" && state !== "error";
  const paused = state === "paused";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 px-2 text-xs font-semibold text-white/58">
        <span>{countdown ? `Continuing in ${countdown}...` : naturalConversationStatusText(state)}</span>
        <button type="button" onClick={onSwitchToManual} className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-white/68 transition hover:bg-white/10">
          <ToggleLeft size={14} /> Switch to Manual
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {!started && (
          <button
            type="button"
            onClick={onStart}
            disabled={!supported || disabled}
            className="inline-flex min-h-14 flex-1 items-center justify-center gap-2 rounded-[1.25rem] bg-cyan-200 px-5 py-3 font-semibold text-slate-950 shadow-[0_0_40px_rgba(125,211,252,0.28)] transition hover:scale-[1.01] disabled:opacity-50"
          >
            <Play size={18} /> Start conversation
          </button>
        )}
        {started && !paused && (
          <button type="button" onClick={onSendNow} disabled={disabled} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white/[0.10] px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/12 transition hover:bg-white/[0.14] disabled:opacity-50">
            <Send size={15} /> Send now
          </button>
        )}
        {started && !paused && (
          <button type="button" onClick={onPause} disabled={disabled} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white/[0.10] px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/12 transition hover:bg-white/[0.14] disabled:opacity-50">
            <Pause size={15} /> Pause
          </button>
        )}
        {started && paused && (
          <button type="button" onClick={onResume} disabled={disabled} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-cyan-200 px-4 py-2 text-sm font-semibold text-slate-950 transition disabled:opacity-50">
            <Play size={15} /> Resume
          </button>
        )}
        <button type="button" onClick={onEnd} disabled={disabled} className="inline-flex min-h-12 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-300/10 disabled:opacity-50">
          <Square size={15} /> End Session
        </button>
      </div>
    </div>
  );
}
