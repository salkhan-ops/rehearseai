"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, BrainCircuit, CalendarClock, Lightbulb, Sparkles } from "lucide-react";
import { BenchmarkComparisonChart } from "@/components/analytics/BenchmarkComparisonChart";
import { CommunicationEfficiencyChart } from "@/components/analytics/CommunicationEfficiencyChart";
import { ConfidenceTrendChart } from "@/components/analytics/ConfidenceTrendChart";
import { DecisionTreeDiagram } from "@/components/analytics/DecisionTreeDiagram";
import { ImprovementTrendChart } from "@/components/analytics/ImprovementTrendChart";
import { PressureResponseGraph } from "@/components/analytics/PressureResponseGraph";
import { PressureTimelineChart } from "@/components/analytics/PressureTimelineChart";
import { RadarPerformanceChart } from "@/components/analytics/RadarPerformanceChart";
import { ReasoningAnalysisCard } from "@/components/analytics/ReasoningAnalysisCard";
import { ResilienceScoreCard } from "@/components/analytics/ResilienceScoreCard";
import { SessionTimelineChart } from "@/components/analytics/SessionTimelineChart";
import { SessionReplayPanel } from "@/components/analytics/SessionReplayPanel";
import { ShareableReportCard } from "@/components/analytics/ShareableReportCard";
import { WeaknessHeatmap } from "@/components/analytics/WeaknessHeatmap";
import { AnimatedCard, AnimatedPage, AnimatedSection, StaggeredGrid } from "@/components/animations";
import { Nav } from "@/components/Nav";
import { ScoreCard } from "@/components/ScoreCard";
import { PracticeRoutinePanel } from "@/components/scheduling/PracticeRoutinePanel";
import { AIDisclaimer } from "@/components/legal/AIDisclaimer";
import { getReport, getReportAnalytics, getSessionHints } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { isRtlLanguage } from "@/lib/languages";
import type { PerformanceAnalytics, Report, SessionHint } from "@/lib/types";
import { SessionReplayTimeline } from "@/components/report/SessionReplayTimeline";

function ListSection({ title, items }: { title: string; items: string[] }) {
  return (
    <AnimatedSection className="rounded-[1.5rem] surface-low p-6">
      <h2 className="text-xl font-semibold tracking-[-0.03em] text-primary-token">{title}</h2>
      <ul className="mt-4 space-y-3 font-medium text-secondary-token">
        {items.map((item) => <li key={item}>• {item}</li>)}
      </ul>
    </AnimatedSection>
  );
}

