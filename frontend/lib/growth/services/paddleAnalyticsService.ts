"use client";

// Real-data service — reads the same Firestore collections as /admin/revenue and
// /admin/churn (revenueTransactions, churnEvents), and reuses the existing
// getFinanceStats() estimate from frontend/lib/admin.ts for MRR/ARR/subscriber counts
// rather than recomputing that logic here.

import { collection, getDocs } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { getFinanceStats } from "@/lib/admin";
import { buildDailySumTrend, buildDailyTrend, daysAgo, parseIso, startOfMonth } from "../dateUtils";
import type { RevenueSnapshot } from "../types";

type RevenueTxnDoc = { amount: number; status: string; eventType: string; createdAt?: string };
type ChurnDoc = { createdAt?: string };

export type PaddleRevenueSnapshot = RevenueSnapshot & { revenueToday: number; revenueThisMonth: number; paidSubscribers: number };

export class PaddleAnalyticsService {
  private async loadTransactions(): Promise<RevenueTxnDoc[]> {
    const db = getFirebaseDb();
    if (!db) return [];
    const snap = await getDocs(collection(db, "revenueTransactions"));
    return snap.docs.map((d) => d.data() as RevenueTxnDoc);
  }

  private async loadChurnEvents(): Promise<ChurnDoc[]> {
    const db = getFirebaseDb();
    if (!db) return [];
    const snap = await getDocs(collection(db, "churnEvents"));
    return snap.docs.map((d) => d.data() as ChurnDoc);
  }

  async getSnapshot(): Promise<PaddleRevenueSnapshot> {
    const [txns, churnEvents, finance] = await Promise.all([this.loadTransactions(), this.loadChurnEvents(), getFinanceStats()]);
    const paid = txns.filter((t) => t.status === "paid");
    const month = startOfMonth();

    const sumSince = (from: Date) =>
      paid.reduce((sum, t) => {
        const d = parseIso(t.createdAt);
        return d && d >= from ? sum + (t.amount || 0) : sum;
      }, 0);

    const conversionTxns = txns.filter((t) => t.eventType === "subscription.created" || t.eventType === "subscription.activated");
    const conversions = conversionTxns.length;
    const churnThisMonth = churnEvents.filter((c) => {
      const d = parseIso(c.createdAt);
      return d && d >= month;
    }).length;

    return {
      mrr: finance.estimatedMrr,
      arr: finance.estimatedArr,
      subscriptions: finance.totalSubscribers,
      paidSubscribers: finance.totalSubscribers,
      // Paddle webhooks don't currently record a distinct "trial" status — no trial
      // tracking field exists in userEntitlements/revenueTransactions today.
      trials: 0,
      isTrialsMock: true,
      conversions,
      conversionsTrend: buildDailyTrend(conversionTxns.map((t) => t.createdAt), 30),
      churn: churnThisMonth,
      revenueTrend: buildDailySumTrend(paid.map((t) => ({ date: t.createdAt, amount: t.amount || 0 })), 30),
      // Approximation: daily subscription-related revenue events, not a true MRR
      // time-series (no MRR snapshot is stored anywhere) — good enough for a trend shape.
      mrrTrend: buildDailySumTrend(
        paid.filter((t) => t.eventType.startsWith("subscription")).map((t) => ({ date: t.createdAt, amount: t.amount || 0 })),
        30
      ),
      revenueToday: sumSince(daysAgo(0)),
      revenueThisMonth: sumSince(month),
    };
  }
}
