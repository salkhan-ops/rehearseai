"use client";

import { ChartShell } from "./ChartShell";

export function WeaknessHeatmap({ data }: { data: Array<Record<string, string | number>> }) {
  return (
    <ChartShell title="Weakness Heatmap" insight="Recurring reasoning and communication risk patterns">
      <div className="grid gap-3">
        {data.map((item) => {
          const severity = Number(item.severity || 0);
          return (
            <div key={String(item.weakness)} className="grid grid-cols-[1fr_auto] items-center gap-4 rounded-2xl bg-slate-50 p-3 dark:bg-white/10">
              <div>
                <div className="font-semibold text-slate-800 dark:text-white">{item.weakness}</div>
                <div className="text-xs font-medium text-slate-500 dark:text-white/50">Frequency {item.frequency}</div>
              </div>
              <div className="h-9 w-28 overflow-hidden rounded-full bg-white ring-1 ring-slate-200 dark:bg-white/10 dark:ring-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-rose-500" style={{ width: `${severity}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </ChartShell>
  );
}
