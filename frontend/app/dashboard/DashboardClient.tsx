"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Bell, BookOpenCheck, BrainCircuit, CalendarClock, Clock, ExternalLink, Flame, Target, TrendingUp, type LucideIcon } from "lucide-react";
import { AnimatedCard, AnimatedPage, StaggeredGrid } from "@/components/animations";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Nav } from "@/components/Nav";
import { DailyChallengeCard } from "@/components/scheduling/DailyChallengeCard";
import { PracticeRoutinePanel } from "@/components/scheduling/PracticeRoutinePanel";
import { generateReport, getDailyChallenge, getPracticeHistory, getPracticeSchedules, getUserCourses, getUserHintSummary, getUserSessions, updatePracticeSchedule } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { courseHref, reportHref } from "@/lib/routes";
import type { Course, DailyChallenge, HintSummary, PracticeHistory, PracticeSchedule, Session } from "@/lib/types";

type Tab = "today" | "schedule" | "courses" | "history";

const tabs: Array<{ id: Tab; label: string }> = [
  { id: "today", label: "Today" },
  { id: "schedule", label: "Schedule" },
  { id: "courses", label: "Courses" },
  { id: "history", label: "History" },
];

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>("today");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [schedules, setSchedules] = useState<PracticeSchedule[]>([]);
  const [history, setHistory] = useState<PracticeHistory[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [hintSummary, setHintSummary] = useState<HintSummary | null>(null);
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const { getToken, userId } = useAuth();

  useEffect(() => {
    getToken().then((token: string | null) => Promise.all([
      getUserSessions(userId, token),
      getPracticeSchedules(userId, token),
      getPracticeHistory(userId, token),
      getDailyChallenge(userId, token),
      getUserCourses(userId, token),
      getUserHintSummary(userId, token),
    ])).then(([nextSessions, nextSchedules, nextHistory, nextChallenge, nextCourses, nextHintSummary]) => {
      setSessions(nextSessions);
      setSchedules(nextSchedules);
      setHistory(nextHistory);
      setChallenge(nextChallenge);
      setCourses(nextCourses);
      setHintSummary(nextHintSummary);
    }).catch(() => {
      setSessions([]);
      setSchedules([]);
      setHistory([]);
    });
  }, [getToken, userId]);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") return;
    const timers = schedules.filter((item) => item.enabled && item.nextReminderAt).map((schedule) => {
      const delay = new Date(schedule.nextReminderAt || "").getTime() - Date.now();
      if (delay < 0 || delay > 24 * 60 * 60 * 1000) return null;
      return window.setTimeout(() => {
        const notification = new Notification("Your pressure training session starts soon.", {
          body: `Today's challenge: ${schedule.categories[0] || "cognitive performance"} practice.`,
        });
        notification.onclick = () => router.push("/dashboard");
      }, delay);
    }).filter(Boolean) as number[];
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [router, schedules]);

  const completedHistory = history.filter((item) => item.completed || item.completedAt);
  const weeklyCompletionRate = schedules.length ? Math.min(100, Math.round((completedHistory.length / Math.max(1, schedules.length * 7)) * 100)) : 0;
  const streak = Math.max(0, ...history.map((item) => item.streakDay || 0), sessions.length ? Math.min(sessions.length, 7) : 0);

  const statCards: Array<{ icon: LucideIcon; label: string; value: string }> = [
    { icon: Flame, label: "Streak", value: `${streak} days` },
    { icon: TrendingUp, label: "Consistency", value: `${weeklyCompletionRate}%` },
    { icon: CalendarClock, label: "Routines", value: String(schedules.length) },
    { icon: BookOpenCheck, label: "Courses", value: String(courses.length) },
    { icon: Target, label: "Sessions", value: String(sessions.length) },
    { icon: BrainCircuit, label: "Hints used", value: `${hintSummary?.hintsViewed || 0}/${hintSummary?.hintsReceived || 0}` },
  ];

  async function openReport(session: Session) {
    setLoadingId(session.id);
    const token = await getToken();
    const report = await generateReport(session.id, token);
    router.push(reportHref(report.id));
  }

  return (
    <main className="cog-bg min-h-screen text-primary-token">
      <Nav />
      <ProtectedRoute>
        <AnimatedPage className="mx-auto max-w-6xl px-4 py-16">
          {searchParams.get("admin") === "denied" && (
            <div className="mb-5 rounded-2xl bg-rose-50 p-4 font-semibold text-rose-700 ring-1 ring-rose-100">You do not have admin access.</div>
          )}

          {/* Header */}
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="text-5xl font-semibold tracking-[-0.045em] text-slate-900 dark:text-white md:text-6xl">Dashboard</h1>
              <p className="mt-4 text-lg font-medium text-secondary-token">Your training overview — routines, history, and active courses.</p>
            </div>
            <Link href="/pricing" className="rounded-2xl bg-[#6200a8] px-5 py-3 text-center font-semibold text-white shadow-[0_14px_30px_rgba(98,0,168,0.24)]">Upgrade</Link>
          </div>

          {/* Stat cards — always visible */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {statCards.map(({ icon: Icon, label, value }) => (
              <AnimatedCard key={label} className="rounded-[1.5rem] surface-low p-5">
                <Icon className="text-[var(--accent-primary)]" size={22} />
                <div className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-primary-token">{value}</div>
                <div className="mt-1 text-sm font-semibold text-tertiary-token">{label}</div>
              </AnimatedCard>
            ))}
          </div>

          {/* Tabs */}
          <div className="mt-8 flex gap-1 rounded-2xl surface-low p-1.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${activeTab === tab.id ? "bg-[#6200a8] text-white shadow-[0_6px_20px_rgba(98,0,168,0.25)]" : "text-secondary-token hover:text-primary-token"}`}
              >
                {tab.label}
                {tab.id === "schedule" && schedules.length > 0 && (
                  <span className="ml-1.5 inline-flex size-4 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">{schedules.length}</span>
                )}
                {tab.id === "history" && sessions.length > 0 && (
                  <span className="ml-1.5 inline-flex size-4 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">{sessions.length}</span>
                )}
              </button>
            ))}
          </div>

          {/* ── Today tab ── */}
          {activeTab === "today" && (
            <div className="mt-6 space-y-6">
              <div className="grid gap-4 lg:grid-cols-2">
                <DailyChallengeCard challenge={challenge} />
                <PracticeRoutinePanel onCreated={(schedule) => setSchedules((current) => [schedule, ...current])} />
              </div>

              {/* Coaching insights — only shown when user has used hints */}
              {(hintSummary?.hintsReceived ?? 0) > 0 && (
                <div className="rounded-[1.75rem] surface-low p-5">
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent-primary)]">Coaching insights</p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-primary-token">Reasoning support usage</h2>
                      <p className="mt-2 max-w-xl font-medium leading-7 text-secondary-token">Tracks how often you use hints so you can measure growing independence.</p>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="rounded-2xl surface-medium p-4">
                        <div className="text-2xl font-semibold text-primary-token">{hintSummary?.hintsFollowedRate || 0}%</div>
                        <div className="mt-1 text-xs font-semibold text-tertiary-token">viewed</div>
                      </div>
                      <div className="rounded-2xl surface-medium p-4">
                        <div className="text-2xl font-semibold capitalize text-primary-token">{hintSummary?.coachingDependency || "low"}</div>
                        <div className="mt-1 text-xs font-semibold text-tertiary-token">dependency</div>
                      </div>
                      <div className="rounded-2xl surface-medium p-4">
                        <div className="text-2xl font-semibold text-primary-token">{hintSummary?.highUrgencyHints || 0}</div>
                        <div className="mt-1 text-xs font-semibold text-tertiary-token">urgent</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Schedule tab ── */}
          {activeTab === "schedule" && (
            <div className="mt-6 space-y-6">
              <div className="rounded-[1.75rem] surface-low p-5">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <h2 className="text-2xl font-semibold tracking-[-0.04em] text-primary-token">Upcoming practice</h2>
                  <span className="inline-flex items-center gap-2 rounded-full surface-medium px-3 py-2 text-xs font-semibold text-secondary-token">
                    <Bell size={14} /> browser reminders
                  </span>
                </div>
                {schedules.length === 0 ? (
                  <p className="p-4 font-medium text-secondary-token">No routine yet. Go to the Today tab and create one to make training automatic.</p>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {schedules.map((schedule) => (
                      <div key={schedule.id} className="rounded-[1.5rem] surface-medium p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-semibold capitalize text-primary-token">{schedule.frequencyType.replace(/_/g, " ")}</div>
                          <button
                            type="button"
                            onClick={async () => {
                              const token = await getToken();
                              const updated = await updatePracticeSchedule(schedule.id, { enabled: !schedule.enabled }, token);
                              setSchedules((current) => current.map((item) => item.id === updated.id ? updated : item));
                            }}
                            className="rounded-full surface-low px-3 py-1 text-xs font-semibold text-secondary-token"
                          >
                            {schedule.enabled ? "Snooze" : "Resume"}
                          </button>
                        </div>
                        <p className="mt-2 text-sm font-medium leading-6 text-secondary-token">
                          {schedule.categories.join(", ")} · {schedule.durationPreference} min · {schedule.preferredTime}
                        </p>
                        {schedule.nextReminderAt && (
                          <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-tertiary-token">
                            <Clock size={12} /> Next: {new Date(schedule.nextReminderAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Courses tab ── */}
          {activeTab === "courses" && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-semibold tracking-[-0.04em] text-primary-token">Active courses</h2>
                <div className="flex gap-2">
                  <Link href="/courses/templates" className="rounded-2xl surface-low px-4 py-2 text-sm font-semibold text-secondary-token ring-1 ring-[var(--border-soft)] transition hover:-translate-y-0.5">
                    Browse paths
                  </Link>
                  <Link href="/courses/new" className="rounded-2xl bg-[#6200a8] px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5">
                    + New course
                  </Link>
                </div>
              </div>
              {courses.length === 0 ? (
                <div className="rounded-[1.75rem] surface-low p-10 text-center">
                  <p className="text-xl font-semibold text-primary-token">No active courses</p>
                  <p className="mt-2 font-medium text-secondary-token">Browse pre-built paths or create a custom program.</p>
                  <div className="mt-6 flex justify-center gap-3">
                    <Link href="/courses/templates" className="rounded-2xl bg-[#6200a8] px-5 py-3 font-semibold text-white">Browse training paths</Link>
                    <Link href="/courses/new" className="rounded-2xl surface-medium px-5 py-3 font-semibold text-primary-token ring-1 ring-[var(--border-soft)]">Create custom</Link>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {courses.map((course) => (
                    <Link key={course.id} href={courseHref(course.id)} className="rounded-[1.75rem] surface-low p-5 transition hover:-translate-y-0.5">
                      <div className="text-xs font-bold uppercase tracking-[0.14em] text-tertiary-token">{course.durationDays} days · {course.difficulty}</div>
                      <div className="mt-2 text-lg font-semibold tracking-[-0.035em] text-primary-token">{course.title}</div>
                      <p className="mt-2 line-clamp-2 text-sm font-medium leading-6 text-secondary-token">{course.goal}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── History tab ── */}
          {activeTab === "history" && (
            <div className="mt-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <h2 className="text-2xl font-semibold tracking-[-0.04em] text-primary-token">Previous sessions</h2>
                <Link href="/history" className="inline-flex items-center gap-1.5 rounded-2xl surface-low px-4 py-2 text-sm font-semibold text-secondary-token ring-1 ring-[var(--border-soft)] transition hover:-translate-y-0.5">
                  Full history <ExternalLink size={13} />
                </Link>
              </div>
              {sessions.length === 0 ? (
                <div className="rounded-[1.75rem] surface-low p-10 text-center">
                  <div className="text-2xl font-semibold tracking-[-0.03em] text-primary-token">No sessions yet</div>
                  <Link href="/practice" className="mt-5 inline-flex rounded-2xl bg-[#6200a8] px-5 py-3 font-semibold text-white">Start your first rehearsal</Link>
                </div>
              ) : (
                <div className="rounded-[1.75rem] surface-low p-4">
                  <StaggeredGrid className="divide-y divide-slate-100 dark:divide-white/10">
                    {sessions.slice(0, 10).map((session) => (
                      <AnimatedCard key={session.id} className="grid gap-3 py-4 md:grid-cols-[1.5fr_1fr_1fr_1fr_auto] md:items-center">
                        <div className="font-semibold text-primary-token">{session.practiceType}</div>
                        <div className="text-sm font-medium text-secondary-token">{session.difficulty}</div>
                        <div className="text-sm font-medium text-secondary-token">{new Date(session.createdAt).toLocaleDateString()}</div>
                        <div className="text-sm font-semibold text-primary-token">Turns: {session.turnCount}</div>
                        <button
                          type="button"
                          onClick={() => openReport(session)}
                          className="rounded-2xl surface-medium px-4 py-2 text-center text-sm font-semibold text-primary-token ring-1 ring-[var(--border-soft)]"
                        >
                          {loadingId === session.id ? "Opening..." : "Report"}
                        </button>
                      </AnimatedCard>
                    ))}
                  </StaggeredGrid>
                  {sessions.length > 10 && (
                    <div className="mt-4 text-center">
                      <Link href="/history" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent-primary)] underline underline-offset-2">
                        View all {sessions.length} sessions <ExternalLink size={13} />
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </AnimatedPage>
      </ProtectedRoute>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#f4f8fc] dark:bg-[#0e1020]"><Nav /><div className="px-4 py-12 text-center font-semibold text-slate-600">Loading dashboard...</div></main>}>
      <DashboardContent />
    </Suspense>
  );
}
