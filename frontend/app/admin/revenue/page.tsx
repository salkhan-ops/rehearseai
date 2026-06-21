"use client";

import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight, DollarSign, Package, RefreshCw, ShoppingCart, TrendingUp } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { getRevenueTransactions, type RevenueTransaction } from "@/lib/admin";

const EVENT_LABEL: Record<string, string> = {
  "subscription.created": "New subscription",
  "subscription.activated": "Subscription activated",
  "subscription.updated": "Subscription updated",
  "subscription.canceled": "Subscription canceled",
  "transaction.completed": "One-time purchase",
};

const STATUS_CLASS: Record<string, string> = {
  paid: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  canceled: "bg-rose-50 text-rose-600 ring-rose-100",
  refunded: "bg-amber-50 text-amber-700 ring-amber-100",
};

function fmt(n: number) { return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function fmtDate(iso: string) { return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }

export default function RevenueRegisterPage() {
  const [txns, setTxns] = useState<RevenueTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "subscription" | "course_package">("all");

  async function load() {
    setLoading(true);
    try { setTxns(await getRevenueTransactions(500)); } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const visible = txns.filter((t) => filter === "all" || t.productType === filter);
  const paid = txns.filter((t) => t.status === "paid");
  const totalRevenue = paid.reduce((s, t) => s + (t.amount || 0), 0);
  const subRevenue = paid.filter((t) => t.productType === "subscription").reduce((s, t) => s + t.amount, 0);
  const pkgRevenue = paid.filter((t) => t.productType === "course_package").reduce((s, t) => s + t.amount, 0);

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">Revenue Register</h1>
          <p className="mt-1 font-medium text-slate-500">Real Paddle transactions logged by webhook — {txns.length} events total</p>
        </div>
        <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-3">
        <AdminStatCard icon={DollarSign} label="Total revenue" value={fmt(totalRevenue)} />
        <AdminStatCard icon={TrendingUp} label="Subscription revenue" value={fmt(subRevenue)} />
        <AdminStatCard icon={Package} label="Course package revenue" value={fmt(pkgRevenue)} />
      </div>

      {/* Filter tabs */}
      <div className="mt-6 flex gap-2">
        {(["all", "subscription", "course_package"] as const).map((f) => (
          <button key={f} type="button" onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${filter === f ? "bg-[#6200a8] text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}>
            {f === "all" ? "All" : f === "subscription" ? "Subscriptions" : "Course packages"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="mt-4 overflow-hidden rounded-[1.25rem] bg-white shadow-[0_14px_38px_rgba(35,45,75,0.045)] ring-1 ring-slate-200/75">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />)}
          </div>
        ) : visible.length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingCart size={32} className="mx-auto text-slate-300" />
            <p className="mt-4 font-semibold text-slate-400">No transactions yet</p>
            <p className="mt-1 text-sm text-slate-400">Transactions are logged automatically when Paddle webhooks fire.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            <div className="grid grid-cols-[1fr_120px_100px_80px_100px] gap-3 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
              <span>Event / User</span><span>Product</span><span>Amount</span><span>Status</span><span className="text-right">Date</span>
            </div>
            {visible.map((t, i) => (
              <div key={t.id ?? i} className="grid items-center grid-cols-[1fr_120px_100px_80px_100px] gap-3 px-5 py-3.5 hover:bg-slate-50/60">
                <div>
                  <div className="flex items-center gap-2">
                    {t.status === "paid"
                      ? <ArrowUpRight size={14} className="shrink-0 text-emerald-500" />
                      : <ArrowDownRight size={14} className="shrink-0 text-rose-400" />}
                    <span className="font-semibold text-slate-900 text-sm">{EVENT_LABEL[t.eventType] ?? t.eventType}</span>
                  </div>
                  <div className="mt-0.5 truncate pl-[22px] text-xs text-slate-400">{t.uid || "—"}</div>
                </div>
                <div className="text-sm">
                  {t.productType === "subscription" ? (
                    <span className="font-semibold text-slate-700">{t.planName || t.planId}</span>
                  ) : (
                    <span className="font-semibold text-violet-700">{t.packageTitle || t.packageId}</span>
                  )}
                </div>
                <div className="font-semibold text-slate-900 text-sm">
                  {t.amount > 0 ? fmt(t.amount) : <span className="text-slate-400">—</span>}
                </div>
                <div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ring-1 ${STATUS_CLASS[t.status] ?? "bg-slate-50 text-slate-500 ring-slate-100"}`}>
                    {t.status}
                  </span>
                </div>
                <div className="text-right text-xs text-slate-400">{t.createdAt ? fmtDate(t.createdAt) : "—"}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
