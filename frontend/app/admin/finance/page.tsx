"use client";

import { useEffect, useState } from "react";
import { BarChart2, CreditCard, Layers, TrendingUp, Users } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { getFinanceStats, type FinanceStats } from "@/lib/admin";

const symbol = (currency: string) => (currency === "GBP" ? "£" : "$");

const emptyStats: FinanceStats = {
  estimatedMrr: 0,
  estimatedArr: 0,
  totalSubscribers: 0,
  byPlan: [],
  totalUsers: 0,
  freeUsers: 0,
  currency: "GBP",
};

export default function AdminFinancePage() {
  const [stats, setStats] = useState<FinanceStats>(emptyStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFinanceStats()
      .then(setStats)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const s = symbol(stats.currency);
  const conversionRate = stats.totalUsers > 0 ? ((stats.totalSubscribers / stats.totalUsers) * 100).toFixed(1) : "0.0";
  const arpu = stats.totalSubscribers > 0 ? (stats.estimatedMrr / stats.totalSubscribers).toFixed(2) : "0.00";

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-[-0.04em]">Finance</h1>
        <p className="mt-1 font-medium text-slate-500">
          Revenue estimates based on Firestore plan assignments.{" "}
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700 ring-1 ring-amber-200">
            Live Paddle revenue connects when billing is configured
          </span>
        </p>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-[1.25rem] bg-slate-100" />
          ))}
        </div>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <AdminStatCard icon={TrendingUp} label="Estimated MRR" value={`${s}${stats.estimatedMrr.toLocaleString()}`} />
            <AdminStatCard icon={BarChart2} label="Estimated ARR" value={`${s}${stats.estimatedArr.toLocaleString()}`} />
            <AdminStatCard icon={CreditCard} label="Paid subscribers" value={stats.totalSubscribers} />
            <AdminStatCard icon={Layers} label="Avg revenue / user" value={`${s}${arpu}`} />
          </div>

          {/* Secondary row */}
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <AdminStatCard icon={Users} label="Total users" value={stats.totalUsers} />
            <AdminStatCard icon={Users} label="Free users" value={stats.freeUsers} />
            <AdminStatCard icon={TrendingUp} label="Conversion rate" value={`${conversionRate}%`} />
          </div>

          {/* Plan breakdown */}
          <div className="mt-6 overflow-hidden rounded-[1.25rem] bg-white shadow-[0_14px_38px_rgba(35,45,75,0.045)] ring-1 ring-slate-200/75">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-semibold text-slate-900">Revenue by plan</h2>
              <p className="mt-0.5 text-sm font-medium text-slate-500">Based on current plan assignments in Firestore</p>
            </div>
            {stats.byPlan.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm font-semibold text-slate-400">No plan data yet. Seed default plans and assign users to see revenue estimates.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {stats.byPlan.map((row) => {
                  const pct = stats.estimatedMrr > 0 ? (row.revenue / stats.estimatedMrr) * 100 : 0;
                  return (
                    <div key={row.planId} className="grid items-center gap-3 px-5 py-4 md:grid-cols-[1fr_80px_80px_140px_120px]">
                      <div>
                        <span className="font-semibold text-slate-900">{row.planName}</span>
                        <span className="ml-2 text-xs font-semibold text-slate-400">{row.planId}</span>
                      </div>
                      <div className="text-sm font-semibold text-slate-700">{row.count} users</div>
                      <div className="text-sm font-semibold text-slate-700">{s}{row.priceMonthly}/mo</div>
                      <div className="hidden md:block">
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-[#6200a8]" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <div className="text-right font-semibold text-slate-900">
                        {s}{row.revenue.toLocaleString()}/mo
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-center justify-between px-5 py-4">
                  <span className="font-bold text-slate-900">Total estimated MRR</span>
                  <span className="text-xl font-semibold tracking-[-0.04em] text-slate-900">{s}{stats.estimatedMrr.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Paddle placeholder */}
          <div className="mt-6 rounded-[1.25rem] border-2 border-dashed border-slate-200 p-6">
            <div className="flex items-start gap-4">
              <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-amber-50 text-amber-600">
                <CreditCard size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Paddle payment data</h3>
                <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                  When Paddle is configured, this section will show real payment history, failed charges, subscription renewals, churn events, and one-time course purchases. Add your Paddle credentials in Settings to activate live revenue tracking.
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {["Real payment events", "Churn & cancellations", "One-time course sales", "Failed charges", "Refunds", "Annual vs monthly split"].map((item) => (
                    <div key={item} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500 ring-1 ring-slate-100">
                      <span className="size-1.5 rounded-full bg-amber-400" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
