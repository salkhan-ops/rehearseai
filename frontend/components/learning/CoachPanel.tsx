"use client";

import { useState } from "react";
import { ChevronUp, GraduationCap, Lightbulb } from "lucide-react";
import type { Session, SessionHint } from "@/lib/types";
import { getCourseConfig } from "@/lib/courseConfig";
import type { PracticeType } from "@/lib/types";

const focusByPhase: Record<string, string[]> = {
  "Job Interview": ["First impression & framing", "Behavioural storytelling", "Handling pressure & pushback", "Closing strong"],
  "Presentation / Public Speaking": ["Hook & opening credibility", "Sustaining argument clarity", "Fielding hostile questions", "Landing the close"],
  "Panel Discussion": ["Positioning your stance", "Defending under challenge", "Handling contradiction", "Final word impact"],
  "Thesis Defense": ["Explaining your method clearly", "Defending logic under attack", "Exposing assumptions well", "Closing the defense"],
  "Salary Negotiation": ["Anchoring your number", "Countering without caving", "Holding silence", "Locking in the final position"],
  "Difficult Conversation": ["Acknowledging without agreeing", "Staying on the core issue", "De-escalating emotion", "Reaching resolution"],
  "Teaching Session": ["Introducing the concept clearly", "Addressing confusion", "Handling edge cases", "Confirming understanding"],
  "Sales Pitch": ["Discovery — understand before pitching", "Handling ROI objections", "Addressing timing & risk", "Closing without pressure"],
  "Casual Chat": ["Warm opening", "Listening & responding", "Sharing naturally", "Wrapping up gracefully"],
};

function getDynamicFocus(session: Session, turnCount: number): string {
  const phases = focusByPhase[session.practiceType] ?? ["Opening well", "Responding clearly", "Handling pressure", "Finishing strong"];
  const turnsPerPhase = Math.max(1, Math.ceil(8 / phases.length));
  const idx = Math.min(phases.length - 1, turnCount === 0 ? 0 : Math.floor((turnCount - 1) / turnsPerPhase));
  return phases[idx];
}

export function CoachPanel({
  session,
  latestHint,
  progress,
  turnCount = 0,
  hintsUsed = 0,
  maxHints = Infinity,
  onShowHint,
}: {
  session: Session;
  latestHint: SessionHint | null;
  progress: number;
  turnCount?: number;
  hintsUsed?: number;
  maxHints?: number;
  onShowHint?: () => void;
}) {
  const isIntermediate = session.difficulty === "Intermediate";
  const [open, setOpen] = useState(!isIntermediate);

  let arcPhases: string[] = ["Opening", "Core", "Pressure", "Close"];
  try {
    const cfg = getCourseConfig(session.practiceType as PracticeType);
    if (cfg?.arcPhases?.length) arcPhases = cfg.arcPhases;
  } catch {
    // ignore unknown types
  }
  const turnsPerPhase = Math.max(1, Math.ceil(8 / arcPhases.length));
  const phaseIdx = Math.min(arcPhases.length - 1, turnCount === 0 ? 0 : Math.floor((turnCount - 1) / turnsPerPhase));
  const currentPhase = arcPhases[phaseIdx];
  const focus = getDynamicFocus(session, turnCount);

  const hintsLeft = maxHints === Infinity ? null : maxHints - hintsUsed;
  const canShowHint = !!latestHint && (maxHints === Infinity || hintsUsed < maxHints);

  return (
    <aside className="fixed bottom-4 left-4 z-40 w-[min(22rem,calc(100vw-2rem))] rounded-[1.25rem] bg-white/[0.08] p-3 text-white ring-1 ring-white/10 backdrop-blur-2xl">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-3 text-left">
        <span className="inline-flex items-center gap-2 text-sm font-semibold">
          <GraduationCap size={16} />
          {isIntermediate ? "Coach" : "Beginner Coach"}
          {hintsLeft !== null && (
            <span className={`ml-1 rounded-full px-2 py-px text-[10px] font-bold ${hintsLeft > 0 ? "bg-cyan-400/20 text-cyan-200" : "bg-white/10 text-white/35"}`}>
              {hintsLeft > 0 ? `${hintsLeft} hint${hintsLeft !== 1 ? "s" : ""}` : "hint used"}
            </span>
          )}
        </span>
        <ChevronUp className={`transition ${open ? "" : "rotate-180"}`} size={16} />
      </button>
      {open && (
        <div className="mt-3 space-y-3 text-sm">
          <div className="rounded-2xl bg-white/[0.07] p-3 ring-1 ring-white/10">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-white/38">Current objective</div>
            <div className="mt-1 font-semibold">{session.goal}</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-white/[0.07] p-3 ring-1 ring-white/10">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-white/38">Arc phase</div>
              <div className="mt-1 font-semibold text-cyan-100">{currentPhase}</div>
            </div>
            <div className="rounded-2xl bg-white/[0.07] p-3 ring-1 ring-white/10">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-white/38">Progress</div>
              <div className="mt-1 font-semibold">{progress}%</div>
            </div>
          </div>
          <div className="rounded-2xl bg-white/[0.07] p-3 ring-1 ring-white/10">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-white/38">Focus right now</div>
            <div className="mt-1 font-semibold text-violet-200">{focus}</div>
          </div>
          {onShowHint && (
            <button
              type="button"
              disabled={!canShowHint}
              onClick={() => { if (canShowHint) onShowHint(); }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400/10 px-3 py-2.5 text-sm font-semibold text-cyan-200 ring-1 ring-cyan-400/20 transition hover:bg-cyan-400/18 disabled:cursor-default disabled:opacity-40"
            >
              <Lightbulb size={15} />
              {!latestHint
                ? "Hint available after first response"
                : hintsLeft === 0
                ? "Hint used for this session"
                : "Show coaching hint"}
            </button>
          )}
          {!onShowHint && (
            <div className="rounded-2xl bg-white/[0.07] p-3 ring-1 ring-white/10">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-white/38">Latest hint</div>
              <div className="mt-1 font-semibold">{latestHint?.hintText || "Hints will appear as you practice."}</div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
