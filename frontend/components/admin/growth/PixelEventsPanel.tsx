"use client";

import { PIXEL_EVENT_NAMES, type PixelEventCounts } from "@/lib/growth/types";
import { PreviewBadge } from "./PreviewBadge";
import { TrendChart } from "./TrendChart";

export function PixelEventsPanel({ pixel }: { pixel: PixelEventCounts }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">
          Event names match those already fired by <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">lib/analytics.ts</code> — counts are illustrative until events are logged server-side.
        </p>
        <PreviewBadge />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PIXEL_EVENT_NAMES.map((name) => (
          <TrendChart key={name} title={name} data={pixel.trends[name]} formatValue={(n) => Math.round(n).toLocaleString()} isMock />
        ))}
      </div>
    </div>
  );
}
