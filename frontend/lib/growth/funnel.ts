import { daysAgo, parseIso } from "./dateUtils";
import type { SessionDoc } from "./services/firestoreAnalyticsService";
import type { FunnelStep, MetaAdsSnapshot } from "./types";

export function buildFunnel(params: {
  metaAds: MetaAdsSnapshot;
  sessions: SessionDoc[];
  signupsLast30d: number;
  subscriptionPurchasesLast30d: number;
}): FunnelStep[] {
  const { metaAds, sessions, signupsLast30d, subscriptionPurchasesLast30d } = params;
  const since = daysAgo(30);

  // The paid campaign is Job Interview-specific, so the mid/bottom funnel tracks
  // Job Interview sessions specifically rather than all 11 practice types.
  const interviewSessions = sessions.filter((s) => {
    if (s.practiceType !== "Job Interview") return false;
    const d = parseIso(s.createdAt);
    return !!d && d >= since;
  });
  const interviewStarted = interviewSessions.length;
  const interviewCompleted = interviewSessions.filter((s) => s.status === "completed").length;

  const raw: { key: FunnelStep["key"]; label: string; count: number; isMock: boolean }[] = [
    { key: "adImpressions", label: "Ad Impressions", count: Math.round(metaAds.totals.impressions), isMock: true },
    { key: "linkClicks", label: "Link Clicks", count: Math.round(metaAds.totals.clicks), isMock: true },
    { key: "landingPageViews", label: "Landing Page Views", count: Math.round(metaAds.totals.landingPageViews), isMock: true },
    { key: "signups", label: "Signups", count: signupsLast30d, isMock: false },
    { key: "interviewStarted", label: "Interview Started", count: interviewStarted, isMock: false },
    { key: "interviewCompleted", label: "Interview Completed", count: interviewCompleted, isMock: false },
    { key: "subscriptionPurchased", label: "Subscription Purchased", count: subscriptionPurchasesLast30d, isMock: false },
  ];

  const start = raw[0].count || 1;
  let maxDropoff = -Infinity;
  let bottleneckIndex = -1;
  const steps: FunnelStep[] = raw.map((step, i) => {
    const prev = i > 0 ? raw[i - 1].count : null;
    const conversionFromPrevious = prev ? Math.round((step.count / prev) * 1000) / 10 : null;
    const dropOffFromPrevious = prev !== null ? Math.round((1 - step.count / (prev || 1)) * 1000) / 10 : null;
    if (dropOffFromPrevious !== null && dropOffFromPrevious > maxDropoff) {
      maxDropoff = dropOffFromPrevious;
      bottleneckIndex = i;
    }
    return {
      key: step.key,
      label: step.label,
      count: step.count,
      conversionFromPrevious,
      conversionFromStart: Math.round((step.count / start) * 1000) / 10,
      dropOffFromPrevious,
      isBottleneck: false,
      isMock: step.isMock,
    };
  });
  if (bottleneckIndex >= 0) steps[bottleneckIndex] = { ...steps[bottleneckIndex], isBottleneck: true };
  return steps;
}
