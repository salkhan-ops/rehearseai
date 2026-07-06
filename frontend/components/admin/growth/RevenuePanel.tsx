"use client";

import { CreditCard, DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import type { RevenueSnapshot } from "@/lib/growth/types";
import { PreviewBadge } from "./PreviewBadge";
import { TrendChart } from "./TrendChart";

function usd(n: number) {
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function RevenuePanel({ revenue }: { revenue: RevenueSnapshot }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <AdminStatCard icon={DollarSign} label="MRR" value={usd(revenue.mrr)} />
        <AdminStatCard icon={DollarSign} label="ARR" value={usd(revenue.arr)} />
        <AdminStatCard icon={CreditCard} label="Subscriptions" value={revenue.subscriptions.toLocaleString()} />
        <AdminStatCard icon={CreditCard} label="Trials" value={revenue.trials.toLocaleString()} />
        <AdminStatCard icon={TrendingUp} label="Conversions (30d)" value={revenue.conversions.toLocaleString()} />
        <AdminStatCard icon={TrendingDown} label="Churn (this month)" value={revenue.churn.toLocaleString()} />
      </div>

      {revenue.isTrialsMock && (
        <div className="flex items-center gap-2">
          <PreviewBadge label="Trials are preview — Paddle doesn't record trial status yet" />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <TrendChart title="Revenue (30d)" data={revenue.revenueTrend} formatValue={usd} color="#16a34a" />
        <TrendChart title="Subscription revenue (30d)" data={revenue.mrrTrend} formatValue={usd} color="#6200a8" />
      </div>
    </div>
  );
}