function ReportAmbient() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute left-1/2 top-24 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-violet-500/18 blur-3xl" />
      <div className="absolute right-[-12rem] top-1/3 h-[34rem] w-[34rem] rounded-full bg-cyan-400/14 blur-3xl" />
      <div className="absolute bottom-[-14rem] left-[-10rem] h-[32rem] w-[32rem] rounded-full bg-blue-500/16 blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:74px_74px] opacity-25" />
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
  const { getToken } = useAuth();

  useEffect(() => {
    if (!id) return;
    getToken().then(async (token: string | null) => {
      setAuthToken(token);
      const [nextReport, nextAnalytics] = await Promise.all([getReport(id, token), getReportAnalytics(id, token)]);
      const nextHints = await getSessionHints(nextReport.sessionId, token).catch(() => []);
      return [nextReport, nextAnalytics, nextHints] as const;
    }).then(([nextReport, nextAnalytics, nextHints]) => {
      setReport(nextReport);
      setAnalytics(nextAnalytics);
      setHints(nextHints);
    });
  }, [id, getToken]);

  if (!report || !analytics) return <main className="cog-bg min-h-screen text-primary-token"><ReportAmbient /><div className="relative px-4 py-12 text-center font-semibold text-secondary-token">Loading performance intelligence...</div></main>;

  return (
    <main className="cog-bg relative min-h-screen overflow-hidden text-primary-token" dir={isRtlLanguage(report.feedbackLanguage) ? "rtl" : "ltr"}>
      <ReportAmbient />
      <Nav />
      <AnimatedPage className="relative z-10 mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full surface-low px-4 py-2 text-sm font-semibold text-secondary-token"><BrainCircuit size={16} /> Performance Intelligence</p>
            <h1 className="mt-6 text-5xl font-semibold leading-[0.95] tracking-[-0.055em] text-primary-token md:text-7xl">Your pressure signature.</h1>
            <p className="mt-5 text-lg font-medium leading-8 text-secondary-token">{report.summary}</p>
          </div>
          <div className="rounded-[2rem] surface-high p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--accent-primary)]"><Sparkles size={16} /> Session snapshot</div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                ["Confidence", report.confidenceScore],
                ["Clarity", report.clarityScore],
                ["Calmness", report.calmnessScore],
                ["Structure", report.structureScore],
              ].map(([label, score]) => (
                <div key={String(label)} className="rounded-2xl surface-medium p-4">
                  <div className="text-3xl font-semibold tracking-[-0.04em] text-primary-token">{score}</div>
                  <div className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-tertiary-token">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <AIDisclaimer compact />
        </div>

        <StaggeredGrid className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <AnimatedCard><ScoreCard label="Confidence" score={report.confidenceScore} /></AnimatedCard>
          <AnimatedCard><ScoreCard label="Clarity" score={report.clarityScore} /></AnimatedCard>
          <AnimatedCard><ScoreCard label="Persuasiveness" score={report.persuasivenessScore} /></AnimatedCard>
          <AnimatedCard><ScoreCard label="Calmness" score={report.calmnessScore} /></AnimatedCard>
          <AnimatedCard><ScoreCard label="Structure" score={report.structureScore} /></AnimatedCard>
        </StaggeredGrid>

        {report.nerveReport && (
          <AnimatedSection className="mt-4 rounded-[1.5rem] bg-white p-6 text-slate-950 shadow-[0_18px_60px_rgba(15,23,42,0.08)] ring-1 ring-slate-200 dark:bg-slate-950 dark:text-white dark:shadow-none dark:ring-white/10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-700 dark:text-rose-200/80">Nerve Report</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Defendability Score</h2>
              </div>
              <div className="rounded-2xl bg-rose-50 px-5 py-4 text-4xl font-semibold text-rose-800 ring-1 ring-rose-100 dark:bg-white/10 dark:text-white dark:ring-white/10">
                {report.nerveReport.defendabilityScore ?? 0}
              </div>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-4">
              {Object.entries(report.nerveReport.metrics || {}).map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-white/10 dark:ring-white/10">
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-white/45">{label}</div>
                  <div className="mt-2 text-2xl font-semibold">{value}</div>
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-white/10 dark:ring-white/10">
                <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-100">Strongest defense</div>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-600 dark:text-white/72">{report.nerveReport.strongestDefense}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-white/10 dark:ring-white/10">
                <div className="text-sm font-semibold text-rose-700 dark:text-rose-100">Weakest defense</div>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-600 dark:text-white/72">{report.nerveReport.weakestDefense}</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 lg:grid-cols-3">
              <div>
                <div className="text-sm font-semibold text-slate-950 dark:text-white">Questions that broke you</div>
                <ul className="mt-2 space-y-2 text-sm font-medium leading-6 text-slate-600 dark:text-white/64">
                  {(report.nerveReport.questionsThatBrokeYou || []).map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-950 dark:text-white">Assumptions you could not defend</div>
                <ul className="mt-2 space-y-2 text-sm font-medium leading-6 text-slate-600 dark:text-white/64">
                  {(report.nerveReport.assumptionsYouCouldNotDefend || []).map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-950 dark:text-white">Follow-up practice</div>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-600 dark:text-white/64">{report.nerveReport.recommendedFollowUpPractice}</p>
              </div>
            </div>
          </AnimatedSection>
        )}

        <div className="mt-4 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
          <ResilienceScoreCard metrics={analytics.pressureMetrics} />
          <AnimatedSection className="rounded-[1.5rem] surface-low p-6">
            <h2 className="text-2xl font-semibold tracking-[-0.035em] text-primary-token">Adaptive AI personality engine</h2>
            <p className="mt-3 font-medium leading-7 text-secondary-token">
              The persona adjusted pressure based on hesitation, generic phrasing, evidence strength, defensiveness, and recovery signals.
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl surface-medium p-4">
                <div className="text-sm font-semibold text-tertiary-token">Pressure level</div>
                <div className="mt-1 text-xl font-semibold capitalize text-primary-token">{String(analytics.adaptivePersona.currentPressureLevel || "moderate")}</div>
              </div>
              <div className="rounded-2xl surface-medium p-4">
                <div className="text-sm font-semibold text-tertiary-token">Next behavior</div>
                <div className="mt-1 font-semibold text-primary-token">{String(analytics.adaptivePersona.nextBehavior || "challenge weak logic")}</div>
              </div>
            </div>
          </AnimatedSection>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <RadarPerformanceChart data={analytics.radarData} />
          <BenchmarkComparisonChart metrics={analytics.benchmarkMetrics} />
          <SessionTimelineChart data={analytics.timelineData} />
          <PressureTimelineChart data={analytics.timelineData} />
          <PressureResponseGraph data={analytics.pressureData} />
          <ConfidenceTrendChart data={analytics.pressureData} />
          <CommunicationEfficiencyChart data={analytics.efficiencyData} />
          <WeaknessHeatmap data={analytics.heatmapData} />
          <ImprovementTrendChart data={analytics.trendData} />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <ReasoningAnalysisCard analytics={analytics} />
          {analytics.decisionTrees[0] && <DecisionTreeDiagram tree={analytics.decisionTrees[0]} />}
        </div>

        <AnimatedSection className="mt-4">
          <SessionReplayPanel replayItems={analytics.replayItems} criticalMoments={analytics.criticalMoments} />
        </AnimatedSection>

        {hints.length > 0 && (
          <AnimatedSection className="mt-4 rounded-[1.5rem] surface-low p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--accent-primary)]"><Lightbulb size={16} /> Beginner coaching timeline</div>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-primary-token">Where reasoning support appeared</h2>
            <div className="mt-5 grid gap-3">
              {hints.map((hint) => (
                <div key={hint.hintId} className="rounded-2xl surface-medium p-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-tertiary-token">
                    <span>{new Date(hint.timestamp || hint.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    <span>{hint.hintType}</span>
                    <span>{hint.triggerReason.replaceAll("_", " ")}</span>
                  </div>
                  <p className="mt-2 font-semibold leading-7 text-primary-token">{hint.hintText}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl surface-medium p-4">
                <div className="text-sm font-semibold text-tertiary-token">Missed opportunities</div>
                <p className="mt-2 text-sm font-medium leading-6 text-secondary-token">{report.missedOpportunities[0] || "Use each hint as a signal to pause, narrow the point, and make the reasoning visible."}</p>
              </div>
              <div className="rounded-2xl surface-medium p-4">
                <div className="text-sm font-semibold text-tertiary-token">Better reasoning approach</div>
                <p className="mt-2 text-sm font-medium leading-6 text-secondary-token">{report.improvedResponses[0] || "Answer the objection directly, then support the claim with one concrete example."}</p>
              </div>
              <div className="rounded-2xl surface-medium p-4">
                <div className="text-sm font-semibold text-tertiary-token">Next focus</div>
                <p className="mt-2 text-sm font-medium leading-6 text-secondary-token">{report.nextRecommendation}</p>
              </div>
            </div>
          </AnimatedSection>
        )}

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <AnimatedSection className="rounded-[1.5rem] surface-low p-6">
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-primary-token">Challenge mode result</h2>
            <p className="mt-2 font-medium capitalize text-secondary-token">{String(analytics.challengeResult.challengeType || "pressure simulation")}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                ["Survival", analytics.challengeResult.survivalScore],
                ["Endurance", analytics.challengeResult.pressureEnduranceScore],
                ["Reasoning Stability", analytics.challengeResult.reasoningStabilityScore],
                ["Interruption Recovery", analytics.challengeResult.interruptionRecoveryScore],
              ].map(([label, score]) => (
                <div key={String(label)} className="rounded-2xl surface-medium p-4">
                  <div className="text-3xl font-semibold tracking-[-0.04em] text-[var(--accent-primary)]">{String(score)}</div>
                  <div className="mt-1 text-sm font-semibold text-secondary-token">{label}</div>
                </div>
              ))}
            </div>
          </AnimatedSection>
          <AnimatedSection className="rounded-[1.5rem] surface-low p-6">
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-primary-token">Progression system</h2>
            <p className="mt-2 font-medium text-secondary-token">Level: {String(analytics.progression.skillLevel || "Foundation")} • Streak: {String(analytics.progression.streak || 1)}</p>
            <ul className="mt-4 space-y-3 font-medium text-secondary-token">
              {Array.isArray(analytics.progression.achievements) && analytics.progression.achievements.map((item) => <li key={String(item)}>• {item}</li>)}
            </ul>
          </AnimatedSection>
        </div>

        <AnimatedSection className="mt-4">
          <ShareableReportCard highlights={analytics.shareHighlights} />
        </AnimatedSection>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <AnimatedSection className="rounded-[1.5rem] surface-low p-6">
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-primary-token">Historical intelligence</h2>
            <ul className="mt-4 space-y-3 font-medium text-secondary-token">
              {analytics.historicalInsights.map((item) => <li key={item}>• {item}</li>)}
            </ul>
          </AnimatedSection>
          <AnimatedSection className="rounded-[1.5rem] surface-medium p-6">
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-primary-token">Motivation loop</h2>
            <ul className="mt-4 space-y-3 font-medium text-secondary-token">
              {analytics.milestones.map((item) => <li key={item}>• {item}</li>)}
            </ul>
          </AnimatedSection>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <ListSection title="Strengths" items={report.strengths} />
          <ListSection title="Weak moments" items={report.weakMoments} />
          <ListSection title="Missed opportunities" items={report.missedOpportunities} />
          <ListSection title="Improved responses" items={report.improvedResponses} />
          <ListSection title="Practice drills" items={report.drills} />
          <div className="rounded-[1.5rem] surface-medium p-6">
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-primary-token">Next session recommendation</h2>
            <p className="mt-4 font-medium text-secondary-token">{report.nextRecommendation}</p>
          </div>
        </div>

        <SessionReplayTimeline sessionId={report.sessionId} token={authToken} />

        {/* Habit upsell — shown after every session */}
        <AnimatedSection className="mt-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-600 to-[#6200a8] p-8 text-white shadow-[0_30px_70px_rgba(98,0,168,0.28)]">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
                <CalendarClock size={13} /> Make it a habit
              </div>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.045em] md:text-4xl">
                {report.confidenceScore >= 75
                  ? `You scored ${report.confidenceScore} on confidence. Keep the streak.`
                  : `You scored ${report.confidenceScore} on confidence. Train 3× a week to break 75.`}
              </h2>
              <p className="mt-3 max-w-xl text-base font-medium leading-7 text-white/72">
                The biggest gains come from consistency, not single sessions. Set a routine and RehearseAI will remind you when it's time.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/practice/setup")}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-[#6200a8] shadow-[0_14px_30px_rgba(0,0,0,0.15)] transition hover:-translate-y-0.5"
                >
                  <CalendarClock size={16} /> Set up a routine <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/practice/setup")}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white/15 px-6 py-3.5 text-sm font-bold text-white ring-1 ring-white/20 transition hover:-translate-y-0.5 hover:bg-white/25"
                >
                  Practice again <ArrowRight size={16} />
                </button>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Confidence", report.confidenceScore],
                  ["Clarity", report.clarityScore],
                  ["Calmness", report.calmnessScore],
                  ["Structure", report.structureScore],
                ].map(([label, score]) => (
                  <div key={String(label)} className="rounded-2xl bg-white/10 p-4 text-center ring-1 ring-white/10">
                    <div className="text-2xl font-bold">{score}</div>
                    <div className="mt-0.5 text-xs font-semibold text-white/60">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AnimatedSection>

        <div className="mt-6">
          <PracticeRoutinePanel />
        </div>
      </AnimatedPage>
    </main>
  );
}
