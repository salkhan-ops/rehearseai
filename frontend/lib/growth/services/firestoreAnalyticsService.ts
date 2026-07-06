"use client";

// Real-data service — reads Firestore directly via the client SDK, the same pattern
// already used by frontend/lib/admin.ts (getRevenueTransactions, getChurnEvents, etc.)
// and by the existing /admin/revenue and /admin/churn pages. No backend endpoint needed;
// firestore.rules already grants admins broad collection reads (`allow read: if isAdmin()`
// or `... || isAdmin()`), same as those pages rely on.

import { collection, getDocs } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { buildDailyTrend, daysAgo, parseIso, startOfMonth, startOfWeek } from "../dateUtils";
import type { UsageSnapshot } from "../types";

export type UserDoc = { uid?: string; createdAt?: string; lastLoginAt?: string; planId?: string; status?: string };
export type SessionDoc = {
  userId: string;
  practiceType: string;
  status: "active" | "completed" | "abandoned";
  createdAt?: string;
  completedAt?: string;
  lastActivityAt?: string;
};
export type ReportDoc = {
  confidenceScore: number;
  clarityScore: number;
  persuasivenessScore: number;
  calmnessScore: number;
  structureScore: number;
};
export type AnalyticsDoc = { metrics?: { reasoningQuality?: number } };

export class FirestoreAnalyticsService {
  async loadUsers(): Promise<UserDoc[]> {
    const db = getFirebaseDb();
    if (!db) return [];
    const snap = await getDocs(collection(db, "users"));
    return snap.docs.map((d) => d.data() as UserDoc);
  }

  async loadSessions(): Promise<SessionDoc[]> {
    const db = getFirebaseDb();
    if (!db) return [];
    const snap = await getDocs(collection(db, "sessions"));
    return snap.docs.map((d) => d.data() as SessionDoc);
  }

  private async loadReports(): Promise<ReportDoc[]> {
    const db = getFirebaseDb();
    if (!db) return [];
    const snap = await getDocs(collection(db, "reports"));
    return snap.docs.map((d) => d.data() as ReportDoc);
  }

  private async loadAnalytics(): Promise<AnalyticsDoc[]> {
    const db = getFirebaseDb();
    if (!db) return [];
    const snap = await getDocs(collection(db, "analytics"));
    return snap.docs.map((d) => d.data() as AnalyticsDoc);
  }

  getSignupCounts(users: UserDoc[]) {
    const today = daysAgo(0);
    const week = startOfWeek();
    const month = startOfMonth();
    let signupsToday = 0;
    let signupsThisWeek = 0;
    let signupsThisMonth = 0;
    const createdDates: string[] = [];
    for (const u of users) {
      const d = parseIso(u.createdAt);
      if (u.createdAt) createdDates.push(u.createdAt);
      if (!d) continue;
      if (d >= today) signupsToday++;
      if (d >= week) signupsThisWeek++;
      if (d >= month) signupsThisMonth++;
    }
    return { signupsToday, signupsThisWeek, signupsThisMonth, signupsTrend: buildDailyTrend(createdDates, 30) };
  }

  getActiveUsers(sessions: SessionDoc[]) {
    const activeSince = (cutoff: Date) => {
      const userIds = new Set<string>();
      for (const s of sessions) {
        const last = parseIso(s.lastActivityAt || s.completedAt || s.createdAt);
        if (last && last >= cutoff) userIds.add(s.userId);
      }
      return userIds.size;
    };
    return { activeUsers7d: activeSince(daysAgo(7)), activeUsers30d: activeSince(daysAgo(30)) };
  }

  getInterviewFunnelCounts(sessions: SessionDoc[]) {
    const started = sessions.length;
    const completed = sessions.filter((s) => s.status === "completed").length;
    return {
      interviewsStarted: started,
      interviewsCompleted: completed,
      completionRate: started ? Math.round((completed / started) * 1000) / 10 : 0,
      interviewStartsTrend: buildDailyTrend(sessions.map((s) => s.createdAt), 30),
      interviewCompletionsTrend: buildDailyTrend(sessions.filter((s) => s.status === "completed").map((s) => s.completedAt), 30),
    };
  }

  async getUsageStats(sessions?: SessionDoc[]): Promise<UsageSnapshot> {
    const [sessionList, reports, analyticsList] = await Promise.all([
      sessions ? Promise.resolve(sessions) : this.loadSessions(),
      this.loadReports(),
      this.loadAnalytics(),
    ]);
    const completed = sessionList.filter((s) => s.status === "completed");

    const scenarioCounts = new Map<string, number>();
    for (const s of sessionList) scenarioCounts.set(s.practiceType, (scenarioCounts.get(s.practiceType) || 0) + 1);
    const scenarioBreakdown = Array.from(scenarioCounts.entries())
      .map(([practiceType, count]) => ({ practiceType, count }))
      .sort((a, b) => b.count - a.count);
    const mostPopularScenario = scenarioBreakdown[0]?.practiceType || "—";

    const durations = completed
      .map((s) => {
        const start = parseIso(s.createdAt);
        const end = parseIso(s.completedAt);
        if (!start || !end) return null;
        return (end.getTime() - start.getTime()) / 60000;
      })
      .filter((v): v is number => v !== null && v > 0 && v < 240);
    const avgInterviewDurationMinutes = durations.length ? Math.round((durations.reduce((s, v) => s + v, 0) / durations.length) * 10) / 10 : 0;

    const reportAverages = reports.map((r) => (r.confidenceScore + r.clarityScore + r.persuasivenessScore + r.calmnessScore + r.structureScore) / 5);
    const avgReportScore = reportAverages.length ? Math.round(reportAverages.reduce((s, v) => s + v, 0) / reportAverages.length) : 0;

    const reasoningScores = analyticsList.map((a) => a.metrics?.reasoningQuality).filter((v): v is number => typeof v === "number");
    const avgReasoningScore = reasoningScores.length ? Math.round(reasoningScores.reduce((s, v) => s + v, 0) / reasoningScores.length) : 0;

    const byUser = new Map<string, SessionDoc[]>();
    for (const s of sessionList) byUser.set(s.userId, [...(byUser.get(s.userId) || []), s]);
    const avgInterviewsPerUser = byUser.size ? Math.round((sessionList.length / byUser.size) * 10) / 10 : 0;

    let returningUsers = 0;
    for (const userSessions of byUser.values()) {
      const sorted = userSessions
        .map((s) => parseIso(s.createdAt))
        .filter((d): d is Date => !!d)
        .sort((a, b) => a.getTime() - b.getTime());
      if (sorted.length < 2) continue;
      const first = sorted[0];
      if (sorted.slice(1).some((d) => d.getTime() - first.getTime() <= 7 * 86400000)) returningUsers++;
    }
    const usersReturningWithin7DaysPct = byUser.size ? Math.round((returningUsers / byUser.size) * 1000) / 10 : 0;

    return {
      mostPopularScenario,
      scenarioBreakdown,
      avgInterviewDurationMinutes,
      avgReportScore,
      avgReasoningScore,
      usersReturningWithin7DaysPct,
      avgInterviewsPerUser,
      // No device/geo capture exists on session or user docs yet — placeholder until
      // client-side device/geo logging is added.
      mostUsedDevice: "Desktop · Chrome",
      mostCommonCountry: "United States",
      isDeviceCountryMock: true,
    };
  }
}
