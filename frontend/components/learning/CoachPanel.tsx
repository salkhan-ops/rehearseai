"use client";

import { useState } from "react";
import { ChevronUp, GraduationCap } from "lucide-react";
import type { Session, SessionHint } from "@/lib/types";

export function CoachPanel({ session, latestHint, progress }: { session: Session; latestHint: SessionHint | null; progress: number }) {
  const [open, setOpen] = useState(false);
  return (
    <aside className="fixed bottom-4 left-4 z-40 w-[min(22rem,calc(100vw-2rem))] rounded-[1.25rem] bg-white/[0.08] p-3 text-white ring-1 ring-white/12 backdrop-blur-2xl">
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center justify-between gap-3 text-left">
        <span className="inline-flex items-center gap-2 text-sm font-semibold"><GraduationCap size={16} /> Beginner Coach</span>
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
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-white/38">Focus</div>
              <div className="mt-1 font-semibold">Handling objections</div>
            </div>
            <div className="rounded-2xl bg-white/[0.07] p-3 ring-1 ring-white/10">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-white/38">Progress</div>
              <div className="mt-1 font-semibold">{progress}%</div>
            </div>
          </div>
          <div className="rounded-2xl bg-white/[0.07] p-3 ring-1 ring-white/10">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-white/38">Latest hint</div>
            <div className="mt-1 font-semibold">{latestHint?.hintText || "Hints will appear when there is a reasoning moment."}</div>
          </div>
        </div>
      )}
    </aside>
  );
}
