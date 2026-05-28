"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartShell } from "./ChartShell";

export function PressureTimelineChart({ data }: { data: Array<Record<string, string | number>> }) {
  return (
    <ChartShell title="Pressure Timeline" insight="Stress spikes, control points, and composure changes">
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.16)" />
            <XAxis dataKey="turn" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Line type="monotone" dataKey="pressure" stroke="#e11d48" strokeWidth={3} dot={false} />
            <Line type="monotone" dataKey="confidence" stroke="#6200a8" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="composure" stroke="#0f766e" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartShell>
  );
}
