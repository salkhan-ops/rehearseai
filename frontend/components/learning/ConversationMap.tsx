"use client";

import { getCourseConfig } from "@/lib/courseConfig";
import type { PracticeType, Session } from "@/lib/types";

function getPhaseIndex(turnCount: number, totalPhases: number): number {
  if (turnCount === 0) return 0;
  const turnsPerPhase = Math.max(1, Math.ceil(8 / totalPhases));
  return Math.min(totalPhases - 1, Math.floor((turnCount - 1) / turnsPerPhase));
}

export function ConversationMap({ session, turnCount = 0 }: { session: Session; turnCount?: number }) {
  let phases: string[] = ["Opening", "Core", "Pressure", "Close"];
  try {
    const cfg = getCourseConfig(session.practiceType as PracticeType);
    if (cfg?.arcPhases?.length) phases = cfg.arcPhases;
  } catch {
    // practiceType not in config — use generic phases
  }

  const currentPhase = getPhaseIndex(turnCount, phases.length);

  return (
    <section className="overflow-hidden rounded-[1.5rem] bg-white/[0.07] p-5 ring-1 ring-white/10 backdrop-blur-2xl">
      <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-white/38">Session arc</p>
      <div className="relative">
        <div className="absolute left-3 top-3 h-[calc(100%-1.5rem)] w-px bg-white/10" />
        <ol className="space-y-3">
          {phases.map((phase, i) => {
            const isPast = i < currentPhase;
            const isActive = i === currentPhase;
            return (
              <li key={phase} className="relative flex items-center gap-3">
                <span
                  className={`relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-all ${
                    isActive
                      ? "bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(34,211,238,0.55)]"
                      : isPast
                      ? "bg-white/20 text-white/50"
                      : "border border-white/15 bg-transparent text-white/20"
                  }`}
                >
                  {isPast ? "✓" : i + 1}
                </span>
                <span
                  className={`text-sm font-semibold transition-colors ${
                    isActive ? "text-cyan-100" : isPast ? "text-white/35" : "text-white/20"
                  }`}
                >
                  {phase}
                  {isActive && (
                    <span className="ml-2 inline-block rounded-full bg-cyan-400/15 px-2 py-px text-[10px] font-bold uppercase tracking-wide text-cyan-300">
                      Now
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
