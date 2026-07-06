"use client";

import { Award, ThumbsDown, ThumbsUp } from "lucide-react";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import type { MetaAdsSnapshot, MetaCreativeMetrics } from "@/lib/growth/types";
import { PreviewBadge } from "./PreviewBadge";
import { TrendChart } from "./TrendChart";

function usd(n: number) {
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

const METRIC_COLUMNS: { key: keyof MetaCreativeMetrics; label: string; format: (n: number) => string }[] = [
  { key: "spend", label: "Spend", format: usd },
  { key: "impressions", label: "Impressions", format: (n) => n.toLocaleString() },
  { key: "reach", label: "Reach", format: (n) => n.toLocaleString() },
  { key: "ctr", label: "CTR", format: (n) => `${n.toFixed(2)}%` },
  { key: "cpc", label: "CPC", format: usd },
  { key: "cpm", label: "CPM", format: usd },
  { key: "landingPageViews", label: "LPV", format: (n) => n.toLocaleString() },
  { key: "costPerLandingPageView", label: "Cost/LPV", format: usd },
  { key: "purchases", label: "Purchases", format: (n) => n.toLocaleString() },
  { key: "costPerPurchase", label: "Cost/Purchase", format: usd },
  { key: "roas", label: "ROAS", format: (n) => `${n.toFixed(2)}x` },
];

function MetricsTable({ title, rows }: { title: string; rows: ({ id: string; name: string } & MetaCreativeMetrics)[] }) {
  return (
    <div className="overflow-hidden rounded-[1.25rem] bg-white shadow-[0_14px_38px_rgba(35,45,75,0.045)] ring-1 ring-slate-200/75">
      <div className="border-b border-slate-100 px-5 py-4">
        <h3 className="text-sm font-bold uppercase tracking-[0.1em] text-slate-500">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-[1.6fr_repeat(11,minmax(80px,1fr))] gap-2 px-5 py-3 text-xs font-bold uppercase tracking-[0.08em] text-slate-400">
            <span>Name</span>
            {METRIC_COLUMNS.map((c) => (
              <span key={c.key}>{c.label}</span>
            ))}
          </div>
          <div className="divide-y divide-slate-100">
            {rows.map((row) => (
              <div key={row.id} className="grid grid-cols-[1.6fr_repeat(11,minmax(80px,1fr))] gap-2 px-5 py-3 text-sm hover:bg-slate-50/60">
                <span className="truncate font-semibold text-slate-800">{row.name}</span>
                {METRIC_COLUMNS.map((c) => (
                  <span key={c.key} className="text-slate-600">{c.format(row[c.key])}</span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MetaAdsPanel({ metaAds }: { metaAds: MetaAdsSnapshot }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">Built to plug straight into the Meta Marketing API — every number below is illustrative until it's connected.</p>
        <PreviewBadge />
      </div>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <AdminStatCard icon={Award} label="Spend" value={usd(metaAds.totals.spend)} />
        <AdminStatCard icon={Award} label="CTR" value={`${metaAds.totals.ctr.toFixed(2)}%`} />
        <AdminStatCard icon={Award} label="CPC" value={usd(metaAds.totals.cpc)} />
        <AdminStatCard icon={Award} label="CPM" value={usd(metaAds.totals.cpm)} />
        <AdminStatCard icon={Award} label="Reach" value={metaAds.totals.reach.toLocaleString()} />
        <AdminStatCard icon={Award} label="Impressions" value={metaAds.totals.impressions.toLocaleString()} />
        <AdminStatCard icon={Award} label="Cost / Landing Page View" value={usd(metaAds.totals.costPerLandingPageView)} />
        <AdminStatCard icon={Award} label="Cost / Purchase" value={usd(metaAds.totals.costPerPurchase)} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <TrendChart title="Ad spend (30d)" data={metaAds.spendTrend} formatValue={usd} isMock />
        <TrendChart title="CTR (30d)" data={metaAds.ctrTrend} formatValue={(n) => `${n.toFixed(2)}%`} color="#0ea5e9" isMock />
        <TrendChart title="CPC (30d)" data={metaAds.cpcTrend} formatValue={usd} color="#f59e0b" isMock />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[1.25rem] bg-emerald-50 p-5 ring-1 ring-emerald-100">
          <div className="flex items-center gap-2 text-emerald-700"><Award size={16} /><span className="text-xs font-bold uppercase tracking-[0.08em]">Top campaign</span></div>
          <div className="mt-2 font-semibold text-slate-900">{metaAds.topCampaign.name}</div>
          <div className="mt-1 text-sm font-medium text-slate-600">{metaAds.topCampaign.roas.toFixed(2)}x ROAS · {usd(metaAds.topCampaign.spend)} spend</div>
        </div>
        <div className="rounded-[1.25rem] bg-emerald-50 p-5 ring-1 ring-emerald-100">
          <div className="flex items-center gap-2 text-emerald-700"><ThumbsUp size={16} /><span className="text-xs font-bold uppercase tracking-[0.08em]">Top ad</span></div>
          <div className="mt-2 font-semibold text-slate-900">{metaAds.topAd.name}</div>
          <div className="mt-1 text-sm font-medium text-slate-600">{metaAds.topAd.roas.toFixed(2)}x ROAS · {usd(metaAds.topAd.costPerPurchase)}/purchase</div>
        </div>
        <div className="rounded-[1.25rem] bg-rose-50 p-5 ring-1 ring-rose-100">
          <div className="flex items-center gap-2 text-rose-700"><ThumbsDown size={16} /><span className="text-xs font-bold uppercase tracking-[0.08em]">Worst ad</span></div>
          <div className="mt-2 font-semibold text-slate-900">{metaAds.worstAd.name}</div>
          <div className="mt-1 text-sm font-medium text-slate-600">{metaAds.worstAd.roas.toFixed(2)}x ROAS · {usd(metaAds.worstAd.costPerPurchase)}/purchase</div>
        </div>
      </div>

      <MetricsTable title="Campaigns" rows={metaAds.campaigns} />
      <MetricsTable title="Ad sets" rows={metaAds.adSets} />
      <MetricsTable title="Ads" rows={metaAds.ads} />
    </div>
  );
}
