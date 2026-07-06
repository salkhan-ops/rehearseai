"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TrendPoint } from "@/lib/growth/types";

export function TrendChart({
  title,
  data,
  color = "#6200a8",
  formatValue,
  isMock,
}: {
  title: string;
  data: TrendPoint[];
  color?: string;
  formatValue?: (n: number) => string;
  isMock?: boolean;
}) {
  const current = data.length ? data[data.length - 1].value : 0;
  const previous = data.length > 1 ? data[data.length - 2].value : current;
  const delta = previous ? ((current - previous) / previous) * 100 : 0;
  const fmt = formatValue || ((n: number) => n.toLocaleString());

  return (
    <div className="rounded-[1.25rem] bg-white p-4 shadow-[0_14px_38px_rgba(35,45,75,0.045)] ring-1 ring-slate-200/75">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-500">{title}</span>
            {isMock && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-amber-600 ring-1 ring-amber-100">Preview</span>}
          </div>
          <div className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-slate-900">{fmt(current)}</div>
        </div>
        {data.length > 1 && (
          <span className={`rounded-full px-2 py-1 text-xs font-bold ${delta >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
            {delta >= 0 ? "+" : ""}
            {delta.toFixed(1)}%
          </span>
        )}
      </div>
      <div className="mt-3 h-28">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.12)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} minTickGap={24} />
            <YAxis hide domain={["auto", "auto"]} />
            <Tooltip formatter={(value) => fmt(Number(value))} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
            <Area type="monotone" dataKey="value" stroke={color} fill={color} fillOpacity={0.14} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
