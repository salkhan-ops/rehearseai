// Deterministic, rule-based "AI Growth Advisor". No LLM/backend call — a set of
// threshold checks over the already-fetched dashboard data, written out as narrative
// text so it reads like a SaaS growth advisor's notes rather than raw analytics.
// Swapping this for a real LLM later just means replacing the body of
// generateRecommendations() with an API call that receives the same input shape.

import type { AdvisorRecommendation, FunnelStep, GrowthAlert, GrowthDashboardData } from "./types";

export type AdvisorInput = Omit<GrowthDashboardData, "alerts" | "recommendations">;

// Tune these as real benchmarks emerge — they're intentionally conservative
// SaaS-industry-typical targets, not measured from this product yet.
export const TARGETS = {
  ctrPct: 1.2,
  cpcUsd: 1.5,
  landingToSignupPct: 12,
  interviewCompletionPct: 55,
  minSampleForAlerts: 20,
};

function pct(n: number) {
  return `${n.toFixed(1)}%`;
}

function usd(n: number) {
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

// Meta Ads values are in the connected ad account's own currency (not necessarily USD),
// so format those with the account's actual currency rather than the hardcoded $ formatter.
function moneyFor(currency: string) {
  return (n: number) => {
    try {
      return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }).format(n);
    } catch {
      return `${currency} ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    }
  };
}

function trendDelta(points: { value: number }[]): number | null {
  if (points.length < 14) return null;
  const half = Math.floor(points.length / 2);
  const first = points.slice(0, half).reduce((s, p) => s + p.value, 0) / half;
  const second = points.slice(half).reduce((s, p) => s + p.value, 0) / (points.length - half);
  if (first === 0) return null;
  return ((second - first) / first) * 100;
}

function findStep(funnel: FunnelStep[], key: FunnelStep["key"]): FunnelStep | undefined {
  return funnel.find((s) => s.key === key);
}

export function generateAlerts(data: AdvisorInput): GrowthAlert[] {
  const alerts: GrowthAlert[] = [];
  const { metaAds, funnel, kpis, revenue } = data;

  if (metaAds.totals.ctr < TARGETS.ctrPct) {
    alerts.push({
      id: "ctr-below-target",
      severity: metaAds.totals.ctr < TARGETS.ctrPct * 0.7 ? "critical" : "warning",
      title: "CTR is below target",
      detail: `Blended CTR is ${pct(metaAds.totals.ctr)}, below the ${pct(TARGETS.ctrPct)} target. Creative fatigue or weak hook is the usual cause.`,
    });
  }

  // TARGETS.cpcUsd is a fixed USD benchmark, so this comparison only makes sense when the
  // connected ad account is itself billed in USD — otherwise the units don't match.
  if (metaAds.currency === "USD" && metaAds.totals.cpc > TARGETS.cpcUsd) {
    alerts.push({
      id: "cpc-above-target",
      severity: metaAds.totals.cpc > TARGETS.cpcUsd * 1.5 ? "critical" : "warning",
      title: "CPC has risen",
      detail: `Blended CPC is ${usd(metaAds.totals.cpc)}, above the ${usd(TARGETS.cpcUsd)} target. Check for audience saturation or increased competition.`,
    });
  }

  const landingViews = findStep(funnel, "landingPageViews");
  const signups = findStep(funnel, "signups");
  if (landingViews && signups && landingViews.count > TARGETS.minSampleForAlerts) {
    const rate = (signups.count / landingViews.count) * 100;
    if (rate < TARGETS.landingToSignupPct) {
      alerts.push({
        id: "signup-conversion-low",
        severity: rate < TARGETS.landingToSignupPct * 0.5 ? "critical" : "warning",
        title: "Signup conversion has fallen",
        detail: `Only ${pct(rate)} of landing page visitors sign up, below the ${pct(TARGETS.landingToSignupPct)} target.`,
      });
    }
  }

  if (kpis.completionRate > 0 && kpis.completionRate < TARGETS.interviewCompletionPct) {
    alerts.push({
      id: "interview-completion-drop",
      severity: kpis.completionRate < TARGETS.interviewCompletionPct * 0.7 ? "critical" : "warning",
      title: "Interview completion rate has dropped",
      detail: `${pct(kpis.completionRate)} of started interviews finish, below the ${pct(TARGETS.interviewCompletionPct)} target.`,
    });
  }

  const revenueDelta = trendDelta(revenue.revenueTrend);
  if (revenueDelta !== null && revenueDelta < -10) {
    alerts.push({
      id: "revenue-decreasing",
      severity: revenueDelta < -25 ? "critical" : "warning",
      title: "Revenue is trending down",
      detail: `Revenue over the second half of the last 30 days is ${pct(Math.abs(revenueDelta))} lower than the first half.`,
    });
  }

  const mrrDelta = trendDelta(revenue.mrrTrend);
  if (mrrDelta !== null && mrrDelta < -10) {
    alerts.push({
      id: "mrr-declining",
      severity: mrrDelta < -25 ? "critical" : "warning",
      title: "MRR-driving revenue is declining",
      detail: `New subscription revenue has fallen ${pct(Math.abs(mrrDelta))} over the last 30 days. ${revenue.churn} cancellation${revenue.churn === 1 ? "" : "s"} logged this month vs. ${revenue.conversions} new conversions.`,
    });
  }

  return alerts;
}

export function generateRecommendations(data: AdvisorInput): AdvisorRecommendation[] {
  const recs: AdvisorRecommendation[] = [];
  const { metaAds, funnel, usage, revenue, kpis } = data;
  const adsMoney = moneyFor(metaAds.currency);

  // Ads: winner / loser
  recs.push({
    id: "ads-winner",
    theme: "ads",
    headline: `"${metaAds.topCampaign.name}" is your best performer`,
    body: `It's returning ${metaAds.topCampaign.roas.toFixed(1)}x ROAS at ${adsMoney(metaAds.topCampaign.cpc)} CPC. Shift 15-20% of budget from weaker campaigns into this one before testing new creative — you're leaving efficient spend on the table.`,
  });
  if (metaAds.worstAd.roas < 1) {
    recs.push({
      id: "ads-pause",
      theme: "ads",
      headline: `Consider pausing "${metaAds.worstAd.name}"`,
      body: `It's returning ${metaAds.worstAd.roas.toFixed(1)}x ROAS at ${adsMoney(metaAds.worstAd.costPerPurchase)} cost per purchase — below breakeven. Two weeks of underperformance is enough signal; redirect that spend to "${metaAds.topAd.name}" (${metaAds.topAd.roas.toFixed(1)}x ROAS).`,
    });
  }

  // Landing page / funnel quality
  const landingViews = findStep(funnel, "landingPageViews");
  const linkClicks = findStep(funnel, "linkClicks");
  if (landingViews && linkClicks) {
    const lpRate = linkClicks.count ? (landingViews.count / linkClicks.count) * 100 : 0;
    recs.push({
      id: "landing-page-quality",
      theme: "funnel",
      headline: lpRate > 75 ? "Landing page load/relevance looks healthy" : "Landing page is losing clicked traffic",
      body: lpRate > 75
        ? `${pct(lpRate)} of ad clicks are resulting in a tracked landing page view — that's a healthy rate, so the click-to-page experience isn't the bottleneck right now.`
        : `Only ${pct(lpRate)} of ad clicks result in a tracked landing page view. Check page load time on mobile and that ad creative promises match the landing page headline exactly.`,
    });
  }

  // Signup bottleneck
  const bottleneck = funnel.find((s) => s.isBottleneck);
  if (bottleneck) {
    recs.push({
      id: "funnel-bottleneck",
      theme: "funnel",
      headline: `Biggest drop-off is at "${bottleneck.label}"`,
      body: `${pct(bottleneck.dropOffFromPrevious ?? 0)} of visitors are lost at this step. ${
        bottleneck.key === "signups"
          ? "Consider reducing signup friction — fewer form fields, social sign-in front and center, or a clearer 'free, no card' promise."
          : bottleneck.key === "interviewStarted"
          ? "New signups aren't starting their first interview. Consider a guided first-session prompt immediately after signup instead of dropping them on a generic dashboard."
          : bottleneck.key === "interviewCompleted"
          ? "Users start but don't finish. Check session length and whether the AI's difficulty ramps too fast for first-timers."
          : "Investigate this step specifically — it's the largest percentage loss in the funnel."
      }`,
    });
  }

  // Onboarding / activation
  if (usage.usersReturningWithin7DaysPct < 30 && usage.avgInterviewsPerUser > 0) {
    recs.push({
      id: "onboarding-return-rate",
      theme: "onboarding",
      headline: "Return-within-7-days rate is soft",
      body: `Only ${pct(usage.usersReturningWithin7DaysPct)} of users come back within a week of their first session (avg. ${usage.avgInterviewsPerUser.toFixed(1)} interviews/user overall). A day-2 email nudge or an in-app streak mechanic tends to move this more than acquisition spend will.`,
    });
  }

  // Interview completion bottleneck (product-level, distinct from funnel step above)
  if (kpis.completionRate > 0 && kpis.completionRate < TARGETS.interviewCompletionPct) {
    recs.push({
      id: "completion-bottleneck",
      theme: "product",
      headline: "Interview completion rate needs attention",
      body: `${pct(kpis.completionRate)} of started interviews finish. Most popular scenario is "${usage.mostPopularScenario}" — review whether its default duration or pressure level is a mismatch for first-time users.`,
    });
  }

  // Revenue trend
  const revenueDelta = trendDelta(revenue.revenueTrend);
  recs.push({
    id: "revenue-trend",
    theme: "revenue",
    headline: revenueDelta !== null && revenueDelta > 5 ? "Revenue is trending up" : revenueDelta !== null && revenueDelta < -5 ? "Revenue growth has stalled" : "Revenue is roughly flat",
    body: revenueDelta !== null
      ? `Revenue moved ${revenueDelta > 0 ? "+" : ""}${pct(revenueDelta)} between the first and second half of the last 30 days. MRR is ${usd(revenue.mrr)} across ${revenue.subscriptions} subscribers, with ${revenue.churn} churn event${revenue.churn === 1 ? "" : "s"} this month.`
      : `Not enough transaction history yet for a reliable trend read. MRR is currently ${usd(revenue.mrr)} across ${revenue.subscriptions} subscribers.`,
  });

  // Budget suggestion
  if (metaAds.totals.roas > 2) {
    recs.push({
      id: "budget-increase",
      theme: "ads",
      headline: "Blended ROAS supports a budget increase",
      body: `At ${metaAds.totals.roas.toFixed(1)}x blended ROAS and ${adsMoney(metaAds.totals.costPerPurchase)} cost per purchase, there's room to increase daily budget 20-30% on "${metaAds.topCampaign.name}" before efficiency likely degrades.`,
    });
  } else if (metaAds.totals.roas < 1) {
    recs.push({
      id: "budget-decrease",
      theme: "ads",
      headline: "Blended ROAS suggests trimming spend",
      body: `Blended ROAS is ${metaAds.totals.roas.toFixed(1)}x — below breakeven. Reduce daily budget on underperforming ad sets until creative or targeting improves.`,
    });
  }

  // A/B test + landing page improvement suggestions
  recs.push({
    id: "ab-test-suggestion",
    theme: "funnel",
    headline: "Suggested next A/B test",
    body: `Test the "${metaAds.topAd.name}" hook (your best CTR/ROAS ad) as the hero headline on the interview landing page — creative that wins on Meta usually wins on-page too, and it's a low-cost test to run this week.`,
  });

  return recs;
}
