"use client";

import { useEffect, useState } from "react";
import { Download, RefreshCw, TrendingUp } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdvisorPanel } from "@/components/admin/growth/AdvisorPanel";
import { AlertsPanel } from "@/components/admin/growth/AlertsPanel";
import { ChartsPanel } from "@/components/admin/growth/ChartsPanel";
import { FunnelPanel } from "@/components/admin/growth/FunnelPanel";
import { GoogleAnalyticsPanel } from "@/components/admin/growth/GoogleAnalyticsPanel";
import { GROWTH_TABS, GrowthTabs, type GrowthTabKey } from "@/components/admin/growth/GrowthTabs";
import { KpiGrid } from "@/components/admin/growth/KpiGrid";
import { MetaAdsPanel } from "@/components/admin/growth/MetaAdsPanel";
import { PixelEventsPanel } from "@/components/admin/growth/PixelEventsPanel";
import { RevenuePanel } from "@/components/admin/growth/RevenuePanel";
import { UsagePanel } from "@/components/admin/growth/UsagePanel";
import { generateAlerts, generateRecommendations } from "@/lib/growth/advisor";
import { buildFunnel } from "@/lib/growth/funnel";
import { FirestoreAnalyticsService } from "@/lib/growth/services/firestoreAnalyticsService";
import { GoogleAnalyticsService } from "@/lib/growth/services/googleAnalyticsService";
import { MetaAdsService } from "@/lib/growth/services/metaAdsService";
import { PaddleAnalyticsService } from "@/lib/growth/services/paddleAnalyticsService";
import { PixelAnalyticsService } from "@/lib/growth/services/pixelAnalyticsService";
import type { GrowthDashboardData } from "@/lib/growth/types";

function sum(points: { value: number }[]) {
  return Math.round(points.reduce((s, p) => s + p.value, 0));
}

