"use client";

import { motion } from "framer-motion";
import { Bell } from "lucide-react";

const barTrack = "h-2 flex-1 overflow-hidden rounded-full bg-slate-100/80 dark:bg-white/10";
const barFill = "h-2 rounded-full bg-gradient-to-r from-cyan-200 via-violet-300 to-blue-300";

// Illustrative proportions, not a specific user's real scores -- the point is to show the
// shape of the report (five dimensions, a bar each), not to claim a number.
const REPORT_DIMENSIONS: Array<{ label: string; fill: number }> = [
  { label: "Confidence", fill: 82 },
  { label: "Clarity", fill: 74 },
  { label: "Persuasiveness", fill: 68 },
  { label: "Calmness", fill: 90 },
  { label: "Structure", fill: 71 },
];

export function ReportBars() {
  return (
    <div className="mt-5 space-y-2.5">
      {REPORT_DIMENSIONS.map(({ label, fill }, index) => (
        <div key={label} className="flex items-center gap-3">
          <span className="w-24 shrink-0 text-[11px] font-semibold text-slate-500 dark:text-white/45">{label}</span>
          <div className={barTrack}>
            <motion.div
              className={barFill}
              initial={{ width: 0 }}
              whileInView={{ width: `${fill}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: index * 0.08, ease: "easeOut" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// A 14-day activity grid, GitHub-contribution-style -- illustrative of the streak/history
// concept on the dashboard, not a claim about a specific real streak length.
const ACTIVITY_PATTERN = [0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1];

export function StreakGrid() {
  return (
    <div className="mt-5">
      <div className="grid grid-cols-7 gap-1.5">
        {ACTIVITY_PATTERN.map((active, index) => (
          <motion.div
            key={index}
            className={`h-5 w-5 rounded-md ${active ? "bg-gradient-to-br from-violet-400 to-cyan-300" : "bg-slate-100 dark:bg-white/10"}`}
            initial={{ opacity: 0, scale: 0.6 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: index * 0.03 }}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-white/45">
        <span className="inline-block h-2.5 w-2.5 rounded-sm bg-gradient-to-br from-violet-400 to-cyan-300" /> practiced
        <span className="ml-2 inline-block h-2.5 w-2.5 rounded-sm bg-slate-100 dark:bg-white/10" /> not yet
      </div>
    </div>
  );
}

// A routine/reminder chip matching the real dashboard's schedule-card pattern.
export function RoutineChip() {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const active = [true, false, true, false, true, false, false];
  return (
    <div className="mt-5">
      <div className="flex gap-1.5">
        {days.map((day, index) => (
          <span
            key={index}
            className={`grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold ${
              active[index]
                ? "bg-gradient-to-br from-violet-400 to-cyan-300 text-white"
                : "bg-slate-100 text-slate-400 dark:bg-white/10 dark:text-white/35"
            }`}
          >
            {day}
          </span>
        ))}
      </div>
      <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-100/80 px-3 py-1.5 text-[11px] font-semibold text-slate-500 dark:bg-white/10 dark:text-white/45">
        <Bell size={12} /> Next: Wed, 8:00 PM
      </div>
    </div>
  );
}
