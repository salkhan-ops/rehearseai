// Shared types for the admin Growth Dashboard (frontend/app/admin/growth).
// Each service returns one of these shapes — real services (Firestore/Paddle) populate
// them from live data, mock services (Meta Ads/GA4/Pixel) populate them with realistic
// placeholders and set `isMock: true` so the UI can badge them accordingly.

export type TrendPoint = { date: string; value: number };

export type KpiSnapshot = {
  visitorsToday: number;
  visitorsThisWeek: number;
  visitorsThisMonth: number;
  isVisitorsMock: true;
  signupsToday: number;
  signupsThisWeek: number;
  signupsThisMonth: number;
  interviewsStarted: number;
  interviewsCompleted: number;
  completionRate: number;
  paidSubscribers: number;
  mrr: number;
  revenueToday: number;
  revenueThisMonth: number;
  activeUsers7d: number;
  activeUsers30d: number;
  visitorsTrend: TrendPoint[];
  signupsTrend: TrendPoint[];
  revenueTrend: TrendPoint[];
  interviewStartsTrend: TrendPoint[];
  interviewCompletionsTrend: TrendPoint[];
};

export type FunnelStepKey =
  | "adImpressions"
  | "linkClicks"
  | "landingPageViews"
  | "signups"
  | "interviewStarted"
  | "interviewCompleted"
  | "subscriptionPurchased";

export type FunnelStep = {
  key: FunnelStepKey;
  label: string;
  count: number;
  conversionFromPrevious: number | null;
  conversionFromStart: number;
  dropOffFromPrevious: number | null;
  isBottleneck: boolean;
  isMock: boolean;
};

export type MetaCreativeMetrics = {
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  landingPageViews: number;
  costPerLandingPageView: number;
  purchases: number;
  costPerPurchase: number;
  roas: number;
};

export type MetaCampaign = MetaCreativeMetrics & { id: string; name: string; status: "active" | "paused" };
export type MetaAdSet = MetaCreativeMetrics & { id: string; name: string; campaignId: string; status: "active" | "paused" };
export type MetaAd = MetaCreativeMetrics & { id: string; name: string; adSetId: string; status: "active" | "paused" };

export type MetaAdsSnapshot = {
  isMock: true;
  campaigns: MetaCampaign[];
  adSets: MetaAdSet[];
  ads: MetaAd[];
  totals: MetaCreativeMetrics;
  topCampaign: MetaCampaign;
  topAd: MetaAd;
  worstAd: MetaAd;
  spendTrend: TrendPoint[];
  ctrTrend: TrendPoint[];
  cpcTrend: TrendPoint[];
};

export type GaSnapshot = {
  isMock: true;
  users: number;
  sessions: number;
  avgEngagementTimeSeconds: number;
  bounceRate: number;
  returningUsers: number;
  topLandingPages: { path: string; views: number }[];
  countries: { country: string; users: number }[];
  devices: { device: string; users: number }[];
  trafficSources: { source: string; users: number }[];
};

export const PIXEL_EVENT_NAMES = [
  "PageView",
  "ViewContent",
  "Lead",
  "CompleteRegistration",
  "InterviewStarted",
  "VisaInterviewStarted",
  "SalaryNegotiationStarted",
  "PresentationStarted",
  "SessionCompleted",
  "FeedbackViewed",
  "Purchase",
] as const;

export type PixelEventName = (typeof PIXEL_EVENT_NAMES)[number];

export type PixelEventCounts = {
  isMock: true;
  counts: Record<PixelEventName, number>;
  trends: Record<PixelEventName, TrendPoint[]>;
};

export type UsageSnapshot = {
  mostPopularScenario: string;
  scenarioBreakdown: { practiceType: string; count: number }[];
  avgInterviewDurationMinutes: number;
  avgReportScore: number;
  avgReasoningScore: number;
  usersReturningWithin7DaysPct: number;
  avgInterviewsPerUser: number;
  mostUsedDevice: string;
  mostCommonCountry: string;
  isDeviceCountryMock: true;
};

export type RevenueSnapshot = {
  mrr: number;
  arr: number;
  subscriptions: number;
  trials: number;
  isTrialsMock: true;
  conversions: number;
  churn: number;
  revenueTrend: TrendPoint[];
  mrrTrend: TrendPoint[];
  conversionsTrend: TrendPoint[];
};

export type AlertSeverity = "critical" | "warning";

export type GrowthAlert = {
  id: string;
  severity: AlertSeverity;
  title: string;
  detail: string;
};

export type AdvisorTheme = "ads" | "funnel" | "onboarding" | "revenue" | "product";

export type AdvisorRecommendation = {
  id: string;
  theme: AdvisorTheme;
  headline: string;
  body: string;
};

export type GrowthDashboardData = {
  kpis: KpiSnapshot;
  funnel: FunnelStep[];
  metaAds: MetaAdsSnapshot;
  ga: GaSnapshot;
  pixel: PixelEventCounts;
  usage: UsageSnapshot;
  revenue: RevenueSnapshot;
  alerts: GrowthAlert[];
  recommendations: AdvisorRecommendation[];
};
