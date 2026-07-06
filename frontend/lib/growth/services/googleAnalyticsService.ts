"use client";

// TODO: swap for the GA4 Data API (https://developers.google.com/analytics/devguides/reporting/data/v1).
// Method names mirror the report types you'd request from that API (runReport for
// overview metrics, dimension breakdowns for landing pages/countries/devices/sources)
// so the real client can replace this class without touching the panel component.

import { buildWave } from "../mockWave";
import type { GaSnapshot } from "../types";

export class GoogleAnalyticsService {
  async getSnapshot(): Promise<GaSnapshot> {
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

  async getUsersTrend() {
    return buildWave(30, 480, 0.4, "ga-users");
  }
}
