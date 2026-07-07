import { NextResponse } from "next/server";
import type { MetaAd, MetaAdSet, MetaAdsSnapshot, MetaCampaign, MetaCreativeMetrics, TrendPoint } from "@/lib/growth/types";

// Server-side only — reads META_ACCESS_TOKEN / META_AD_ACCOUNT_ID and calls the Meta
// Marketing API Insights endpoints. Never expose the access token to the client;
// frontend/lib/growth/services/metaAdsService.ts fetches this route instead of Meta directly.

export const dynamic = "force-dynamic";

const GRAPH_VERSION = "v21.0";
const AVG_ORDER_VALUE = 39;
const PURCHASE_ACTION_TYPES = ["purchase", "offsite_conversion.fb_pixel_purchase", "omni_purchase"];

type GraphAction = { action_type: string; value: string };
type AdInsightRow = {
  ad_id: string;
  ad_name: string;
  adset_id: string;
  adset_name: string;
  campaign_id: string;
  campaign_name: string;
  spend?: string;
  impressions?: string;
  reach?: string;
  clicks?: string;
  actions?: GraphAction[];
};
type DailyInsightRow = { date_start: string; spend?: string; impressions?: string; clicks?: string };
type EntityStatusRow = { id: string; effective_status?: string };

function num(v: string | undefined): number {
  return v ? Number(v) : 0;
}

function actionValue(actions: GraphAction[] | undefined, types: string[]): number {
  if (!actions) return 0;
  return actions.filter((a) => types.includes(a.action_type)).reduce((sum, a) => sum + Number(a.value || 0), 0);
}

