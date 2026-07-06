"use client";

import type { GrowthDashboardData } from "@/lib/growth/types";
import { TrendChart } from "./TrendChart";

function usd(n: number) {
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function ChartsPanel({ data }: { data: GrowthDashboardData }) {
  const { kpis, metaAds, revenue } = data;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <TrendChart title="Visitors" data={kpis.visitorsTrend} isMock />
      <TrendChart title="Signups" data={kpis.signupsTrend} color="#0ea5e9" />
      <TrendChart title="Revenue" data={kpis.revenueTrend} formatValue={usd} color="#16a34a" />
      <TrendChart title="Interview starts" data={kpis.interviewStartsTrend} color="#6200a8" />
      <TrendChart title="Interview completions" data={kpis.interviewCompletionsTrend} color="#8b5cf6" />
      <TrendChart title="Conversions" data={revenue.conversionsTrend} formatValue={(n) => n.toString()} color="#f59e0b" />
      <TrendChart title="MRR" data={revenue.mrrTrend} formatValue={usd} color="#16a34a" />
      <TrendChart title="Ad spend" data={metaAds.spendTrend} formatValue={usd} isMock />
      <TrendChart title="CTR" data={metaAds.ctrTrend} formatValue={(n) => `${n.toFixed(2)}%`} isMock />
      <TrendChart title="CPC" data={metaAds.cpcTrend} formatValue={usd} isMock />
    </div>
  );
}
