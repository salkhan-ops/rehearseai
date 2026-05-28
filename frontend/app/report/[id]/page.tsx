"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatedCard, AnimatedPage, AnimatedSection, StaggeredGrid } from "@/components/animations";
import { Nav } from "@/components/Nav";
import { ScoreCard } from "@/components/ScoreCard";
import { getReport } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Report } from "@/lib/types";

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
  const { getToken } = useAuth();

  useEffect(() => {
    getToken().then((token) => getReport(id, token)).then(setReport);
  }, [id, getToken]);

  if (!report) return <main className="min-h-screen bg-[#f4f8fc] dark:bg-[#0e1020]"><Nav /><div className="px-4 py-12 text-center font-semibold text-slate-700 dark:text-white/70">Loading report...</div></main>;

  return (
    <main className="min-h-screen bg-[#f4f8fc] dark:bg-[#0e1020]">
      <Nav />
      <AnimatedPage className="mx-auto max-w-6xl px-4 py-16">
        <h1 className="text-5xl font-semibold tracking-[-0.045em] text-slate-900 dark:text-white md:text-6xl">Your rehearsal report</h1>
        <p className="mt-5 max-w-3xl text-lg font-medium leading-8 text-slate-600 dark:text-white/60">{report.summary}</p>
        <StaggeredGrid className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <AnimatedCard><ScoreCard label="Confidence" score={report.confidenceScore} /></AnimatedCard>
          <AnimatedCard><ScoreCard label="Clarity" score={report.clarityScore} /></AnimatedCard>
          <AnimatedCard><ScoreCard label="Persuasiveness" score={report.persuasivenessScore} /></AnimatedCard>
          <AnimatedCard><ScoreCard label="Calmness" score={report.calmnessScore} /></AnimatedCard>
          <AnimatedCard><ScoreCard label="Structure" score={report.structureScore} /></AnimatedCard>
        </StaggeredGrid>
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
