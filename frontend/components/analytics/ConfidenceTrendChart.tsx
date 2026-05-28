"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartShell } from "./ChartShell";

export function ConfidenceTrendChart({ data }: { data: Array<Record<string, string | number>> }) {
  return (
    <ChartShell title="Confidence Fluctuation" insight="How confidence moved as pressure changed">
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.16)" />
            <XAxis dataKey="turn" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Area type="monotone" dataKey="confidence" stroke="#6200a8" fill="#6200a8" fillOpacity={0.18} />
            <Area type="monotone" dataKey="recovery" stroke="#5577ff" fill="#5577ff" fillOpacity={0.12} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartShell>
  );
}
