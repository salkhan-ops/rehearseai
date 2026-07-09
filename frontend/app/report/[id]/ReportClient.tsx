"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, CalendarClock, ChevronDown, Download, Flame, Lightbulb, Lock, TrendingUp, Zap } from "lucide-react";
import { RadarPerformanceChart } from "@/components/analytics/RadarPerformanceChart";
import { ImprovementTrendChart } from "@/components/analytics/ImprovementTrendChart";
import { AnimatedCard, AnimatedPage, AnimatedSection, StaggeredGrid } from "@/components/animations";
import { Nav } from "@/components/Nav";
import { ScoreCard } from "@/components/ScoreCard";
import { PracticeRoutinePanel } from "@/components/scheduling/PracticeRoutinePanel";
import { AIDisclaimer } from "@/components/legal/AIDisclaimer";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { getReport, getReportAnalytics, getSessionHints } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { isRtlLanguage } from "@/lib/languages";
import type { PerformanceAnalytics, Report, SessionHint } from "@/lib/types";
import { SessionReplayTimeline } from "@/components/report/SessionReplayTimeline";
import { trackCustom } from "@/lib/metaPixel";

function ReportAmbient() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute left-1/2 top-24 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-violet-500/18 blur-3xl" />
      <div className="absolute right-[-12rem] top-1/3 h-[34rem] w-[34rem] rounded-full bg-cyan-400/14 blur-3xl" />
    </div>
  );
}

function SectionHead({ label, title }: { label: string; title: string }) {
  return (
    <div className="mb-5">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent-primary)]">{label}</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-primary-token">{title}</h2>
    </div>
  );
}