function deriveMetrics(raw: { spend: number; impressions: number; reach: number; clicks: number; landingPageViews: number; purchases: number }): MetaCreativeMetrics {
  const { spend, impressions, reach, clicks, landingPageViews, purchases } = raw;
  const revenue = purchases * AVG_ORDER_VALUE;
  return {
    spend: Math.round(spend * 100) / 100,
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

const EMPTY_METRICS = deriveMetrics({ spend: 0, impressions: 0, reach: 0, clicks: 0, landingPageViews: 0, purchases: 0 });

async function fetchGraph<T>(path: string, params: Record<string, string>, token: string): Promise<T[]> {
  const results: T[] = [];
  let url: string | null = `https://graph.facebook.com/${GRAPH_VERSION}/${path}?${new URLSearchParams({ ...params, access_token: token, limit: "500" })}`;
  while (url) {
    const res: Response = await fetch(url, { cache: "no-store" });
    const json: { data?: T[]; paging?: { next?: string }; error?: { message?: string } } = await res.json();
    if (!res.ok) throw new Error(json?.error?.message || `Graph API error on ${path}`);
    results.push(...((json.data as T[]) || []));
    url = json.paging?.next || null;
  }
  return results;
}

export async function GET() {
  const token = process.env.META_ACCESS_TOKEN;
  const rawAccountId = process.env.META_AD_ACCOUNT_ID;

  if (!token || !rawAccountId) {
    return NextResponse.json({ configured: false });
  }

  const accountId = rawAccountId.startsWith("act_") ? rawAccountId : `act_${rawAccountId}`;

  try {
    const [accountInfo, dailyRows, adRows, campaignStatus, adsetStatus, adStatus] = await Promise.all([
      fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${accountId}?${new URLSearchParams({ fields: "currency", access_token: token })}`, { cache: "no-store" }).then((r) => r.json()) as Promise<{
        currency?: string;
      }>,
      fetchGraph<DailyInsightRow>(`${accountId}/insights`, { level: "account", fields: "spend,impressions,clicks", time_increment: "1", date_preset: "last_30d" }, token),
      fetchGraph<AdInsightRow>(
        `${accountId}/insights`,
        { level: "ad", fields: "ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,spend,impressions,reach,clicks,actions", date_preset: "last_30d" },
        token
      ),
      fetchGraph<EntityStatusRow>(`${accountId}/campaigns`, { fields: "id,effective_status" }, token),
      fetchGraph<EntityStatusRow>(`${accountId}/adsets`, { fields: "id,effective_status" }, token),
      fetchGraph<EntityStatusRow>(`${accountId}/ads`, { fields: "id,effective_status" }, token),
    ]);
    const currency = accountInfo.currency || "USD";

    const statusFor = (rows: EntityStatusRow[], id: string): "active" | "paused" => (rows.find((r) => r.id === id)?.effective_status === "ACTIVE" ? "active" : "paused");

    const ads: MetaAd[] = adRows.map((row) => ({
      id: row.ad_id,
      name: row.ad_name,
      adSetId: row.adset_id,
      status: statusFor(adStatus, row.ad_id),
      ...deriveMetrics({
        spend: num(row.spend),
        impressions: num(row.impressions),
        reach: num(row.reach),
        clicks: num(row.clicks),
        landingPageViews: actionValue(row.actions, ["landing_page_view"]),
        purchases: actionValue(row.actions, PURCHASE_ACTION_TYPES),
      }),
    }));

    const adSetGroups = new Map<string, { name: string; campaignId: string; ads: MetaAd[] }>();
    const campaignGroups = new Map<string, { name: string; ads: MetaAd[] }>();
    for (const row of adRows) {
      const ad = ads.find((a) => a.id === row.ad_id)!;
      if (!adSetGroups.has(row.adset_id)) adSetGroups.set(row.adset_id, { name: row.adset_name, campaignId: row.campaign_id, ads: [] });
      adSetGroups.get(row.adset_id)!.ads.push(ad);
      if (!campaignGroups.has(row.campaign_id)) campaignGroups.set(row.campaign_id, { name: row.campaign_name, ads: [] });
      campaignGroups.get(row.campaign_id)!.ads.push(ad);
    }

    const adSets: MetaAdSet[] = Array.from(adSetGroups.entries()).map(([id, group]) => ({
      id,
      name: group.name,
      campaignId: group.campaignId,
      status: statusFor(adsetStatus, id),
      ...sumMetrics(group.ads),
    }));

    const campaigns: MetaCampaign[] = Array.from(campaignGroups.entries()).map(([id, group]) => ({
      id,
      name: group.name,
      status: statusFor(campaignStatus, id),
      ...sumMetrics(group.ads),
    }));

    const totals = sumMetrics(ads);
    const sortedCampaigns = [...campaigns].sort((a, b) => b.roas - a.roas);
    const sortedAds = [...ads].sort((a, b) => b.roas - a.roas);

    const spendTrend: TrendPoint[] = dailyRows.map((r) => ({ date: r.date_start.slice(5), value: num(r.spend) }));
    const ctrTrend: TrendPoint[] = dailyRows.map((r) => {
      const impressions = num(r.impressions);
      return { date: r.date_start.slice(5), value: impressions ? Math.round((num(r.clicks) / impressions) * 10000) / 100 : 0 };
    });
    const cpcTrend: TrendPoint[] = dailyRows.map((r) => {
      const clicks = num(r.clicks);
      return { date: r.date_start.slice(5), value: clicks ? Math.round((num(r.spend) / clicks) * 100) / 100 : 0 };
    });

    const snapshot: MetaAdsSnapshot = {
      isMock: false,
      currency,
      campaigns,
      adSets,
      ads,
      totals,
      topCampaign: sortedCampaigns[0] ?? { id: "none", name: "No campaigns", status: "paused", ...EMPTY_METRICS },
      topAd: sortedAds[0] ?? { id: "none", name: "No ads", adSetId: "none", status: "paused", ...EMPTY_METRICS },
      worstAd: sortedAds[sortedAds.length - 1] ?? { id: "none", name: "No ads", adSetId: "none", status: "paused", ...EMPTY_METRICS },
      spendTrend,
      ctrTrend,
      cpcTrend,
    };

    return NextResponse.json({ configured: true, snapshot });
  } catch (err) {
    console.error("[api/growth/meta-ads] fetch failed:", err);
    return NextResponse.json({ configured: true, error: err instanceof Error ? err.message : "Unknown error" }, { status: 502 });
  }
}
