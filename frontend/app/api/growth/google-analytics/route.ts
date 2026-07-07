import { NextResponse } from "next/server";
import { BetaAnalyticsDataClient } from "@google-analytics/data";
import type { GaSnapshot, TrendPoint } from "@/lib/growth/types";

// Server-side only — reads GA4_PROPERTY_ID / GA4_CLIENT_EMAIL / GA4_PRIVATE_KEY and calls the
// GA4 Data API. Never expose these credentials to the client; googleAnalyticsService.ts fetches
// this route instead of GA4 directly.

export const dynamic = "force-dynamic";

function rowValue(row: { metricValues?: { value?: string | null }[] | null } | undefined, index = 0): number {
  const v = row?.metricValues?.[index]?.value;
  return v ? Number(v) : 0;
}

function dimValue(row: { dimensionValues?: { value?: string | null }[] | null } | undefined, index = 0): string {
  return row?.dimensionValues?.[index]?.value || "";
}

function formatGaDate(yyyymmdd: string): string {
  return yyyymmdd.length === 8 ? `${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}` : yyyymmdd;
}

export async function GET() {
  const propertyId = process.env.GA4_PROPERTY_ID;
  const clientEmail = process.env.GA4_CLIENT_EMAIL;
  const privateKey = process.env.GA4_PRIVATE_KEY;

  if (!propertyId || !clientEmail || !privateKey) {
    return NextResponse.json({ configured: false });
  }

  try {
    const client = new BetaAnalyticsDataClient({
      credentials: { client_email: clientEmail, private_key: privateKey.replace(/\\n/g, "\n") },
    });
    const property = `properties/${propertyId}`;
    const dateRanges = [{ startDate: "30daysAgo", endDate: "today" }];

    // GA4's batchRunReports caps at 5 requests, so these 7 reports run as individual
    // parallel runReport calls instead.
    const [[overview], [newVsReturning], [landingPages], [countries], [devices], [trafficSources], [dailyUsers]] = await Promise.all([
      client.runReport({ property, dateRanges, metrics: [{ name: "totalUsers" }, { name: "sessions" }, { name: "averageSessionDuration" }, { name: "bounceRate" }] }),
      client.runReport({ property, dateRanges, dimensions: [{ name: "newVsReturning" }], metrics: [{ name: "totalUsers" }] }),
      client.runReport({
        property,
        dateRanges,
        dimensions: [{ name: "landingPage" }],
        metrics: [{ name: "screenPageViews" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: "5",
      }),
      client.runReport({
        property,
        dateRanges,
        dimensions: [{ name: "country" }],
        metrics: [{ name: "totalUsers" }],
        orderBys: [{ metric: { metricName: "totalUsers" }, desc: true }],
        limit: "5",
      }),
      client.runReport({
        property,
        dateRanges,
        dimensions: [{ name: "deviceCategory" }],
        metrics: [{ name: "totalUsers" }],
        orderBys: [{ metric: { metricName: "totalUsers" }, desc: true }],
      }),
      client.runReport({
        property,
        dateRanges,
        dimensions: [{ name: "sessionDefaultChannelGroup" }],
        metrics: [{ name: "totalUsers" }],
        orderBys: [{ metric: { metricName: "totalUsers" }, desc: true }],
        limit: "5",
      }),
      client.runReport({
        property,
        dateRanges,
        dimensions: [{ name: "date" }],
        metrics: [{ name: "totalUsers" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
      }),
    ]);

    const overviewRow = overview?.rows?.[0];
    const returningRow = (newVsReturning?.rows || []).find((r) => dimValue(r).toLowerCase() === "returning");

    const snapshot: GaSnapshot = {
      isMock: false,
      users: rowValue(overviewRow, 0),
      sessions: rowValue(overviewRow, 1),
      avgEngagementTimeSeconds: Math.round(rowValue(overviewRow, 2)),
      bounceRate: Math.round(rowValue(overviewRow, 3) * 1000) / 10,
      returningUsers: returningRow ? rowValue(returningRow, 0) : 0,
      topLandingPages: (landingPages?.rows || []).map((r) => ({ path: dimValue(r), views: rowValue(r) })),
      countries: (countries?.rows || []).map((r) => ({ country: dimValue(r), users: rowValue(r) })),
      devices: (devices?.rows || []).map((r) => ({ device: dimValue(r), users: rowValue(r) })),
      trafficSources: (trafficSources?.rows || []).map((r) => ({ source: dimValue(r), users: rowValue(r) })),
    };

    const usersTrend: TrendPoint[] = (dailyUsers?.rows || []).map((r) => ({ date: formatGaDate(dimValue(r)), value: rowValue(r) }));

    return NextResponse.json({ configured: true, snapshot, usersTrend });
  } catch (err) {
    console.error("[api/growth/google-analytics] fetch failed:", err);
    return NextResponse.json({ configured: true, error: err instanceof Error ? err.message : "Unknown error" }, { status: 502 });
  }
}
