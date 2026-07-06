"use client";

import { Clock, Globe2, MonitorSmartphone, MousePointerClick, RefreshCcw, Users } from "lucide-react";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import type { GaSnapshot } from "@/lib/growth/types";
import { PreviewBadge } from "./PreviewBadge";

function BreakdownList({ title, icon: Icon, rows }: { title: string; icon: typeof Globe2; rows: { label: string; value: number }[] }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="rounded-[1.25rem] bg-white p-5 shadow-[0_14px_38px_rgba(35,45,75,0.045)] ring-1 ring-slate-200/75">
      <div className="mb-4 flex items-center gap-2 text-slate-700">
        <Icon size={16} />
        <h3 className="text-sm font-bold uppercase tracking-[0.08em] text-slate-500">{title}</h3>
      </div>
      <div className="space-y-2.5">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-700">{row.label}</span>
              <span className="font-bold text-slate-900">{row.value.toLocaleString()}</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100">
              <div className="h-1.5 rounded-full bg-[#6200a8]" style={{ width: `${(row.value / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GoogleAnalyticsPanel({ ga }: { ga: GaSnapshot }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">Built for the GA4 Data API — connect it to replace these placeholders with live traffic data.</p>
        <PreviewBadge />
      </div>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <AdminStatCard icon={Users} label="Users" value={ga.users.toLocaleString()} />
        <AdminStatCard icon={MousePointerClick} label="Sessions" value={ga.sessions.toLocaleString()} />
        <AdminStatCard icon={Clock} label="Avg. engagement time" value={`${ga.avgEngagementTimeSeconds}s`} />
        <AdminStatCard icon={RefreshCcw} label="Bounce rate" value={`${ga.bounceRate.toFixed(1)}%`} />
        <AdminStatCard icon={Users} label="Returning users" value={ga.returningUsers.toLocaleString()} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <BreakdownList title="Top landing pages" icon={Globe2} rows={ga.topLandingPages.map((p) => ({ label: p.path, value: p.views }))} />
        <BreakdownList title="Traffic sources" icon={MousePointerClick} rows={ga.trafficSources.map((s) => ({ label: s.source, value: s.users }))} />
        <BreakdownList title="Countries" icon={Globe2} rows={ga.countries.map((c) => ({ label: c.country, value: c.users }))} />
        <BreakdownList title="Devices" icon={MonitorSmartphone} rows={ga.devices.map((d) => ({ label: d.device, value: d.users }))} />
      </div>
    </div>
  );
}
