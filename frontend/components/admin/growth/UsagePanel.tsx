"use client";

import { Clock, Globe2, MonitorSmartphone, Repeat, Star, TrendingUp, Trophy } from "lucide-react";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import type { UsageSnapshot } from "@/lib/growth/types";
import { PreviewBadge } from "./PreviewBadge";

export function UsagePanel({ usage }: { usage: UsageSnapshot }) {
  const maxScenario = usage.scenarioBreakdown[0]?.count || 1;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <AdminStatCard icon={Trophy} label="Most popular scenario" value={usage.mostPopularScenario} />
        <AdminStatCard icon={Clock} label="Avg. interview duration" value={`${usage.avgInterviewDurationMinutes.toFixed(1)} min`} />
        <AdminStatCard icon={Star} label="Avg. report score" value={usage.avgReportScore} />
        <AdminStatCard icon={Star} label="Avg. reasoning score" value={usage.avgReasoningScore} />
        <AdminStatCard icon={Repeat} label="Return within 7 days" value={`${usage.usersReturningWithin7DaysPct.toFixed(1)}%`} />
        <AdminStatCard icon={TrendingUp} label="Avg. interviews / user" value={usage.avgInterviewsPerUser.toFixed(1)} />
        <AdminStatCard icon={MonitorSmartphone} label="Most used device" value={usage.mostUsedDevice} />
        <AdminStatCard icon={Globe2} label="Most common country" value={usage.mostCommonCountry} />
      </div>

      {usage.isDeviceCountryMock && (
        <div className="flex items-center gap-2">
          <PreviewBadge label="Device/country are preview — no client capture yet" />
        </div>
      )}

      <div className="rounded-[1.25rem] bg-white p-5 shadow-[0_14px_38px_rgba(35,45,75,0.045)] ring-1 ring-slate-200/75">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.08em] text-slate-500">Scenario breakdown</h3>
        <div className="space-y-2.5">
          {usage.scenarioBreakdown.map((row) => (
            <div key={row.practiceType}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-700">{row.practiceType}</span>
                <span className="font-bold text-slate-900">{row.count.toLocaleString()}</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100">
                <div className="h-1.5 rounded-full bg-[#6200a8]" style={{ width: `${(row.count / maxScenario) * 100}%` }} />
              </div>
            </div>
          ))}
          {usage.scenarioBreakdown.length === 0 && <p className="text-sm font-medium text-slate-400">No sessions recorded yet.</p>}
        </div>
      </div>
    </div>
  );
}
