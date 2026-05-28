"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Nav } from "@/components/Nav";
import { ScoreCard } from "@/components/ScoreCard";
import { getReport } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Report } from "@/lib/types";

function ListSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-soft ring-1 ring-black/5">
      <h2 className="text-xl font-black">{title}</h2>
      <ul className="mt-4 space-y-3 text-black/65">
        {items.map((item) => <li key={item}>• {item}</li>)}
      </ul>
    </div>
  );
}

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const { getToken } = useAuth();

  useEffect(() => {
    getToken().then((token) => getReport(id, token)).then(setReport);
  }, [id, getToken]);

  if (!report) return <main><Nav /><div className="px-4 py-12 text-center font-bold">Loading report...</div></main>;

  return (
    <main>
      <Nav />
      <section className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-4xl font-black md:text-6xl">Your rehearsal report</h1>
        <p className="mt-4 max-w-3xl text-lg text-black/60">{report.summary}</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <ScoreCard label="Confidence" score={report.confidenceScore} />
          <ScoreCard label="Clarity" score={report.clarityScore} />
          <ScoreCard label="Persuasiveness" score={report.persuasivenessScore} />
          <ScoreCard label="Calmness" score={report.calmnessScore} />
          <ScoreCard label="Structure" score={report.structureScore} />
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <ListSection title="Strengths" items={report.strengths} />
          <ListSection title="Weak moments" items={report.weakMoments} />
          <ListSection title="Missed opportunities" items={report.missedOpportunities} />
          <ListSection title="Improved responses" items={report.improvedResponses} />
          <ListSection title="Practice drills" items={report.drills} />
          <div className="rounded-3xl bg-ink p-6 text-white shadow-soft">
            <h2 className="text-xl font-black">Next session recommendation</h2>
            <p className="mt-4 text-white/75">{report.nextRecommendation}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
