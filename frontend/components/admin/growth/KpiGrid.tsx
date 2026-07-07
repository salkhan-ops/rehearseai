"use client";

import { Activity, BarChart3, CheckCircle2, DollarSign, Percent, TrendingUp, UserPlus, Users } from "lucide-react";
import { AdminSection } from "@/components/admin/AdminSection";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import type { KpiSnapshot } from "@/lib/growth/types";
import { PreviewBadge } from "./PreviewBadge";

function usd(n: number) {
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function KpiGrid({ kpis }: { kpis: KpiSnapshot }) {
  return (
    <div className="space-y-2">
      <AdminSection title="Visitors">
        {kpis.isVisitorsMock && (
          <div className="flex items-center gap-2 px-1">
            <PreviewBadge label="Preview data — connect GA4 / Meta" />
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-3">
          <AdminStatCard icon={Users} label="Visitors today" value={kpis.visitorsToday.toLocaleString()} />
          <AdminStatCard icon={Users} label="Visitors this week" value={kpis.visitorsThisWeek.toLocaleString()} />
          <AdminStatCard icon={Users} label="Visitors this month" value={kpis.visitorsThisMonth.toLocaleString()} />
        </div>
      </AdminSection>

      <AdminSection title="Signups">
        <div className="grid gap-3 sm:grid-cols-3">
          <AdminStatCard icon={UserPlus} label="Signups today" value={kpis.signupsToday.toLocaleString()} />
          <AdminStatCard icon={UserPlus} label="Signups this week" value={kpis.signupsThisWeek.toLocaleString()} />
          <AdminStatCard icon={UserPlus} label="Signups this month" value={kpis.signupsThisMonth.toLocaleString()} />
        </div>
      </AdminSection>

      <AdminSection title="Interviews">
        <div className="grid gap-3 sm:grid-cols-3">
          <AdminStatCard icon={Activity} label="Interviews started" value={kpis.interviewsStarted.toLocaleString()} />
          <AdminStatCard icon={CheckCircle2} label="Interviews completed" value={kpis.interviewsCompleted.toLocaleString()} />
          <AdminStatCard icon={Percent} label="Completion rate" value={`${kpis.completionRate.toFixed(1)}%`} />
        </div>
      </AdminSection>

      <AdminSection title="Revenue">
        <div className="grid gap-3 sm:grid-cols-3">
          <AdminStatCard icon={BarChart3} label="Paid subscribers" value={kpis.paidSubscribers.toLocaleString()} />
          <AdminStatCard icon={DollarSign} label="MRR" value={usd(kpis.mrr)} />
          <AdminStatCard icon={DollarSign} label="Revenue today" value={usd(kpis.revenueToday)} />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <AdminStatCard icon={DollarSign} label="Revenue this month" value={usd(kpis.revenueThisMonth)} />
          <AdminStatCard icon={TrendingUp} label="Active users (7d)" value={kpis.activeUsers7d.toLocaleString()} />
          <AdminStatCard icon={TrendingUp} label="Active users (30d)" value={kpis.activeUsers30d.toLocaleString()} />
        </div>
      </AdminSection>
    </div>
  );
}
