"use client";

export type GrowthTabKey =
  | "executive"
  | "funnel"
  | "metaAds"
  | "googleAnalytics"
  | "pixel"
  | "usage"
  | "revenue"
  | "advisor"
  | "alerts"
  | "charts";

export const GROWTH_TABS: { key: GrowthTabKey; label: string }[] = [
  { key: "executive", label: "Executive" },
  { key: "funnel", label: "Marketing Funnel" },
  { key: "metaAds", label: "Meta Ads" },
  { key: "googleAnalytics", label: "Google Analytics" },
  { key: "pixel", label: "Pixel Events" },
  { key: "usage", label: "Usage" },
  { key: "revenue", label: "Revenue" },
  { key: "advisor", label: "AI Advisor" },
  { key: "alerts", label: "Alerts" },
  { key: "charts", label: "Charts" },
];

export function GrowthTabs({
  active,
  onChange,
  alertCount,
}: {
  active: GrowthTabKey;
  onChange: (key: GrowthTabKey) => void;
  alertCount: number;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {GROWTH_TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition ${
            active === tab.key ? "bg-[#6200a8] text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
          }`}
        >
          {tab.label}
          {tab.key === "alerts" && alertCount > 0 && (
            <span className={`grid size-4 place-items-center rounded-full text-[10px] font-bold ${active === tab.key ? "bg-white text-[#6200a8]" : "bg-rose-100 text-rose-600"}`}>
              {alertCount}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
