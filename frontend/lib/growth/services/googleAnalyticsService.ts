"use client";

// Calls /api/growth/google-analytics (a server route that hits the GA4 Data API with
// GA4_PROPERTY_ID / GA4_CLIENT_EMAIL / GA4_PRIVATE_KEY) and falls back to realistic mock
// data when those env vars aren't set or the request fails, so the dashboard still renders
// during local dev. The route response is cached per-instance since getSnapshot() and
// getUsersTrend() are called together and both need the same underlying report data.

import { buildWave } from "../mockWave";
import type { GaSnapshot, TrendPoint } from "../types";

type RealGaData = { snapshot: GaSnapshot; usersTrend: TrendPoint[] };

export class GoogleAnalyticsService {
  private realDataPromise: Promise<RealGaData | null> | null = null;

  private loadReal(): Promise<RealGaData | null> {
    if (!this.realDataPromise) {
      this.realDataPromise = fetch("/api/growth/google-analytics", { cache: "no-store" })
        .then(async (res) => {
          const json = await res.json();
          if (res.ok && json.configured && json.snapshot) return { snapshot: json.snapshot as GaSnapshot, usersTrend: json.usersTrend as TrendPoint[] };
          return null;
        })
        .catch(() => null);
    }
    return this.realDataPromise;
  }

  async getSnapshot(): Promise<GaSnapshot> {
    const real = await this.loadReal();
    if (real) return real.snapshot;
    return this.getMockSnapshot();
  }

  async getUsersTrend(): Promise<TrendPoint[]> {
    const real = await this.loadReal();
    if (real) return real.usersTrend;
    return buildWave(30, 480, 0.4, "ga-users");
  }

  private getMockSnapshot(): GaSnapshot {
    return {
      isMock: true,
      users: 14280,
      sessions: 19640,
      avgEngagementTimeSeconds: 96,
      bounceRate: 42.6,
      returningUsers: 3120,
      topLandingPages: [
        { path: "/for/interview-practice", views: 8420 },
        { path: "/", views: 5310 },
        { path: "/for/salary-negotiation-practice", views: 1190 },
        { path: "/pricing", views: 980 },
        { path: "/for/public-speaking-practice", views: 640 },
      ],
      countries: [
        { country: "United States", users: 6840 },
        { country: "United Kingdom", users: 2210 },
        { country: "India", users: 1680 },
        { country: "Canada", users: 980 },
        { country: "Australia", users: 640 },
      ],
      devices: [
        { device: "Mobile", users: 8560 },
        { device: "Desktop", users: 5120 },
        { device: "Tablet", users: 600 },
      ],
      trafficSources: [
        { source: "Meta Ads (paid social)", users: 9840 },
        { source: "Direct", users: 2160 },
        { source: "Organic search", users: 1420 },
        { source: "Referral", users: 540 },
        { source: "Email", users: 320 },
      ],
    };
  }
}
