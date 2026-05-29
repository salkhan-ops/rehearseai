"use client";

import { ChartShell } from "./ChartShell";

export function WeaknessHeatmap({ data }: { data: Array<Record<string, string | number>> }) {
  return (
    <ChartShell title="Weakness Heatmap" insight="Recurring reasoning and communication risk patterns">
      <div className="grid gap-3">
        {data.map((item) => {
          const severity = Number(item.severity || 0);
          return (
            <div key={String(item.weakness)} className="grid grid-cols-[1fr_auto] items-center gap-4 rounded-2xl surface-medium p-3">
              <div>
                <div className="font-semibold text-primary-token">{item.weakness}</div>
                <div className="text-xs font-medium text-tertiary-token">Frequency {item.frequency}</div>
              </div>
              <div className="h-9 w-28 overflow-hidden rounded-full surface-low">
                <div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-rose-500" style={{ width: `${severity}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </ChartShell>
  );
}
