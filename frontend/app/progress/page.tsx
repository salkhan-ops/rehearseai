"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { AnimatedPage } from "@/components/animations";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Nav } from "@/components/Nav";
import { getFirebaseDb } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import type { MetricScores } from "@/lib/types";

type AnalyticsRow = {
  sessionId: string;
  createdAt: string;
  metrics: MetricScores;
};

const KEY_METRICS: { key: keyof MetricScores; label: string; color: string }[] = [
  { key: "confidence", label: "Confidence", color: "#6200a8" },
  { key: "clarity", label: "Clarity", color: "#0ea5e9" },
  { key: "emotionalComposure", label: "Composure", color: "#10b981" },
  { key: "criticalThinking", label: "Critical Thinking", color: "#f59e0b" },
  { key: "persuasiveness", label: "Persuasiveness", color: "#ef4444" },
];

function avg(scores: number[]) { return scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0; }

function overallScore(m: MetricScores) {
  const vals = Object.values(m) as number[];
  return avg(vals);
}

function Sparkline({ values, color, width = 180, height = 52 }: { values: number[]; color: string; width?: number; height?: number }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 8) - 4;
    return `${x},${y}`;
  });
  const d = `M${pts.join(" L")}`;
  const lastPt = pts[pts.length - 1].split(",");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="overflow-visible">
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastPt[0]} cy={lastPt[1]} r={3.5} fill={color} />
    </svg>
  );
}

function TrendBadge({ values }: { values: number[] }) {
  if (values.length < 3) return null;
  const recent = avg(values.slice(-3));
  const prior = avg(values.slice(0, -3));
  const delta = recent - prior;
  if (Math.abs(delta) < 2) return <span className="text-xs font-semibold text-slate-400">→ Stable</span>;
  return delta > 0
    ? <span className="text-xs font-bold text-emerald-600">▲ +{delta} improving</span>
    : <span className="text-xs font-bold text-rose-500">▼ {delta} declining</span>;
}

export default function ProgressPage() {
  const { userId } = useAuth();
  const [rows, setRows] = useState<AnalyticsRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const db = getFirebaseDb();
        if (!db) return;
        const snap = await getDocs(query(collection(db, "analytics"), where("userId", "==", userId), orderBy("createdAt", "asc"), limit(60)));
        setRows(snap.docs.map((d) => d.data() as AnalyticsRow));
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, [userId]);

  const overall = rows.map((r) => overallScore(r.metrics));
  const latest = rows.length ? rows[rows.length - 1] : null;
  const best = rows.length ? rows.reduce((a, b) => overallScore(a.metrics) > overallScore(b.metrics) ? a : b) : null;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#0a0012] text-white">
        <Nav />
        <AnimatedPage>
          <div className="mx-auto max-w-3xl px-4 py-12">
            <Link href="/dashboard" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white">
              <ArrowLeft size={16} /> Back to dashboard
            </Link>
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/20">
                <TrendingUp size={20} className="text-violet-400" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-[-0.04em]">Your progress</h1>
                <p className="mt-0.5 text-sm text-slate-400">{rows.length} sessions analysed</p>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/5" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <div className="rounded-2xl bg-white/5 p-10 text-center">
                <TrendingUp size={32} className="mx-auto text-slate-600" />
                <p className="mt-4 font-semibold text-slate-400">No sessions yet</p>
                <p className="mt-1 text-sm text-slate-500">Complete a practice session to see your performance trends here.</p>
                <Link href="/practice" className="mt-6 inline-block rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold hover:bg-violet-500">
                  Start practising
                </Link>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Overall score card */}
                <div className="rounded-2xl bg-gradient-to-br from-violet-900/40 to-slate-900/40 p-6 ring-1 ring-white/10">
                  <div className="mb-4 flex items-end justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Overall score</p>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-5xl font-bold tracking-tight">{overall.length ? overall[overall.length - 1] : "—"}</span>
                        <span className="text-lg text-slate-500">/100</span>
                        <TrendBadge values={overall} />
                      </div>
                    </div>
                    <div className="text-right text-sm text-slate-400">
                      {best && <div>Best: <span className="font-bold text-white">{overallScore(best.metrics)}</span></div>}
                      <div>Sessions: <span className="font-bold text-white">{rows.length}</span></div>
                    </div>
                  </div>
                  <Sparkline values={overall} color="#a855f7" width={480} height={64} />
                </div>

                {/* Per-metric cards */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {KEY_METRICS.map(({ key, label, color }) => {
                    const vals = rows.map((r) => r.metrics[key] ?? 0);
                    const last = vals[vals.length - 1];
                    return (
                      <div key={key} className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/8 hover:bg-white/7 transition">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-sm font-semibold text-slate-300">{label}</span>
                          <span className="text-2xl font-bold" style={{ color }}>{last}</span>
                        </div>
                        <Sparkline values={vals} color={color} width={210} height={44} />
                        <div className="mt-2">
                          <TrendBadge values={vals} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Strengths & gaps */}
                {latest && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl bg-emerald-950/40 p-5 ring-1 ring-emerald-800/30">
                      <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.1em] text-emerald-400">Top strengths</h3>
                      <div className="space-y-2">
                        {Object.entries(latest.metrics).sort(([, a], [, b]) => b - a).slice(0, 3).map(([k, v]) => (
                          <div key={k} className="flex items-center justify-between text-sm">
                            <span className="font-medium capitalize text-slate-300">{k.replace(/([A-Z])/g, " $1").toLowerCase()}</span>
                            <span className="font-bold text-emerald-400">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-rose-950/30 p-5 ring-1 ring-rose-800/20">
                      <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.1em] text-rose-400">Areas to work on</h3>
                      <div className="space-y-2">
                        {Object.entries(latest.metrics).sort(([, a], [, b]) => a - b).slice(0, 3).map(([k, v]) => (
                          <div key={k} className="flex items-center justify-between text-sm">
                            <span className="font-medium capitalize text-slate-300">{k.replace(/([A-Z])/g, " $1").toLowerCase()}</span>
                            <span className="font-bold text-rose-400">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Session timeline */}
                <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/8">
                  <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.1em] text-slate-500">Session history</h3>
                  <div className="space-y-2">
                    {[...rows].reverse().slice(0, 10).map((r, i) => {
                      const score = overallScore(r.metrics);
                      const pct = score;
                      return (
                        <div key={r.sessionId ?? i} className="flex items-center gap-3">
                          <span className="w-[120px] shrink-0 text-xs text-slate-500">{new Date(r.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                          <div className="flex-1 overflow-hidden rounded-full bg-white/10">
                            <div className="h-2 rounded-full bg-violet-500 transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-8 text-right text-xs font-bold text-slate-300">{score}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </AnimatedPage>
      </div>
    </ProtectedRoute>
  );
}
