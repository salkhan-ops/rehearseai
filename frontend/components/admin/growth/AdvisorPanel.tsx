"use client";

import { BarChart2, Compass, DollarSign, Megaphone, Sparkles, Wand2 } from "lucide-react";
import type { AdvisorRecommendation, AdvisorTheme } from "@/lib/growth/types";

const THEME_META: Record<AdvisorTheme, { label: string; icon: typeof Megaphone; className: string }> = {
  ads: { label: "Ads", icon: Megaphone, className: "bg-violet-50 text-violet-700" },
  funnel: { label: "Funnel", icon: Compass, className: "bg-blue-50 text-blue-700" },
  onboarding: { label: "Onboarding", icon: Wand2, className: "bg-cyan-50 text-cyan-700" },
  revenue: { label: "Revenue", icon: DollarSign, className: "bg-emerald-50 text-emerald-700" },
  product: { label: "Product", icon: BarChart2, className: "bg-amber-50 text-amber-700" },
};

export function AdvisorPanel({ recommendations }: { recommendations: AdvisorRecommendation[] }) {
  return (
    <div className="space-y-4">
      <div className="rounded-[1.25rem] bg-gradient-to-r from-violet-50 via-white to-white p-5 ring-1 ring-violet-100">
        <div className="flex items-center gap-2 text-violet-700">
          <Sparkles size={18} />
          <h2 className="text-lg font-semibold tracking-[-0.03em]">AI Growth Advisor</h2>
        </div>
        <p className="mt-1 text-sm font-medium text-slate-600">
          Read automatically from the data on this dashboard — a deterministic rule engine today, ready to swap for a live model later without changing this panel.
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {recommendations.map((rec) => {
          const meta = THEME_META[rec.theme];
          const Icon = meta.icon;
          return (
            <div key={rec.id} className="rounded-[1.25rem] bg-white p-5 shadow-[0_14px_38px_rgba(35,45,75,0.045)] ring-1 ring-slate-200/75">
              <div className="flex items-center gap-2">
                <span className={`grid size-8 place-items-center rounded-xl ${meta.className}`}><Icon size={15} /></span>
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">{meta.label}</span>
              </div>
              <h3 className="mt-3 font-semibold text-slate-900">{rec.headline}</h3>
              <p className="mt-1.5 text-sm font-medium leading-6 text-slate-600">{rec.body}</p>
            </div>
          );
        })}
        {recommendations.length === 0 && (
          <p className="text-sm font-medium text-slate-400">Not enough data yet to generate recommendations.</p>
        )}
      </div>
    </div>
  );
}
