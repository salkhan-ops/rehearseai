"use client";

import { AnimatedCard, StaggeredGrid } from "@/components/animations";
import { ReportBars, RoutineChip, StreakGrid } from "@/components/home/WhatYouGetVisuals";

// Landing-page styling to match page.tsx's existing glass-card system. See WhatYouGet
// for the /try version, which matches that page's separate design-token system.
export function WhatYouGetGlass() {
  return (
    <StaggeredGrid className="grid gap-4 md:grid-cols-3">
      <AnimatedCard className="rounded-[2rem] bg-white/80 dark:bg-white/[0.07] p-6 ring-1 ring-slate-200/80 dark:ring-white/10 backdrop-blur-2xl">
        <div className="text-base font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">Your report</div>
        <ReportBars />
      </AnimatedCard>
      <AnimatedCard className="rounded-[2rem] bg-white/80 dark:bg-white/[0.07] p-6 ring-1 ring-slate-200/80 dark:ring-white/10 backdrop-blur-2xl">
        <div className="text-base font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">Your streak</div>
        <StreakGrid />
      </AnimatedCard>
      <AnimatedCard className="rounded-[2rem] bg-white/80 dark:bg-white/[0.07] p-6 ring-1 ring-slate-200/80 dark:ring-white/10 backdrop-blur-2xl">
        <div className="text-base font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">Your routine</div>
        <RoutineChip />
      </AnimatedCard>
    </StaggeredGrid>
  );
}
