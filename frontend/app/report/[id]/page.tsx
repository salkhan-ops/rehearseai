"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
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
import { getReport, getReportAnalytics } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { PerformanceAnalytics, Report } from "@/lib/types";

function ListSection({ title, items }: { title: string; items: string[] }) {
  return (
    <AnimatedSection className="rounded-[1.5rem] bg-white p-6 shadow-[0_14px_40px_rgba(35,45,75,0.04)] ring-1 ring-slate-200/75 dark:bg-white/10 dark:ring-white/10">
      <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-900 dark:text-white">{title}</h2>
      <ul className="mt-4 space-y-3 font-medium text-slate-600 dark:text-white/60">
        {items.map((item) => <li key={item}>• {item}</li>)}
      </ul>
    </AnimatedSection>
  );
}

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [analytics, setAnalytics] = useState<PerformanceAnalytics | null>(null);
  const { getToken } = useAuth();

  useEffect(() => {
    getToken().then((token: string | null) => Promise.all([getReport(id, token), getReportAnalytics(id, token)])).then(([nextReport, nextAnalytics]: [Report, PerformanceAnalytics]) => {
      setReport(nextReport);
      setAnalytics(nextAnalytics);
    });
  }, [id, getToken]);

  if (!report || !analytics) return <main className="min-h-screen bg-[#f4f8fc] dark:bg-[#0e1020]"><Nav /><div className="px-4 py-12 text-center font-semibold text-slate-700 dark:text-white/70">Loading performance intelligence...</div></main>;

  return (
    <main className="min-h-screen bg-[#f4f8fc] dark:bg-[#0e1020]">
      <Nav />
      <AnimatedPage className="mx-auto max-w-6xl px-4 py-16">
        <div className="max-w-4xl">
          <p className="w-fit rounded-full bg-white px-4 py-2 text-sm font-semibold text-violet-700 ring-1 ring-violet-100 dark:bg-white/10 dark:text-violet-100 dark:ring-white/10">Performance Intelligence</p>
          <h1 className="mt-6 text-5xl font-semibold tracking-[-0.045em] text-slate-900 dark:text-white md:text-6xl">Cognitive performance under pressure.</h1>
          <p className="mt-5 text-lg font-medium leading-8 text-slate-600 dark:text-white/60">{report.summary}</p>
        </div>

        <StaggeredGrid className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <AnimatedCard><ScoreCard label="Confidence" score={report.confidenceScore} /></AnimatedCard>
          <AnimatedCard><ScoreCard label="Clarity" score={report.clarityScore} /></AnimatedCard>
          <AnimatedCard><ScoreCard label="Persuasiveness" score={report.persuasivenessScore} /></AnimatedCard>
          <AnimatedCard><ScoreCard label="Calmness" score={report.calmnessScore} /></AnimatedCard>
          <AnimatedCard><ScoreCard label="Structure" score={report.structureScore} /></AnimatedCard>
        </StaggeredGrid>

        <div className="mt-4 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
          <ResilienceScoreCard metrics={analytics.pressureMetrics} />
          <AnimatedSection className="rounded-[1.5rem] bg-white p-6 shadow-[0_14px_40px_rgba(35,45,75,0.04)] ring-1 ring-slate-200/75 dark:bg-white/10 dark:ring-white/10">
            <h2 className="text-2xl font-semibold tracking-[-0.035em] text-slate-900 dark:text-white">Adaptive AI personality engine</h2>
            <p className="mt-3 font-medium leading-7 text-slate-600 dark:text-white/60">
              The persona adjusted pressure based on hesitation, generic phrasing, evidence strength, defensiveness, and recovery signals.
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/10">
                <div className="text-sm font-semibold text-slate-500 dark:text-white/50">Pressure level</div>
                <div className="mt-1 text-xl font-semibold capitalize text-slate-900 dark:text-white">{String(analytics.adaptivePersona.currentPressureLevel || "moderate")}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-white/10">
                <div className="text-sm font-semibold text-slate-500 dark:text-white/50">Next behavior</div>
                <div className="mt-1 font-semibold text-slate-900 dark:text-white">{String(analytics.adaptivePersona.nextBehavior || "challenge weak logic")}</div>
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

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <AnimatedSection className="rounded-[1.5rem] bg-white p-6 shadow-[0_14px_40px_rgba(35,45,75,0.04)] ring-1 ring-slate-200/75 dark:bg-white/10 dark:ring-white/10">
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-900 dark:text-white">Challenge mode result</h2>
            <p className="mt-2 font-medium capitalize text-slate-600 dark:text-white/60">{String(analytics.challengeResult.challengeType || "pressure simulation")}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                ["Survival", analytics.challengeResult.survivalScore],
                ["Endurance", analytics.challengeResult.pressureEnduranceScore],
                ["Reasoning Stability", analytics.challengeResult.reasoningStabilityScore],
                ["Interruption Recovery", analytics.challengeResult.interruptionRecoveryScore],
              ].map(([label, score]) => (
                <div key={String(label)} className="rounded-2xl bg-slate-50 p-4 dark:bg-white/10">
                  <div className="text-3xl font-semibold tracking-[-0.04em] text-[#6200a8] dark:text-violet-100">{String(score)}</div>
                  <div className="mt-1 text-sm font-semibold text-slate-600 dark:text-white/60">{label}</div>
                </div>
              ))}
            </div>
          </AnimatedSection>
          <AnimatedSection className="rounded-[1.5rem] bg-white p-6 shadow-[0_14px_40px_rgba(35,45,75,0.04)] ring-1 ring-slate-200/75 dark:bg-white/10 dark:ring-white/10">
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-900 dark:text-white">Progression system</h2>
            <p className="mt-2 font-medium text-slate-600 dark:text-white/60">Level: {String(analytics.progression.skillLevel || "Foundation")} • Streak: {String(analytics.progression.streak || 1)}</p>
            <ul className="mt-4 space-y-3 font-medium text-slate-600 dark:text-white/60">
              {Array.isArray(analytics.progression.achievements) && analytics.progression.achievements.map((item) => <li key={String(item)}>• {item}</li>)}
            </ul>
          </AnimatedSection>
        </div>

        <AnimatedSection className="mt-4">
          <ShareableReportCard highlights={analytics.shareHighlights} />
        </AnimatedSection>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <AnimatedSection className="rounded-[1.5rem] bg-white p-6 shadow-[0_14px_40px_rgba(35,45,75,0.04)] ring-1 ring-slate-200/75 dark:bg-white/10 dark:ring-white/10">
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-900 dark:text-white">Historical intelligence</h2>
            <ul className="mt-4 space-y-3 font-medium text-slate-600 dark:text-white/60">
              {analytics.historicalInsights.map((item) => <li key={item}>• {item}</li>)}
            </ul>
          </AnimatedSection>
          <AnimatedSection className="rounded-[1.5rem] bg-[#6200a8] p-6 text-white shadow-[0_18px_55px_rgba(98,0,168,0.16)]">
            <h2 className="text-xl font-semibold tracking-[-0.03em]">Motivation loop</h2>
            <ul className="mt-4 space-y-3 font-medium text-white/75">
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
          <div className="rounded-[1.5rem] bg-[#6200a8] p-6 text-white shadow-[0_18px_55px_rgba(98,0,168,0.16)]">
            <h2 className="text-xl font-semibold tracking-[-0.03em]">Next session recommendation</h2>
            <p className="mt-4 font-medium text-white/75">{report.nextRecommendation}</p>
          </div>
        </div>
      </AnimatedPage>
    </main>
  );
}
