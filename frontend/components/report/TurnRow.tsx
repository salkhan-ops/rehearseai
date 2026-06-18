"use client";

import type { TurnRecord } from "@/lib/types";
import { EmotionBadge } from "./EmotionBadge";

type Props = {
  turn: TurnRecord;
  isStrongest?: boolean;
  isWeakest?: boolean;
};

export function TurnRow({ turn, isStrongest, isWeakest }: Props) {
  const speakerLine = turn.aiSpeaker ? `${turn.aiSpeaker} asked` : "Interviewer asked";
  const durationS = turn.speechDurationMs > 0 ? (turn.speechDurationMs / 1000).toFixed(1) : null;

  return (
    <div className="relative flex gap-3 pb-8">
      {/* Timeline spine */}
      <div className="flex flex-col items-center">
        <div
          className={`mt-1 flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-bold ring-2 ${
            isStrongest
              ? "bg-emerald-500/20 text-emerald-300 ring-emerald-500/40"
              : isWeakest
              ? "bg-rose-500/20 text-rose-300 ring-rose-500/40"
              : "bg-white/10 text-white/50 ring-white/15"
          }`}
        >
          {turn.turnIndex + 1}
        </div>
        <div className="mt-2 w-px flex-1 bg-white/10" />
      </div>

      {/* Cards side by side */}
      <div className="flex min-w-0 flex-1 flex-col gap-3 pt-0.5 sm:flex-row">
        {/* Green card — what was said */}
        <div className="flex-1 rounded-2xl bg-emerald-950/40 p-4 ring-1 ring-emerald-500/20">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-emerald-400/60">
            {speakerLine}
          </p>
          <p className="mb-3 text-sm text-white/70">{turn.aiQuestion}</p>
          <p className="mb-3 text-sm leading-relaxed text-white/90">{turn.userText}</p>
          <div className="flex flex-wrap items-center gap-2">
            <EmotionBadge
              label={turn.emotion.label}
              confidenceScore={turn.emotion.confidenceScore}
              wpm={turn.emotion.signals.wpm}
            />
            {durationS && (
              <span className="text-xs text-white/35">{durationS}s</span>
            )}
            {isStrongest && (
              <span className="text-xs font-semibold text-emerald-400">★ Strongest turn</span>
            )}
            {isWeakest && (
              <span className="text-xs font-semibold text-rose-400">↓ Needs work</span>
            )}
          </div>
        </div>

        {/* Orange card — coaching */}
        {turn.coaching && (
          <div className="flex-1 rounded-2xl bg-orange-950/40 p-4 ring-1 ring-orange-500/20">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-orange-400/60">
              What could be stronger
            </p>
            {turn.coaching.betterAnswer && (
              <p className="mb-2 text-sm italic leading-relaxed text-orange-100/80">
                &ldquo;{turn.coaching.betterAnswer}&rdquo;
              </p>
            )}
            {turn.coaching.structureTip && (
              <CoachingLine icon="📐" text={turn.coaching.structureTip} />
            )}
            {turn.coaching.emotionalGuidance && (
              <CoachingLine icon="💡" text={turn.coaching.emotionalGuidance} />
            )}
            {turn.coaching.toneAdvice && (
              <CoachingLine icon="🎙" text={turn.coaching.toneAdvice} />
            )}
            {turn.coaching.missedOpportunity && turn.coaching.missedOpportunity !== "None" && (
              <CoachingLine icon="⚡" text={turn.coaching.missedOpportunity} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CoachingLine({ icon, text }: { icon: string; text: string }) {
  return (
    <p className="mt-1 flex gap-1.5 text-xs leading-relaxed text-orange-100/70">
      <span className="mt-px flex-none">{icon}</span>
      {text}
    </p>
  );
}
