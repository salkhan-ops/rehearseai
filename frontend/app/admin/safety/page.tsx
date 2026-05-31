"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Ban, CornerDownRight, HeartPulse, ShieldAlert } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { getSafetyEvents, getSafetyStats, type SafetyEvent, type SafetyStats } from "@/lib/admin";

const categories = [
  ["", "All events"],
  ["crisis", "Crisis triggers"],
  ["scope", "Scope violations"],
  ["dependency", "Dependency indicators"],
  ["manipulation", "Manipulation"],
  ["harmful_persuasion", "Harmful persuasion"],
];

const risks = ["", "LOW", "MEDIUM", "HIGH", "CRISIS"];

export default function AdminSafetyPage() {
  const [stats, setStats] = useState<SafetyStats>({ total: 0, crisis: 0, scopeViolations: 0, dependencyIndicators: 0, blocked: 0 });
  const [events, setEvents] = useState<SafetyEvent[]>([]);
  const [category, setCategory] = useState("");
  const [risk, setRisk] = useState("");

  function refresh() {
    Promise.all([getSafetyStats(), getSafetyEvents(category, risk)])
      .then(([nextStats, nextEvents]) => {
        setStats(nextStats);
        setEvents(nextEvents);
      })
      .catch(() => setEvents([]));
  }

  useEffect(() => { refresh(); }, [category, risk]);

  return (
    <AdminLayout>
      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">Safety & Scope</h1>
          <p className="mt-1 font-medium text-slate-500">Crisis triggers, professional-advice redirects, dependency indicators, and blocked manipulation attempts.</p>
        </div>
        <div className="flex gap-2">
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-xl bg-white px-3 py-2 text-sm font-semibold ring-1 ring-slate-200">
            {categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select value={risk} onChange={(event) => setRisk(event.target.value)} className="rounded-xl bg-white px-3 py-2 text-sm font-semibold ring-1 ring-slate-200">
            {risks.map((item) => <option key={item} value={item}>{item || "All risks"}</option>)}
          </select>
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <AdminStatCard icon={ShieldAlert} label="Total Events" value={stats.total} />
        <AdminStatCard icon={HeartPulse} label="Crisis" value={stats.crisis} />
        <AdminStatCard icon={CornerDownRight} label="Scope" value={stats.scopeViolations} />
        <AdminStatCard icon={AlertTriangle} label="Dependency" value={stats.dependencyIndicators} />
        <AdminStatCard icon={Ban} label="Blocked" value={stats.blocked} />
      </div>

      <div className="space-y-3">
        {events.map((event) => (
          <div key={event.eventId} className="rounded-[1.25rem] bg-white p-5 shadow-[0_14px_38px_rgba(35,45,75,0.045)] ring-1 ring-slate-200/75">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{event.domain}</span>
                  <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">{event.safetyAction}</span>
                  <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">{event.riskLevel}</span>
                  {event.practiceType && <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{event.practiceType}</span>}
                </div>
                <p className="mt-2 text-sm font-medium text-slate-500">{event.userId} · {event.sessionId}</p>
              </div>
              <p className="text-xs font-semibold text-slate-400">{event.createdAt ? new Date(event.createdAt).toLocaleString() : ""}</p>
            </div>
            <p className="mt-4 whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm font-medium leading-6 text-slate-700">{event.messageExcerpt}</p>
            {event.reasons?.length > 0 && <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{event.reasons.join(" · ")}</p>}
          </div>
        ))}
        {!events.length && <div className="rounded-[1.25rem] bg-white p-8 text-center font-semibold text-slate-500 ring-1 ring-slate-200">No safety events found.</div>}
      </div>
    </AdminLayout>
  );
}
