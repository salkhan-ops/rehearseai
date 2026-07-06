"use client";

import { AlertTriangle, CheckCircle2, OctagonAlert } from "lucide-react";
import type { GrowthAlert } from "@/lib/growth/types";

export function AlertsPanel({ alerts }: { alerts: GrowthAlert[] }) {
  if (alerts.length === 0) {
    return (
      <div className="rounded-[1.25rem] bg-white py-16 text-center shadow-[0_14px_38px_rgba(35,45,75,0.045)] ring-1 ring-slate-200/75">
        <CheckCircle2 size={32} className="mx-auto text-emerald-400" />
        <p className="mt-4 font-semibold text-slate-500">No alerts — every tracked metric is within target.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`flex items-start gap-3 rounded-2xl p-4 ring-1 ${
            alert.severity === "critical" ? "bg-rose-50 ring-rose-200" : "bg-amber-50 ring-amber-200"
          }`}
        >
          {alert.severity === "critical" ? (
            <OctagonAlert size={18} className="mt-0.5 shrink-0 text-rose-600" />
          ) : (
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${alert.severity === "critical" ? "text-rose-700" : "text-amber-700"}`}>{alert.title}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] ${alert.severity === "critical" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>
                {alert.severity}
              </span>
            </div>
            <p className="mt-1 text-sm font-medium text-slate-600">{alert.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
