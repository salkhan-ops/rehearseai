"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowUpRight, CheckCircle2, Clock, Crown, Loader2, Package, RefreshCw, ShieldOff } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { getUserPlanInfo, getSessionUsage, type UsageInfo } from "@/lib/entitlements";
import { useAuth } from "@/lib/auth";

type Purchase = {
  packageId: string;
  title: string;
  practiceType: string;
  durationDays: number;
  sessionsTotal: number;
  sessionsUsed: number;
  purchasedAt: string;
  expiresAt: string;
  status: string;
};

type BillingData = {
  planId: string;
  planName: string;
  status: string;
  subscriptionId?: string;
  purchases: Purchase[];
  usage: UsageInfo;
};

const PLAN_FEATURES: Record<string, string[]> = {
  pro: ["20 sessions / month", "Advanced session reports", "Full session history", "Course templates"],
  coach: ["45 sessions / month", "Brutal & Nerve pressure modes", "Advanced personas", "Deep analytics & benchmarking"],
};

function daysRemaining(expiresAt: string): number {
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

function planBadgeClass(planId: string) {
  if (planId === "coach") return "bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20";
  if (planId === "pro") return "bg-violet-50 text-violet-700 ring-violet-100 dark:bg-violet-400/10 dark:text-violet-300 dark:ring-violet-400/20";
  return "bg-slate-50 text-slate-600 ring-slate-200 dark:bg-white/5 dark:text-slate-300 dark:ring-white/10";
}

function statusColor(status: string) {
  if (status === "active") return "text-emerald-600 dark:text-emerald-400";
  if (status === "canceled") return "text-rose-500";
  return "text-secondary-token";
}

export function BillingSection() {
  const { userId } = useAuth();
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [cancelStep, setCancelStep] = useState<"idle" | "confirm">("idle");
  const [cancelDone, setCancelDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId || userId === "guest") { setLoading(false); return; }
    setLoading(true);
    try {
      const db = getFirebaseDb();
      const [planInfo, entSnap] = await Promise.all([
        getUserPlanInfo(userId),
        db ? getDoc(doc(db, "userEntitlements", userId)) : Promise.resolve(null),
      ]);
      const raw = entSnap && entSnap.exists() ? entSnap.data() : {};
      const usage = await getSessionUsage(userId, planInfo.entitlements, planInfo.planName);
      setData({
        planId: planInfo.planId,
        planName: planInfo.planName,
        status: raw.status ?? "active",
        subscriptionId: raw.subscriptionId ?? "",
        purchases: Array.isArray(raw.purchases) ? (raw.purchases as Purchase[]) : [],
        usage,
      });
    } catch {
      setError("Could not load billing information.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    function onPayment() {
      setTimeout(() => load(), 3000);
    }
    window.addEventListener("paddle:payment-complete", onPayment);
    return () => window.removeEventListener("paddle:payment-complete", onPayment);
  }, [load]);

  async function handleConfirmCancel() {
    if (!userId || userId === "guest") return;
    setCanceling(true);
    setError(null);
    try {
      const { cancelSubscription } = await import("@/lib/api");
      await cancelSubscription("Canceled from settings page");
      setCancelDone(true);
      setCancelStep("idle");
      await load();
    } catch {
      setError("Could not cancel. Please try again or contact support.");
    } finally {
      setCanceling(false);
    }
  }

  // ── Loading / guest / error states ────────────────────────────────────────

  if (loading) {
    return (
      <section className="rounded-[2rem] surface-high p-6">
        <div className="flex items-center gap-3 text-secondary-token">
          <Loader2 size={18} className="animate-spin" /> Loading billing info…
        </div>
      </section>
    );
  }

  if (!userId || userId === "guest") {
    return (
      <section className="rounded-[2rem] surface-high p-6">
        <h2 className="text-3xl font-semibold tracking-[-0.045em]">Billing & subscription</h2>
        <p className="mt-2 font-medium text-secondary-token">Sign in to view your plan and purchased packages.</p>
      </section>
    );
  }

  if (error && !data) {
    return (
      <section className="rounded-[2rem] surface-high p-6">
        <div className="flex items-center gap-3 text-rose-500"><AlertTriangle size={18} /> {error}</div>
        <button type="button" onClick={load} className="mt-4 inline-flex items-center gap-2 rounded-2xl surface-low px-4 py-2.5 text-sm font-semibold ring-1 ring-[var(--border-soft)]">
          <RefreshCw size={14} /> Retry
        </button>
      </section>
    );
  }

  const { planId, planName, status, purchases, usage } = data!;
  const isFree = planId === "free";
  const usagePct = usage.limit === "unlimited" ? 0 : Math.min(100, Math.round((usage.used / (usage.limit as number)) * 100));
  const activePurchases = purchases.filter((p) => daysRemaining(p.expiresAt) > 0 && p.status !== "expired");
  const expiredPurchases = purchases.filter((p) => daysRemaining(p.expiresAt) <= 0 || p.status === "expired");
  const lostFeatures = PLAN_FEATURES[planId] ?? [];

  return (
    <section className="rounded-[2rem] surface-high p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Crown size={20} className="text-[var(--accent-primary)]" />
          <h2 className="text-3xl font-semibold tracking-[-0.045em]">Billing & subscription</h2>
        </div>
        <button type="button" onClick={load} title="Refresh" className="grid size-9 place-items-center rounded-xl surface-low ring-1 ring-[var(--border-soft)] text-secondary-token">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Current plan card */}
      <div className="mt-6 rounded-2xl bg-white/60 p-5 ring-1 ring-[var(--border-soft)] dark:bg-white/[0.04]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-sm font-bold ring-1 ${planBadgeClass(planId)}`}>{planName}</span>
              <span className={`text-sm font-semibold ${statusColor(status)}`}>{status}</span>
            </div>
            <p className="mt-2 text-sm font-medium text-secondary-token">
              {isFree
                ? "Free plan · upgrade any time for unlimited sessions"
                : status === "canceled"
                ? "Your subscription is scheduled to end. Access continues until the billing period is up."
                : "Subscription active · renews monthly"}
            </p>
          </div>
          {isFree && (
            <Link href="/pricing" className="inline-flex items-center gap-1.5 rounded-2xl bg-[var(--accent-primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5">
              Upgrade <ArrowUpRight size={14} />
            </Link>
          )}
        </div>

        {/* Session usage bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span className="text-secondary-token">Sessions this month</span>
            <span>{usage.used} / {usage.limit === "unlimited" ? "∞" : usage.limit}</span>
          </div>
          {usage.limit !== "unlimited" && (
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--surface-secondary)]">
              <div
                className={`h-full rounded-full transition-all ${usagePct >= 100 ? "bg-rose-500" : usagePct >= 75 ? "bg-amber-500" : "bg-[var(--accent-primary)]"}`}
                style={{ width: `${usagePct}%` }}
              />
            </div>
          )}
          <p className="mt-1.5 text-xs font-medium text-secondary-token">Resets {usage.resetDate}</p>
        </div>

        {/* Cancel flow */}
        {!isFree && status !== "canceled" && !cancelDone && (
          <div className="mt-5 border-t border-[var(--border-soft)] pt-4">
            {cancelStep === "idle" ? (
              <button
                type="button"
                onClick={() => setCancelStep("confirm")}
                className="text-sm font-medium text-secondary-token underline-offset-2 hover:text-rose-500 hover:underline transition-colors"
              >
                Cancel subscription
              </button>
            ) : (
              <div className="rounded-2xl bg-rose-50 p-4 ring-1 ring-rose-100 dark:bg-rose-500/10 dark:ring-rose-500/20">
                <div className="flex items-center gap-2 font-semibold text-rose-700 dark:text-rose-300">
                  <ShieldOff size={16} />
                  Are you sure you want to cancel?
                </div>
                <p className="mt-1.5 text-sm font-medium text-rose-600/80 dark:text-rose-300/70">
                  You keep full access until the end of your current billing period. After that you will drop to the Free plan and lose:
                </p>
                {lostFeatures.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {lostFeatures.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm font-medium text-rose-600 dark:text-rose-300">
                        <span className="text-rose-400">–</span> {f}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCancelStep("idle")}
                    className="rounded-2xl bg-[var(--accent-primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5"
                  >
                    Keep my {planName} plan
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmCancel}
                    disabled={canceling}
                    className="inline-flex items-center gap-2 text-sm font-medium text-rose-600 underline-offset-2 hover:underline disabled:opacity-60 dark:text-rose-400"
                  >
                    {canceling && <Loader2 size={13} className="animate-spin" />}
                    Yes, cancel anyway
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {cancelDone && (
          <p className="mt-4 flex items-center gap-2 border-t border-[var(--border-soft)] pt-4 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={14} /> Cancellation scheduled. You keep access until the period ends.
          </p>
        )}

        {error && (
          <p className="mt-3 flex items-center gap-2 text-sm text-rose-500">
            <AlertTriangle size={14} /> {error}
          </p>
        )}
      </div>

      {/* Active course packages */}
      {activePurchases.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-secondary-token">
            <Package size={14} /> Active packages
          </div>
          <div className="mt-3 space-y-3">
            {activePurchases.map((p, i) => {
              const days = daysRemaining(p.expiresAt);
              const sessLeft = Math.max(0, p.sessionsTotal - p.sessionsUsed);
              const sessPct = Math.min(100, Math.round((p.sessionsUsed / p.sessionsTotal) * 100));
              return (
                <div key={`${p.packageId}-${i}`} className="rounded-2xl bg-white/60 p-4 ring-1 ring-[var(--border-soft)] dark:bg-white/[0.04]">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold">{p.title}</div>
                      {p.practiceType && <div className="mt-0.5 text-xs font-medium text-secondary-token">{p.practiceType}</div>}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-secondary-token">
                      <Clock size={13} />
                      <span className={days <= 2 ? "text-rose-500" : days <= 5 ? "text-amber-600 dark:text-amber-400" : ""}>
                        {days} day{days !== 1 ? "s" : ""} left
                      </span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-secondary-token">
                      <span>Sessions</span>
                      <span>{sessLeft} of {p.sessionsTotal} remaining</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-secondary)]">
                      <div
                        className={`h-full rounded-full ${sessPct >= 100 ? "bg-rose-500" : sessPct >= 75 ? "bg-amber-500" : "bg-[var(--accent-secondary)]"}`}
                        style={{ width: `${sessPct}%` }}
                      />
                    </div>
                  </div>
                  <p className="mt-2 text-xs font-medium text-secondary-token">
                    Expires {new Date(p.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Expired packages (collapsed) */}
      {expiredPurchases.length > 0 && (
        <details className="mt-4 group">
          <summary className="cursor-pointer list-none text-sm font-semibold text-secondary-token">
            <span className="group-open:hidden">Show {expiredPurchases.length} expired package{expiredPurchases.length !== 1 ? "s" : ""}</span>
            <span className="hidden group-open:inline">Hide expired packages</span>
          </summary>
          <div className="mt-3 space-y-2 opacity-60">
            {expiredPurchases.map((p, i) => (
              <div key={`${p.packageId}-expired-${i}`} className="rounded-2xl bg-white/40 p-4 ring-1 ring-[var(--border-soft)] dark:bg-white/[0.02]">
                <div className="font-semibold line-through">{p.title}</div>
                <p className="mt-0.5 text-xs font-medium text-secondary-token">
                  Expired {new Date(p.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
            ))}
          </div>
        </details>
      )}

      {isFree && activePurchases.length === 0 && (
        <p className="mt-5 text-sm font-medium text-secondary-token">
          No active packages.{" "}
          <Link href="/pricing" className="font-semibold text-[var(--accent-primary)] hover:underline">
            Browse course packages →
          </Link>
        </p>
      )}
    </section>
  );
}
