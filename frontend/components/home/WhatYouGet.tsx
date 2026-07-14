"use client";

import { ReportBars, RoutineChip, StreakGrid } from "@/components/home/WhatYouGetVisuals";

// Styled to match /try's design tokens (surface-low / *-token). See WhatYouGetGlass
// for the landing-page version, which matches page.tsx's separate glass-card system.
export function WhatYouGet() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-[1.75rem] surface-low p-6 ring-1 ring-[var(--border-soft)]">
        <div className="text-sm font-semibold text-primary-token">Your report</div>
        <ReportBars />
      </div>
      <div className="rounded-[1.75rem] surface-low p-6 ring-1 ring-[var(--border-soft)]">
        <div className="text-sm font-semibold text-primary-token">Your streak</div>
        <StreakGrid />
      </div>
      <div className="rounded-[1.75rem] surface-low p-6 ring-1 ring-[var(--border-soft)]">
        <div className="text-sm font-semibold text-primary-token">Your routine</div>
        <RoutineChip />
      </div>
    </div>
  );
}
