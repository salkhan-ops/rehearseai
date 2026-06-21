"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BarChart2, CalendarDays, Zap } from "lucide-react";
import { getUserPlanInfo, getSessionUsage, type UsageInfo } from "@/lib/entitlements";
import { useAuth } from "@/lib/auth";

export function PlanUsageCard() {
  const { userId } = useAuth();
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    getUserPlanInfo(userId)
      .then(({ entitlements, planName }) => getSessionUsage(userId, entitlements, planName))
      .then(setUsage)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return null;
  if (!usage) return null;

  const isUnlimited = usage.limit === "unlimited";
  const used = usage.used;
  const limit = isUnlimited ? 100 : (usage.limit as number);
  const remaining = isUnlimited ? null : (usage.remaining as number);
  const nearLimit = !isUnlimited && typeof remaining === "number" && remaining <= 3 && remaining > 0;
  const atLimit = !isUnlimited && remaining === 0;

  return (
    <div className={`rounded-[1.75rem] p-5 ring-1 ${atLimit ? "surface-low ring-rose-300/30" : "surface-low ring-[var(--border-soft)]"}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-primary)]/10">
            <Zap size={16} className="text-[var(--accent-primary)]" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[var(--accent-primary)]">
              {usage.planName} plan
            </p>
            <p className="text-xs font-medium text-secondary-token">Monthly sessions</p>
          </div>
        </div>
        {usage.planName === "Free" && (
          <Link
            href="/pricing"
            className="flex items-center gap-1.5 rounded-2xl bg-[var(--accent-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5"
          >
            Upgrade <ArrowRight size={13} />
          </Link>
        )}
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-end justify-between gap-2">
          <span className="text-3xl font-semibold tracking-[-0.04em] text-primary-token">
            {used}
            {!isUnlimited && <span className="text-lg font-medium text-secondary-token">/{limit}</span>}
          </span>
          {!isUnlimited && (
            <span className={`text-sm font-semibold ${atLimit ? "text-rose-400" : nearLimit ? "text-amber-400" : "text-secondary-token"}`}>
              {atLimit ? "Limit reached" : `${remaining} left`}
            </span>
          )}
          {isUnlimited && (
            <span className="text-sm font-semibold text-emerald-400">Unlimited</span>
          )}
        </div>

        {!isUnlimited && (
          <progress
            value={used}
            max={limit}
            className={`h-2 w-full appearance-none overflow-hidden rounded-full [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-[var(--surface-secondary)] [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:transition-all ${atLimit ? "[&::-webkit-progress-value]:bg-rose-500" : nearLimit ? "[&::-webkit-progress-value]:bg-amber-400" : "[&::-webkit-progress-value]:bg-[var(--accent-primary)]"}`}
          />
        )}
      </div>

      {atLimit && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-rose-400/10 px-4 py-3 ring-1 ring-rose-300/20">
          <p className="text-sm font-semibold text-rose-400">
            All {limit} sessions used. Resets {usage.resetDate}.
          </p>
          <Link href="/pricing" className="shrink-0 text-sm font-semibold text-rose-300 underline underline-offset-2">
            Upgrade now
          </Link>
        </div>
      )}

      {!atLimit && (
        <div className="mt-3 flex items-center gap-2 text-xs font-medium text-tertiary-token">
          <CalendarDays size={12} />
          Resets {usage.resetDate}
          {usage.planName !== "Free" && (
            <>
              <span className="mx-1">·</span>
              <BarChart2 size={12} />
              <Link href="/settings" className="hover:text-secondary-token">Manage plan</Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