function downloadReport(data: GrowthDashboardData) {
  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      visitorsThisMonth: data.kpis.visitorsThisMonth,
      isVisitorsMock: data.kpis.isVisitorsMock,
      signupsThisMonth: data.kpis.signupsThisMonth,
      interviewsStarted: data.kpis.interviewsStarted,
      interviewsCompleted: data.kpis.interviewsCompleted,
      completionRatePct: data.kpis.completionRate,
      activeUsers7d: data.kpis.activeUsers7d,
      activeUsers30d: data.kpis.activeUsers30d,
      mrr: data.revenue.mrr,
      paidSubscribers: data.kpis.paidSubscribers,
      metaAdSpend30d: data.metaAds.totals.spend,
      metaAdCurrency: data.metaAds.currency,
      metaAdIsMock: data.metaAds.isMock,
      metaCtrPct: data.metaAds.totals.ctr,
      ga4Users30d: data.ga.users,
      ga4Sessions30d: data.ga.sessions,
      ga4BounceRatePct: data.ga.bounceRate,
      ga4IsMock: data.ga.isMock,
      alertCount: data.alerts.length,
    },
    kpis: data.kpis,
    funnel: data.funnel,
    metaAds: data.metaAds,
    googleAnalytics: data.ga,
    pixelEvents: data.pixel,
    usage: data.usage,
    revenue: data.revenue,
    alerts: data.alerts,
    recommendations: data.recommendations,
  };
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `growth-report-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function loadGrowthDashboard(): Promise<{ data: GrowthDashboardData; hasAnyData: boolean }> {
  const firestoreService = new FirestoreAnalyticsService();
  const paddleService = new PaddleAnalyticsService();
  const metaAdsService = new MetaAdsService();
  const gaService = new GoogleAnalyticsService();
  const pixelService = new PixelAnalyticsService();

  const [users, sessions, revenue, metaAds, ga, visitorsTrend, pixel] = await Promise.all([
    firestoreService.loadUsers(),
    firestoreService.loadSessions(),
    paddleService.getSnapshot(),
    metaAdsService.getSnapshot(),
    gaService.getSnapshot(),
    gaService.getUsersTrend(),
    pixelService.getEventCounts(),
  ]);

  const signupCounts = firestoreService.getSignupCounts(users);
  const activeUsers = firestoreService.getActiveUsers(sessions);
  const interviewCounts = firestoreService.getInterviewFunnelCounts(sessions);
  const usage = await firestoreService.getUsageStats(sessions);
  // GA4 (once connected) actually captures device/country, unlike the session docs — prefer
  // its real breakdown over the Firestore-derived placeholder.
  if (!ga.isMock) {
    const topDevice = ga.devices[0]?.device;
    const topCountry = ga.countries[0]?.country;
    usage.mostUsedDevice = topDevice ? topDevice.charAt(0).toUpperCase() + topDevice.slice(1) : usage.mostUsedDevice;
    usage.mostCommonCountry = topCountry || usage.mostCommonCountry;
    usage.isDeviceCountryMock = false;
  }

  const signupsLast30d = sum(signupCounts.signupsTrend);
  const funnel = buildFunnel({ metaAds, sessions, signupsLast30d, subscriptionPurchasesLast30d: revenue.conversions });

  const kpis: GrowthDashboardData["kpis"] = {
    visitorsToday: Math.round(visitorsTrend[visitorsTrend.length - 1]?.value || 0),
    visitorsThisWeek: sum(visitorsTrend.slice(-7)),
    visitorsThisMonth: sum(visitorsTrend),
    isVisitorsMock: ga.isMock,
    signupsToday: signupCounts.signupsToday,
    signupsThisWeek: signupCounts.signupsThisWeek,
    signupsThisMonth: signupCounts.signupsThisMonth,
    interviewsStarted: interviewCounts.interviewsStarted,
    interviewsCompleted: interviewCounts.interviewsCompleted,
    completionRate: interviewCounts.completionRate,
    paidSubscribers: revenue.paidSubscribers,
    mrr: revenue.mrr,
    revenueToday: revenue.revenueToday,
    revenueThisMonth: revenue.revenueThisMonth,
    activeUsers7d: activeUsers.activeUsers7d,
    activeUsers30d: activeUsers.activeUsers30d,
    visitorsTrend,
    signupsTrend: signupCounts.signupsTrend,
    revenueTrend: revenue.revenueTrend,
    interviewStartsTrend: interviewCounts.interviewStartsTrend,
    interviewCompletionsTrend: interviewCounts.interviewCompletionsTrend,
  };

  const base = { kpis, funnel, metaAds, ga, pixel, usage, revenue };
  const alerts = generateAlerts(base);
  const recommendations = generateRecommendations(base);

  return {
    data: { ...base, alerts, recommendations },
    hasAnyData: users.length > 0 || sessions.length > 0,
  };
}

export default function GrowthDashboardPage() {
  const [data, setData] = useState<GrowthDashboardData | null>(null);
  const [hasAnyData, setHasAnyData] = useState(true);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<GrowthTabKey>("executive");

  async function load() {
    setLoading(true);
    try {
      const result = await loadGrowthDashboard();
      setData(result.data);
      setHasAnyData(result.hasAnyData);
    } catch {
      // Services already fall back to empty/mock data internally on failure —
      // nothing to surface here beyond stopping the loading state.
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const liveSources = ["Firestore", "Paddle", ...(data && !data.metaAds.isMock ? ["Meta Ads"] : []), ...(data && !data.ga.isMock ? ["Google Analytics"] : [])];
  const previewSources = [...(!data || data.metaAds.isMock ? ["Meta Ads"] : []), ...(!data || data.ga.isMock ? ["Google Analytics"] : []), "Pixel Events"];

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-[-0.04em]">
            <TrendingUp size={26} className="text-[#6200a8]" /> Growth Dashboard
          </h1>
          <p className="mt-1 font-medium text-slate-500">Acquisition, funnel, revenue, and usage in one place — real Firestore/Paddle data where it exists, clearly-marked previews elsewhere.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => data && downloadReport(data)}
            disabled={!data}
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50"
          >
            <Download size={14} /> Download report
          </button>
          <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {!loading && data && !hasAnyData && (
        <div className="mb-5 rounded-2xl bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-700 ring-1 ring-blue-100">
          No user or session data yet — real-data sections will populate automatically as visitors sign up and practice.
        </div>
      )}

      <div className="mb-5">
        <GrowthTabs active={tab} onChange={setTab} alertCount={data?.alerts.length || 0} />
      </div>

      {loading || !data ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-[1.25rem] bg-slate-100" />
          ))}
        </div>
      ) : (
        <>
          {tab === "executive" && <KpiGrid kpis={data.kpis} />}
          {tab === "funnel" && <FunnelPanel funnel={data.funnel} />}
          {tab === "metaAds" && <MetaAdsPanel metaAds={data.metaAds} />}
          {tab === "googleAnalytics" && <GoogleAnalyticsPanel ga={data.ga} />}
          {tab === "pixel" && <PixelEventsPanel pixel={data.pixel} />}
          {tab === "usage" && <UsagePanel usage={data.usage} />}
          {tab === "revenue" && <RevenuePanel revenue={data.revenue} />}
          {tab === "advisor" && <AdvisorPanel recommendations={data.recommendations} />}
          {tab === "alerts" && <AlertsPanel alerts={data.alerts} />}
          {tab === "charts" && <ChartsPanel data={data} />}
        </>
      )}

      <p className="mt-8 text-center text-xs font-medium text-slate-400">
        {GROWTH_TABS.length} sections · {liveSources.join(", ")} data is live
        {previewSources.length > 0 && ` · ${previewSources.join(", ")} preview data pending API connection.`}
      </p>
    </AdminLayout>
  );
}
