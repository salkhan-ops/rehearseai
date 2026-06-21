"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, RefreshCw, Zap } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { getWebhookErrors, type WebhookError } from "@/lib/admin";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function WebhookErrorsPage() {
  const [errors, setErrors] = useState<WebhookError[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try { setErrors(await getWebhookErrors()); } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const unresolved = errors.filter((e) => !e.resolved);
  const recent24h = errors.filter((e) => Date.now() - new Date(e.createdAt).getTime() < 86_400_000).length;

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">Webhook Errors</h1>
          <p className="mt-1 font-medium text-slate-500">Failed Paddle webhook events logged for investigation</p>
        </div>
        <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <AdminStatCard icon={AlertTriangle} label="Unresolved" value={unresolved.length} />
        <AdminStatCard icon={Zap} label="Last 24 hours" value={recent24h} />
        <AdminStatCard icon={CheckCircle} label="Resolved" value={errors.length - unresolved.length} />
      </div>

      <div className="mt-6 overflow-hidden rounded-[1.25rem] bg-white shadow-[0_14px_38px_rgba(35,45,75,0.045)] ring-1 ring-slate-200/75">
        {loading ? (
          <div className="space-y-2 p-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />)}</div>
        ) : errors.length === 0 ? (
          <div className="py-16 text-center">
            <CheckCircle size={32} className="mx-auto text-emerald-400" />
            <p className="mt-4 font-semibold text-slate-400">No webhook errors</p>
            <p className="mt-1 text-sm text-slate-400">All webhook events processed successfully.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            <div className="grid grid-cols-[24px_120px_1fr_80px_120px] gap-3 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
              <span />
              <span>Event type</span><span>Error / User</span><span>Status</span><span className="text-right">Date</span>
            </div>
            {errors.map((err, i) => (
              <div key={i}>
                <button type="button" onClick={() => setExpanded(expanded === i ? null : i)}
                  className="grid w-full grid-cols-[24px_120px_1fr_80px_120px] items-center gap-3 px-5 py-3.5 text-left hover:bg-slate-50/60">
                  <AlertTriangle size={14} className={err.resolved ? "text-slate-300" : "text-amber-500"} />
                  <span className="text-sm font-semibold text-slate-700">{err.eventType}</span>
                  <div>
                    <div className="truncate text-sm font-semibold text-rose-600">{err.error}</div>
                    {err.uid && <div className="mt-0.5 truncate text-xs text-slate-400">{err.uid}</div>}
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ring-1 ${err.resolved ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : "bg-amber-50 text-amber-700 ring-amber-100"}`}>
                    {err.resolved ? "resolved" : "open"}
                  </span>
                  <span className="text-right text-xs text-slate-400">{fmtDate(err.createdAt)}</span>
                </button>
                {expanded === i && (
                  <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-slate-400">Payload snapshot</p>
                    <pre className="overflow-x-auto rounded-xl bg-slate-900 p-4 text-xs text-emerald-400 leading-relaxed">{err.payloadSnapshot}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
