"use client";

import { Trophy } from "lucide-react";
import type { UserProgress } from "@/lib/types";

export function ProgressLevelCard({ progress }: { progress: UserProgress | null }) {
  const xp = progress?.xp || 0;
  const next = progress?.nextLevelXp || 150;
  const width = Math.min(100, Math.round((xp / Math.max(1, next)) * 100));
  return (
    <div className="rounded-[1.7rem] bg-slate-950 p-5 text-white ring-1 ring-white/10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-100/60">Current level</p>
          <div className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{progress?.levelName || "Initiate"}</div>
        </div>
        <Trophy className="text-violet-200" />
      </div>
      <div className="mt-5 h-2 rounded-full bg-white/10"><span className="block h-2 rounded-full bg-gradient-to-r from-cyan-300 to-violet-400" style={{ width: `${width}%` }} /></div>
      <div className="mt-3 text-sm font-semibold text-white/60">{xp} XP · Level {progress?.level || 1}</div>
    </div>
  );
}
