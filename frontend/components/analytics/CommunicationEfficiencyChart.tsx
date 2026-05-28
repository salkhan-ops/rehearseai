"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartShell } from "./ChartShell";

export function CommunicationEfficiencyChart({ data }: { data: Array<Record<string, string | number>> }) {
  return (
    <ChartShell title="Communication Efficiency" insight="Brevity, directness, and answer completion">
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.16)" />
            <XAxis dataKey="turn" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Bar dataKey="brevity" fill="#6200a8" radius={[8, 8, 0, 0]} />
            <Bar dataKey="directness" fill="#5577ff" radius={[8, 8, 0, 0]} />
            <Bar dataKey="completion" fill="#0f766e" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartShell>
  );
}
