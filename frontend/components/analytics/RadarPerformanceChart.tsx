"use client";

import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartShell } from "./ChartShell";

export function RadarPerformanceChart({ data }: { data: Array<Record<string, string | number>> }) {
  return (
    <ChartShell title="Performance Radar" insight="User vs benchmark vs previous session">
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="rgba(100,116,139,0.22)" />
            <PolarAngleAxis dataKey="metric" tick={{ fill: "#64748b", fontSize: 12 }} />
            <Tooltip />
            <Radar name="User" dataKey="user" stroke="#6200a8" fill="#6200a8" fillOpacity={0.24} />
            <Radar name="Target" dataKey="target" stroke="#5577ff" fill="#5577ff" fillOpacity={0.12} />
            <Radar name="Previous" dataKey="previous" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.08} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </ChartShell>
  );
}
