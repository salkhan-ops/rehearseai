"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartShell } from "./ChartShell";

export function BenchmarkComparisonChart({ metrics }: { metrics: Record<string, string | number | boolean | string[]> }) {
  const data = [
    { metric: "Clarity", percentile: Number(metrics.clarityPercentile || 0) },
    { metric: "Reasoning", percentile: Number(metrics.reasoningPercentile || 0) },
    { metric: "Pressure", percentile: Number(metrics.pressureHandlingPercentile || 0) },
  ];

  return (
    <ChartShell title="Anonymized Benchmark" insight="Your scores compared with aggregate performance patterns">
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.16)" />
            <XAxis dataKey="metric" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Bar dataKey="percentile" fill="#6200a8" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-4 space-y-2 text-sm font-medium text-slate-600 dark:text-white/60">
        {Array.isArray(metrics.benchmarkNotes) && metrics.benchmarkNotes.map((note) => <li key={String(note)}>• {note}</li>)}
      </ul>
    </ChartShell>
  );
}
