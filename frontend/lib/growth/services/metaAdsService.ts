"use client";

// TODO: swap for the Meta Marketing API (https://developers.facebook.com/docs/marketing-apis).
// Every method here returns data shaped exactly like the real API's Insights response
// (spend, impressions, reach, clicks, actions) so wiring the real client later is a
// drop-in replacement — the panel components only depend on the types in ../types.

import { buildWave } from "../mockWave";
import type { MetaAd, MetaAdSet, MetaAdsSnapshot, MetaCampaign, MetaCreativeMetrics } from "../types";

const AVG_ORDER_VALUE = 39;

function deriveMetrics(raw: { spend: number; impressions: number; reach: number; clicks: number; landingPageViews: number; purchases: number }): MetaCreativeMetrics {
  const { spend, impressions, reach, clicks, landingPageViews, purchases } = raw;
  const revenue = purchases * AVG_ORDER_VALUE;
  return {
    spend,
    impressions,
    reach,
    clicks,
    ctr: impressions ? Math.round((clicks / impressions) * 10000) / 100 : 0,
    cpc: clicks ? Math.round((spend / clicks) * 100) / 100 : 0,
    cpm: impressions ? Math.round((spend / impressions) * 1000 * 100) / 100 : 0,
    landingPageViews,
    costPerLandingPageView: landingPageViews ? Math.round((spend / landingPageViews) * 100) / 100 : 0,
    purchases,
    costPerPurchase: purchases ? Math.round((spend / purchases) * 100) / 100 : 0,
    roas: spend ? Math.round((revenue / spend) * 100) / 100 : 0,
  };
}

function sumMetrics(items: MetaCreativeMetrics[]): MetaCreativeMetrics {
  const totals = items.reduce(
    (acc, m) => ({
      spend: acc.spend + m.spend,
      impressions: acc.impressions + m.impressions,
      reach: acc.reach + m.reach,
      clicks: acc.clicks + m.clicks,
      landingPageViews: acc.landingPageViews + m.landingPageViews,
      purchases: acc.purchases + m.purchases,
    }),
    { spend: 0, impressions: 0, reach: 0, clicks: 0, landingPageViews: 0, purchases: 0 }
  );
  return deriveMetrics(totals);
}

const AD_SEED: Array<{ name: string; campaign: string; adSet: string; impressions: number; clicks: number; landingPageViews: number; purchases: number; cpm: number }> = [
  { name: "Hiring manager hook — video", campaign: "Job Interview — Prospecting", adSet: "Broad 25-45", impressions: 182000, clicks: 4550, landingPageViews: 3640, purchases: 61, cpm: 9.2 },
  { name: "\"AI that interviews you back\" — static", campaign: "Job Interview — Prospecting", adSet: "Broad 25-45", impressions: 149000, clicks: 2980, landingPageViews: 2235, purchases: 28, cpm: 8.7 },
  { name: "Interview anxiety pain-point — video", campaign: "Job Interview — Prospecting", adSet: "Interests: Job Search", impressions: 121000, clicks: 3630, landingPageViews: 2904, purchases: 47, cpm: 10.1 },
  { name: "Score breakdown carousel", campaign: "Job Interview — Prospecting", adSet: "Interests: Job Search", impressions: 98000, clicks: 1470, landingPageViews: 1029, purchases: 11, cpm: 11.4 },
  { name: "Retarget: finish your free session", campaign: "Job Interview — Retargeting", adSet: "Site visitors 14d", impressions: 41000, clicks: 2460, landingPageViews: 2214, purchases: 89, cpm: 14.8 },
  { name: "Retarget: testimonial — got the job", campaign: "Job Interview — Retargeting", adSet: "Site visitors 14d", impressions: 33000, clicks: 1650, landingPageViews: 1436, purchases: 64, cpm: 15.6 },
  { name: "Retarget: last chance discount", campaign: "Job Interview — Retargeting", adSet: "Cart/signup abandoners", impressions: 18000, clicks: 900, landingPageViews: 792, purchases: 38, cpm: 17.2 },
  { name: "Lookalike 1% — hiring manager hook", campaign: "Job Interview — Lookalike 1%", adSet: "LAL 1% purchasers", impressions: 76000, clicks: 1520, landingPageViews: 1140, purchases: 19, cpm: 12.5 },
  { name: "Lookalike 1% — testimonial", campaign: "Job Interview — Lookalike 1%", adSet: "LAL 1% purchasers", impressions: 64000, clicks: 960, landingPageViews: 672, purchases: 9, cpm: 13.1 },
  { name: "Lookalike 1% — pain point static", campaign: "Job Interview — Lookalike 1%", adSet: "LAL 1% purchasers", impressions: 52000, clicks: 520, landingPageViews: 312, purchases: 3, cpm: 13.9 },
];

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function buildAds(): MetaAd[] {
  return AD_SEED.map((seed) => {
    const spend = Math.round(((seed.impressions / 1000) * seed.cpm) * 100) / 100;
    return {
      id: slugify(seed.name),
      name: seed.name,
      adSetId: slugify(seed.campaign) + "__" + slugify(seed.adSet),
      status: "active",
      ...deriveMetrics({ spend, impressions: seed.impressions, reach: Math.round(seed.impressions * 0.72), clicks: seed.clicks, landingPageViews: seed.landingPageViews, purchases: seed.purchases }),
    };
  });
}

function buildAdSets(ads: MetaAd[]): MetaAdSet[] {
  const groups = new Map<string, { campaign: string; adSet: string; ads: MetaAd[] }>();
  for (const seed of AD_SEED) {
    const adSetId = slugify(seed.campaign) + "__" + slugify(seed.adSet);
    const ad = ads.find((a) => a.id === slugify(seed.name))!;
    if (!groups.has(adSetId)) groups.set(adSetId, { campaign: seed.campaign, adSet: seed.adSet, ads: [] });
    groups.get(adSetId)!.ads.push(ad);
  }
  return Array.from(groups.entries()).map(([id, group]) => ({
    id,
    name: group.adSet,
    campaignId: slugify(group.campaign),
    status: "active",
    ...sumMetrics(group.ads),
  }));
}

function buildCampaigns(ads: MetaAd[]): MetaCampaign[] {
  const names = Array.from(new Set(AD_SEED.map((s) => s.campaign)));
  return names.map((name) => {
    const campaignAds = AD_SEED.filter((s) => s.campaign === name).map((s) => ads.find((a) => a.id === slugify(s.name))!);
    return { id: slugify(name), name, status: "active" as const, ...sumMetrics(campaignAds) };
  });
}

export class MetaAdsService {
  async getSnapshot(): Promise<MetaAdsSnapshot> {
    const ads = buildAds();
    const adSets = buildAdSets(ads);
    const campaigns = buildCampaigns(ads);
    const totals = sumMetrics(ads);
    const topCampaign = [...campaigns].sort((a, b) => b.roas - a.roas)[0];
    const sortedAds = [...ads].sort((a, b) => b.roas - a.roas);

    return {
      isMock: true,
      campaigns,
      adSets,
      ads,
      totals,
      topCampaign,
      topAd: sortedAds[0],
      worstAd: sortedAds[sortedAds.length - 1],
      spendTrend: buildWave(30, totals.spend / 30, 0.28, "spend"),
      ctrTrend: buildWave(30, totals.ctr, 0.35, "ctr"),
      cpcTrend: buildWave(30, totals.cpc, 0.3, "cpc"),
    };
  }
}
