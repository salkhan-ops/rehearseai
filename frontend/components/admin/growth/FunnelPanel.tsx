"use client";

import { AlertTriangle } from "lucide-react";
import type { FunnelStep } from "@/lib/growth/types";
import { PreviewBadge } from "./PreviewBadge";

export function FunnelPanel({ funnel }: { funnel: FunnelStep[] }) {
  const max = funnel[0]?.count || 1;

  return (
    <div className="rounded-[1.25rem] bg-white p-5 shadow-[0_14px_38px_rgba(35,45,75,0.045)] ring-1 ring-slate-200/75">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-[-0.03em]">Ad-to-purchase funnel</h2>
          <p className="mt-0.5 text-sm font-medium text-slate-500">Job Interview campaign — ad impressions through subscription purchase</p>
        </div>
        <PreviewBadge label="Top of funnel is preview data" />
      </div>

      <div className="space-y-3">
        {funnel.map((step) => {
          const widthPct = Math.max(4, (step.count / max) * 100);
          return (
            <div
              key={step.key}
              className={`rounded-2xl p-4 ring-1 ${step.isBottleneck ? "bg-rose-50 ring-rose-200" : "bg-slate-50 ring-slate-200/70"}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${step.isBottleneck ? "text-rose-700" : "text-slate-800"}`}>{step.label}</span>
                  {step.isMock && <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-amber-600">preview</span>}
                  {step.isBottleneck && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-rose-700">
                      <AlertTriangle size={11} /> Bottleneck
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                  {step.conversionFromPrevious !== null && <span>{step.conversionFromPrevious.toFixed(1)}% of previous</span>}
                  {step.dropOffFromPrevious !== null && (
                    <span className={step.isBottleneck ? "text-rose-600" : ""}>{step.dropOffFromPrevious.toFixed(1)}% drop-off</span>
                  )}
                  <span>{step.conversionFromStart.toFixed(1)}% of start</span>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <div className="h-2.5 flex-1 rounded-full bg-white">
                  <div
                    className={`h-2.5 rounded-full ${step.isBottleneck ? "bg-rose-500" : "bg-[#6200a8]"}`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
                <span className="w-20 text-right text-sm font-bold text-slate-900">{step.count.toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
