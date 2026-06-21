"use client";

import { useEffect, useState } from "react";
import { RefreshCw, TrendingDown, UserMinus } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { getChurnEvents, type ChurnEvent } from "@/lib/admin";

const REASON_LABEL: Record<string, string> = {
  too_expensive: "Too expensive",
  missing_features: "Missing features",
  switched_service: "Switched to competitor",
  customer_service: "Customer service",
  too_difficult: "Too difficult to use",
  other: "Other",
  "": "No reason given",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function ChurnRegisterPage() {
  const [events, setEvents] = useState<ChurnEvent[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try { setEvents(await getChurnEvents()); } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const byPlan: Record<string, number> = {};
  events.forEach((e) => { byPlan[e.planName || e.planId] = (byPlan[e.planName || e.planId] || 0) + 1; });

  const byReason: Record<string, number> = {};
  events.forEach((e) => { const r = e.reason || ""; byReason[r] = (byReason[r] || 0) + 1; });

  const thisMonth = events.filter((e) => {
    const d = new Date(e.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">Churn Register</h1>
          <p className="mt-1 font-medium text-slate-500">All subscription cancellations logged by webhook</p>
        </div>
        <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <AdminStatCard icon={UserMinus} label="Total churned" value={events.length} />
        <AdminStatCard icon={TrendingDown} label="Churned this month" value={thisMonth} />
        <AdminStatCard icon={TrendingDown} label="Most common reason" value={REASON_LABEL[Object.entries(byReason).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ""] || "—"} />
      </div>

      {/* Reason breakdown */}
      {Object.keys(byReason).length > 0 && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[1.25rem] bg-white p-5 ring-1 ring-slate-200/75 shadow-[0_14px_38px_rgba(35,45,75,0.045)]">
            <h2 className="mb-4 font-semibold text-slate-900">By reason</h2>
            <div className="space-y-2">
              {Object.entries(byReason).sort((a, b) => b[1] - a[1]).map(([r, n]) => (
                <div key={r} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{REASON_LABEL[r] ?? r}</span>
                  <span className="font-bold text-slate-900">{n}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[1.25rem] bg-white p-5 ring-1 ring-slate-200/75 shadow-[0_14px_38px_rgba(35,45,75,0.045)]">
            <h2 className="mb-4 font-semibold text-slate-900">By plan</h2>
            <div className="space-y-2">
              {Object.entries(byPlan).sort((a, b) => b[1] - a[1]).map(([p, n]) => (
                <div key={p} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{p}</span>
                  <span className="font-bold text-slate-900">{n}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Event list */}
      <div className="mt-6 overflow-hidden rounded-[1.25rem] bg-white shadow-[0_14px_38px_rgba(35,45,75,0.045)] ring-1 ring-slate-200/75">
        {loading ? (
          <div className="space-y-2 p-4">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />)}</div>
        ) : events.length === 0 ? (
          <div className="py-16 text-center">
            <UserMinus size={32} className="mx-auto text-slate-300" />
            <p className="mt-4 font-semibold text-slate-400">No churn events yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            <div className="grid grid-cols-[1fr_100px_1fr_120px] gap-3 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
              <span>User</span><span>Plan</span><span>Reason</span><span className="text-right">Date</span>
            </div>
            {events.map((e, i) => (
              <div key={i} className="grid grid-cols-[1fr_100px_1fr_120px] items-center gap-3 px-5 py-3.5 hover:bg-slate-50/60">
                <div className="truncate text-sm font-semibold text-slate-800">{e.uid || "—"}</div>
                <div className="text-sm font-semibold text-slate-700">{e.planName || e.planId}</div>
                <div>
                  <div className="text-sm font-semibold text-rose-600">{REASON_LABEL[e.reason] ?? (e.reason || "No reason given")}</div>
                  {e.comment && <div className="mt-0.5 text-xs text-slate-400">{e.comment}</div>}
                </div>
                <div className="text-right text-xs text-slate-400">{e.createdAt ? fmtDate(e.createdAt) : "—"}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