export default function ReportPage() {
  const params = useParams<{ id?: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params?.id || searchParams.get("id") || "";
  const [report, setReport] = useState<Report | null>(null);
  const [analytics, setAnalytics] = useState<PerformanceAnalytics | null>(null);
  const [hints, setHints] = useState<SessionHint[]>([]);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [deepOpen, setDeepOpen] = useState(false);
  const feedbackViewedRef = useRef(false);
  const { getToken, profile } = useAuth();
  const isPro = Boolean(profile?.planId && profile.planId !== "free");
  const hitFreeTimeCap = searchParams.get("timeUp") === "true" && !isPro;

  useEffect(() => {
    if (!id) return;
    getToken().then(async (token) => {
      setAuthToken(token);
      const [nextReport, nextAnalytics] = await Promise.all([getReport(id, token), getReportAnalytics(id, token)]);
      const nextHints = await getSessionHints(nextReport.sessionId, token).catch(() => []);
      return [nextReport, nextAnalytics, nextHints] as const;
    }).then(([r, a, h]) => {
      setReport(r);
      setAnalytics(a);
      setHints(h);
      if (!feedbackViewedRef.current) {
        feedbackViewedRef.current = true;
        trackCustom("FeedbackViewed", { report_id: r.id, session_id: r.sessionId });
      }
    });
  }, [id, getToken]);

  if (!report || !analytics) {
    return (
      <main className="cog-bg min-h-screen text-primary-token">
        <ReportAmbient />
        <div className="relative px-4 py-12 text-center font-semibold text-secondary-token">Loading your report…</div>
      </main>
    );
  }

  const topCriticalMoments = (analytics.criticalMoments || []).slice(0, 3);
  const topReplayItems = (analytics.replayItems || []).slice(0, 3);

  return (
    <ProtectedRoute>
      <main className="cog-bg relative min-h-screen overflow-hidden text-primary-token" dir={isRtlLanguage(report.feedbackLanguage) ? "rtl" : "ltr"}>
        <ReportAmbient />
        <Nav />
        <AnimatedPage className="relative z-10 mx-auto max-w-5xl px-4 py-12">

          {hitFreeTimeCap && (
            <div className="mb-8 flex flex-col items-start gap-4 rounded-[1.75rem] bg-gradient-to-r from-[#6200a8] via-[#7c00d8] to-[#3b82f6] p-6 text-white shadow-[0_22px_60px_rgba(98,0,168,0.32)] sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-2xl bg-white/15">
                  <Zap size={20} />
                </div>
                <div>
                  <p className="text-lg font-semibold tracking-[-0.02em]">That was your 3-minute free preview.</p>
                  <p className="mt-1 text-sm font-medium text-white/80">Upgrade for longer sessions, deeper reports, and full history — your score below is real and yours to keep.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => router.push("/pricing")}
                className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#6200a8] shadow-[0_12px_30px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5"
              >
                See plans <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* ─── 1. HEADER ────────────────────────────────────────────────── */}
          {/* ─── PRINT VIEW (hidden on screen, shown only when printing) ─── */}
        <div className="hidden print:block">
          <PrintReport report={report} analytics={analytics} />
        </div>

        {/* ─── SCREEN VIEW (hidden when printing) ────────────────────── */}
        <div className="print:hidden">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full surface-low px-4 py-2 text-sm font-semibold text-secondary-token">
                Performance report
              </p>
              <h1 className="mt-5 text-5xl font-semibold leading-[0.95] tracking-[-0.055em] text-primary-token md:text-6xl">
                Your pressure<br />signature.
              </h1>
              <p className="mt-4 text-base font-medium leading-7 text-secondary-token">{report.summary}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <AIDisclaimer compact />
                {isPro ? (
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[var(--accent-primary)] px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(98,0,168,0.3)] transition hover:-translate-y-0.5 print:hidden"
                  >
                    <Download size={15} /> Download PDF
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => router.push("/pricing")}
                    className="inline-flex items-center gap-2 rounded-2xl surface-low px-4 py-2.5 text-sm font-semibold text-secondary-token ring-1 ring-[var(--border-soft)] transition hover:surface-medium print:hidden"
                  >
                    <Lock size={13} /> Download PDF · Pro
                  </button>
                )}
              </div>
            </div>
            <div className="rounded-[1.75rem] surface-high p-5">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent-primary)]">Session scores</p>
              <div className="grid grid-cols-2 gap-3">
                {([["Confidence", report.confidenceScore], ["Clarity", report.clarityScore], ["Calmness", report.calmnessScore], ["Structure", report.structureScore]] as [string, number][]).map(([label, score]) => (
                  <div key={label} className="rounded-2xl surface-medium p-4">
                    <div className="text-3xl font-semibold tracking-[-0.04em] text-primary-token">{score}</div>
                    <div className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-tertiary-token">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Nerve report (Nerve mode only) ──────────────────────────── */}
          {report.nerveReport && (
            <AnimatedSection className="mt-6 rounded-[1.5rem] surface-low p-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-500">Nerve Report</p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-2xl font-semibold tracking-[-0.03em]">Defendability Score</h2>
                <span className="rounded-2xl bg-rose-50 px-5 py-3 text-3xl font-semibold text-rose-800 ring-1 ring-rose-100 dark:bg-white/10 dark:text-white dark:ring-white/10">
                  {report.nerveReport.defendabilityScore ?? 0}
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl surface-medium p-4">
                  <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-300">Strongest defense</div>
                  <p className="mt-1 text-sm font-medium leading-6 text-secondary-token">{report.nerveReport.strongestDefense}</p>
                </div>
                <div className="rounded-2xl surface-medium p-4">
                  <div className="text-sm font-semibold text-rose-600 dark:text-rose-300">Weakest defense</div>
                  <p className="mt-1 text-sm font-medium leading-6 text-secondary-token">{report.nerveReport.weakestDefense}</p>
                </div>
              </div>
            </AnimatedSection>
          )}

          {/* ─── 2. KEY MOMENTS ───────────────────────────────────────────── */}
          {topCriticalMoments.length > 0 && (
            <AnimatedSection className="mt-6">
              <SectionHead label="What happened" title="Key moments this session" />
              <div className="space-y-3">
                {topCriticalMoments.map((moment, i) => (
                  <div key={i} className="flex gap-4 rounded-[1.25rem] surface-low p-4">
                    <span className="mt-0.5 shrink-0 rounded-xl bg-[var(--accent-primary)]/10 px-2.5 py-1 text-xs font-bold text-[var(--accent-primary)]">Turn {moment.turn}</span>
                    <div>
                      <p className="font-semibold text-primary-token">{moment.signal}</p>
                      <p className="mt-1 text-sm font-medium text-secondary-token">{moment.coaching}</p>
                    </div>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          )}

          {/* ─── 3. STRENGTHS + WEAK MOMENTS ─────────────────────────────── */}
          <AnimatedSection className="mt-6">
            <SectionHead label="This session" title="What you did well vs. what to sharpen" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] surface-low p-5">
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-300">Strengths</p>
                <ul className="mt-3 space-y-2.5">
                  {report.strengths.slice(0, 3).map((item) => (
                    <li key={item} className="flex gap-2 text-sm font-medium text-secondary-token">
                      <span className="mt-0.5 text-emerald-500">✓</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-[1.5rem] surface-low p-5">
                <p className="text-sm font-bold text-rose-500 dark:text-rose-300">Weak moments</p>
                <ul className="mt-3 space-y-2.5">
                  {report.weakMoments.slice(0, 3).map((item) => (
                    <li key={item} className="flex gap-2 text-sm font-medium text-secondary-token">
                      <span className="mt-0.5 text-rose-400">→</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </AnimatedSection>

          {/* ─── 4. REPLAY — top 3 turns ──────────────────────────────────── */}
          {topReplayItems.length > 0 && (
            <AnimatedSection className="mt-6">
              <SectionHead label="Replay" title="Your answers — and how to sharpen them" />
              <div className="space-y-4">
                {topReplayItems.map((item) => (
                  <details key={item.turn} className="group rounded-[1.5rem] surface-low">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-3 p-5">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent-primary)]">Turn {item.turn}</span>
                        <p className="mt-1 line-clamp-2 text-sm font-medium text-primary-token">{item.response}</p>
                        <p className="mt-1 text-xs font-semibold text-secondary-token">{item.analysis}</p>
                      </div>
                      <ChevronDown size={16} className="mt-1 shrink-0 text-secondary-token transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="border-t border-[var(--border-soft)] px-5 pb-5 pt-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl surface-medium p-3">
                          <p className="text-xs font-bold uppercase tracking-[0.12em] text-secondary-token">More concise</p>
                          <p className="mt-1 text-sm font-medium text-primary-token">{item.betterConcise}</p>
                        </div>
                        <div className="rounded-xl surface-medium p-3">
                          <p className="text-xs font-bold uppercase tracking-[0.12em] text-secondary-token">More persuasive</p>
                          <p className="mt-1 text-sm font-medium text-primary-token">{item.morePersuasive}</p>
                        </div>
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            </AnimatedSection>
          )}

          {/* ─── 5. WHAT TO WORK ON NEXT ──────────────────────────────────── */}
          <AnimatedSection className="mt-6">
            <SectionHead label="Next steps" title="What to focus on" />
            <div className="grid gap-4 sm:grid-cols-[1fr_1fr] lg:grid-cols-[1.4fr_0.6fr]">
              <div className="rounded-[1.5rem] surface-low p-5">
                <div className="flex items-center gap-2 text-sm font-bold text-[var(--accent-primary)]"><Lightbulb size={15} /> Next session focus</div>
                <p className="mt-3 font-medium leading-7 text-secondary-token">{report.nextRecommendation}</p>
                {report.drills.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {report.drills.slice(0, 3).map((drill) => (
                      <li key={drill} className="flex gap-2 text-sm font-medium text-secondary-token">
                        <span className="text-[var(--accent-primary)]">›</span> {drill}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="rounded-[1.5rem] surface-medium p-5">
                <div className="flex items-center gap-2 text-sm font-bold text-primary-token"><Flame size={15} className="text-orange-400" /> Progress</div>
                <div className="mt-3 space-y-2">
                  <div>
                    <p className="text-3xl font-semibold text-primary-token">{analytics.progression.streak ?? 1}<span className="ml-1 text-sm font-semibold text-secondary-token">day streak</span></p>
                  </div>
                  <p className="text-sm font-semibold text-[var(--accent-primary)]">{analytics.progression.skillLevel}</p>
                  <ul className="mt-2 space-y-1.5">
                    {(analytics.milestones || []).slice(0, 3).map((m) => (
                      <li key={m} className="text-xs font-medium text-secondary-token">→ {m}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* ─── 6. PROGRESS CHART ────────────────────────────────────────── */}
          <AnimatedSection className="mt-6">
            <SectionHead label="Over time" title="Score trend" />
            {analytics.trendData.length > 1 ? (
              <ImprovementTrendChart data={analytics.trendData} />
            ) : (
              <div className="rounded-[1.5rem] surface-low p-8 text-center">
                <TrendingUp size={28} className="mx-auto text-[var(--accent-primary)]" />
                <p className="mt-3 font-semibold text-primary-token">Your trend chart starts after your second session.</p>
                <p className="mt-2 text-sm font-medium text-secondary-token">Come back after your next practice to see how you're improving.</p>
              </div>
            )}
          </AnimatedSection>

          {/* ─── Beginner coaching hints (if applicable) ────────────────── */}
          {hints.length > 0 && (
            <AnimatedSection className="mt-6 rounded-[1.5rem] surface-low p-6">
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--accent-primary)]"><Lightbulb size={15} /> Coaching moments this session</div>
              <div className="mt-4 space-y-3">
                {hints.slice(0, 4).map((hint) => (
                  <div key={hint.hintId} className="rounded-2xl surface-medium p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary-token">{hint.hintType} · {hint.triggerReason.replaceAll("_", " ")}</p>
                    <p className="mt-1.5 font-semibold leading-7 text-primary-token">{hint.hintText}</p>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          )}

          {/* ─── Session replay timeline ────────────────────────────────── */}
          <div className="mt-6">
            <SessionReplayTimeline sessionId={report.sessionId} token={authToken} />
          </div>

          {/* ─── Deep analysis (accordion — hidden by default) ──────────── */}
          <AnimatedSection className="mt-6 rounded-[1.5rem] surface-low">
            <button
              type="button"
              onClick={() => setDeepOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-4 p-5 text-left"
            >
              <span className="font-semibold text-primary-token">Full performance breakdown</span>
              <ChevronDown size={18} className={`shrink-0 text-secondary-token transition-transform ${deepOpen ? "rotate-180" : ""}`} />
            </button>
            {deepOpen && (
              <div className="border-t border-[var(--border-soft)] p-5 pt-4">
                <StaggeredGrid className="grid gap-4 sm:grid-cols-2">
                  <RadarPerformanceChart data={analytics.radarData} />
                  <div className="space-y-4">
                    <div className="rounded-[1.25rem] surface-medium p-4">
                      <p className="text-sm font-bold text-primary-token">Communication</p>
                      <ul className="mt-2 space-y-1.5 text-sm font-medium text-secondary-token">
                        <li>Filler words: <strong className="text-primary-token">{analytics.communicationMetrics.fillerWordCount}</strong></li>
                        <li>Avg words/turn: <strong className="text-primary-token">{analytics.communicationMetrics.averageWordsPerTurn}</strong></li>
                        <li>Directness: <strong className="text-primary-token">{analytics.communicationMetrics.directness}/100</strong></li>
                      </ul>
                    </div>
                    <div className="rounded-[1.25rem] surface-medium p-4">
                      <p className="text-sm font-bold text-primary-token">Pressure resilience</p>
                      <ul className="mt-2 space-y-1.5 text-sm font-medium text-secondary-token">
                        <li>Stability: <strong className="text-primary-token">{analytics.pressureMetrics.pressureStabilityScore}/100</strong></li>
                        <li>Recovery: <strong className="text-primary-token">{analytics.pressureMetrics.emotionalRecoveryScore}/100</strong></li>
                        <li>Stress spikes: <strong className="text-primary-token">{analytics.pressureMetrics.stressSpikes}</strong></li>
                      </ul>
                    </div>
                  </div>
                </StaggeredGrid>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {report.missedOpportunities.length > 0 && (
                    <div className="rounded-[1.25rem] surface-medium p-4">
                      <p className="text-sm font-bold text-primary-token">Missed opportunities</p>
                      <ul className="mt-2 space-y-2 text-sm font-medium text-secondary-token">
                        {report.missedOpportunities.slice(0, 3).map((item) => <li key={item}>→ {item}</li>)}
                      </ul>
                    </div>
                  )}
                  {report.improvedResponses.length > 0 && (
                    <div className="rounded-[1.25rem] surface-medium p-4">
                      <p className="text-sm font-bold text-primary-token">Better responses</p>
                      <ul className="mt-2 space-y-2 text-sm font-medium text-secondary-token">
                        {report.improvedResponses.slice(0, 3).map((item) => <li key={item}>→ {item}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-bold text-primary-token">AI insights</p>
                  {(analytics.historicalInsights || []).map((item) => (
                    <p key={item} className="text-sm font-medium text-secondary-token">• {item}</p>
                  ))}
                </div>
              </div>
            )}
          </AnimatedSection>

          {/* ─── HABIT UPSELL ──────────────────────────────────────────────── */}
          <AnimatedSection className="mt-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-600 to-[#6200a8] p-8 text-white shadow-[0_30px_70px_rgba(98,0,168,0.28)]">
            <h2 className="text-3xl font-semibold tracking-[-0.04em]">
              {report.confidenceScore >= 75
                ? `You scored ${report.confidenceScore} on confidence. Keep the streak.`
                : `You scored ${report.confidenceScore} on confidence. Train 3× a week to break 75.`}
            </h2>
            <p className="mt-3 max-w-lg text-base font-medium leading-7 text-white/72">
              Single sessions improve awareness. Consistent sessions build muscle memory.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={() => router.push("/practice/setup")} className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-[#6200a8] shadow-[0_14px_30px_rgba(0,0,0,0.15)] transition hover:-translate-y-0.5">
                <CalendarClock size={16} /> Set up a routine <ArrowRight size={16} />
              </button>
              <button type="button" onClick={() => router.push("/practice/setup")} className="inline-flex items-center gap-2 rounded-2xl bg-white/15 px-6 py-3.5 text-sm font-bold text-white ring-1 ring-white/20 transition hover:-translate-y-0.5 hover:bg-white/25">
                Practice again
              </button>
            </div>
          </AnimatedSection>

          <div className="mt-6">
            <PracticeRoutinePanel />
          </div>

        </div>{/* end screen view */}

        </AnimatedPage>
      </main>
    </ProtectedRoute>
  );
}

/* ─── Print-only report component ─────────────────────────────────────────── */
function PrintReport({ report, analytics }: { report: Report; analytics: PerformanceAnalytics }) {
  const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const scores = [
    { label: "Confidence", value: report.confidenceScore },
    { label: "Clarity", value: report.clarityScore },
    { label: "Calmness", value: report.calmnessScore },
    { label: "Structure", value: report.structureScore },
    { label: "Persuasion", value: report.persuasivenessScore },
  ];

  return (
    <>
      {/* Inject print page styles */}
      <style>{`
        @page {
          size: A4;
          margin: 18mm 16mm;
        }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a; background: #fff; }
        }
        .pr-header { display:flex; align-items:flex-start; justify-content:space-between; border-bottom:2px solid #6200a8; padding-bottom:12px; margin-bottom:20px; }
        .pr-logo { font-size:20px; font-weight:900; letter-spacing:-0.04em; color:#6200a8; }
        .pr-meta { text-align:right; font-size:11px; color:#64748b; line-height:1.6; }
        .pr-summary { font-size:13px; line-height:1.6; color:#334155; margin-bottom:18px; padding:12px 14px; background:#f8f5ff; border-left:3px solid #6200a8; border-radius:4px; }
        .pr-scores { display:grid; grid-template-columns:repeat(5,1fr); gap:8px; margin-bottom:20px; }
        .pr-score-cell { text-align:center; padding:10px 6px; border:1px solid #e2e8f0; border-radius:8px; }
        .pr-score-num { font-size:26px; font-weight:800; color:#6200a8; line-height:1; }
        .pr-score-lbl { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; color:#94a3b8; margin-top:4px; }
        .pr-cols { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:18px; }
        .pr-section-title { font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.12em; color:#6200a8; margin-bottom:8px; }
        .pr-list { list-style:none; padding:0; margin:0; }
        .pr-list li { font-size:12px; color:#334155; line-height:1.55; padding:4px 0; border-bottom:1px solid #f1f5f9; }
        .pr-list li:last-child { border-bottom:none; }
        .pr-next { margin-bottom:18px; }
        .pr-next-text { font-size:12px; color:#334155; line-height:1.6; padding:10px 14px; border:1px solid #e2e8f0; border-radius:6px; }
        .pr-milestones { display:flex; gap:8px; flex-wrap:wrap; margin-top:8px; }
        .pr-milestone { font-size:10px; font-weight:600; background:#f1f5f9; border-radius:100px; padding:4px 10px; color:#475569; }
        .pr-footer { border-top:1px solid #e2e8f0; padding-top:10px; margin-top:20px; display:flex; justify-content:space-between; align-items:center; }
        .pr-footer-note { font-size:10px; color:#94a3b8; }
        .pr-footer-brand { font-size:12px; font-weight:700; color:#6200a8; }
        .pr-streak { display:inline-flex; align-items:center; gap:6px; font-size:11px; font-weight:700; color:#f97316; background:#fff7ed; border-radius:100px; padding:4px 10px; }
        .pr-subtitle { font-size:13px; font-weight:600; color:#334155; margin-top:2px; }
        .pr-streak-wrap { margin-top:4px; }
        .pr-milestones-section { margin-bottom:18px; }
      `}</style>

      <div className="pr-header">
        <div>
          <div className="pr-logo">RehearseAI</div>
          <div className="pr-subtitle">Performance Report</div>
        </div>
        <div className="pr-meta">
          <div>{String(analytics.challengeResult?.challengeType || "Practice session")}</div>
          <div>{date}</div>
          {analytics.progression?.streak && <div className="pr-streak-wrap">
            <span className="pr-streak">🔥 {analytics.progression.streak}-day streak</span>
          </div>}
        </div>
      </div>

      {report.summary && <div className="pr-summary">{report.summary}</div>}

      <div className="pr-scores">
        {scores.map(({ label, value }) => (
          <div key={label} className="pr-score-cell">
            <div className="pr-score-num">{value}</div>
            <div className="pr-score-lbl">{label}</div>
          </div>
        ))}
      </div>

      <div className="pr-cols">
        <div>
          <div className="pr-section-title">Strengths</div>
          <ul className="pr-list">
            {report.strengths.slice(0, 4).map((item) => <li key={item}>✓ {item}</li>)}
          </ul>
        </div>
        <div>
          <div className="pr-section-title">Weak moments</div>
          <ul className="pr-list">
            {report.weakMoments.slice(0, 4).map((item) => <li key={item}>→ {item}</li>)}
          </ul>
        </div>
      </div>

      {report.nextRecommendation && (
        <div className="pr-next">
          <div className="pr-section-title">Next focus</div>
          <div className="pr-next-text">{report.nextRecommendation}</div>
          {report.drills.length > 0 && (
            <div className="pr-milestones">
              {report.drills.slice(0, 3).map((d) => <span key={d} className="pr-milestone">{d}</span>)}
            </div>
          )}
        </div>
      )}

      {(analytics.milestones || []).length > 0 && (
        <div className="pr-milestones-section">
          <div className="pr-section-title">Goals to hit next</div>
          <ul className="pr-list">
            {analytics.milestones.slice(0, 3).map((m) => <li key={m}>› {m}</li>)}
          </ul>
        </div>
      )}

      <div className="pr-footer">
        <span className="pr-footer-note">This report was generated automatically from your practice session data. Scores reflect AI analysis and are for coaching purposes only.</span>
        <span className="pr-footer-brand">rehearseai.dev</span>
      </div>
    </>
  );
}
