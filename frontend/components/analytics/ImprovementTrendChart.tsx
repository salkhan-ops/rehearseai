"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartShell } from "./ChartShell";

export function ImprovementTrendChart({ data }: { data: Array<Record<string, string | number>> }) {
  return (
    <ChartShell title="Improvement Trend" insight="Growth trajectory across recent sessions">
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.16)" />
            <XAxis dataKey="session" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Line type="monotone" dataKey="overall" stroke="#6200a8" strokeWidth={3} />
            <Line type="monotone" dataKey="reasoning" stroke="#5577ff" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartShell>
  );
}
