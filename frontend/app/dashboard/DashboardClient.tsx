"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Bell, BookOpenCheck, BrainCircuit, CalendarClock, Flame, Target, TrendingUp, type LucideIcon } from "lucide-react";
import { AnimatedCard, AnimatedPage, StaggeredGrid } from "@/components/animations";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Nav } from "@/components/Nav";
import { LanguageSelector } from "@/components/settings/LanguageSelector";
import { DailyChallengeCard } from "@/components/scheduling/DailyChallengeCard";
import { PracticeRoutinePanel } from "@/components/scheduling/PracticeRoutinePanel";
import { generateReport, getDailyChallenge, getPracticeHistory, getPracticeSchedules, getUserCourses, getUserHintSummary, getUserSessions, updatePracticeSchedule } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { courseHref, reportHref } from "@/lib/routes";
import type { LanguageCode } from "@/lib/languages";
import type { Course, DailyChallenge, HintSummary, PracticeHistory, PracticeSchedule, Session } from "@/lib/types";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [schedules, setSchedules] = useState<PracticeSchedule[]>([]);
  const [history, setHistory] = useState<PracticeHistory[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [hintSummary, setHintSummary] = useState<HintSummary | null>(null);
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const { getToken, profile, updateLanguagePreferences, userId } = useAuth();
  const [practiceLanguage, setPracticeLanguage] = useState<LanguageCode>(profile?.preferredPracticeLanguage || "en");
  const [feedbackLanguage, setFeedbackLanguage] = useState<LanguageCode>(profile?.preferredFeedbackLanguage || "en");

  useEffect(() => {
    if (profile?.preferredPracticeLanguage) setPracticeLanguage(profile.preferredPracticeLanguage);
    if (profile?.preferredFeedbackLanguage) setFeedbackLanguage(profile.preferredFeedbackLanguage);
  }, [profile?.preferredFeedbackLanguage, profile?.preferredPracticeLanguage]);

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
          body: `Today’s challenge: ${schedule.categories[0] || "cognitive performance"} practice.`,
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
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-5xl font-semibold tracking-[-0.045em] text-slate-900 dark:text-white md:text-6xl">Dashboard</h1>
            <p className="mt-4 text-lg font-medium text-secondary-token">Your daily cognitive gym: routines, reminders, instant challenges, and pressure-training consistency.</p>
          </div>
          <Link href="/pricing" className="rounded-2xl bg-[#6200a8] px-5 py-3 text-center font-semibold text-white shadow-[0_14px_30px_rgba(98,0,168,0.24)]">Upgrade</Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {statCards.map(({ icon: Icon, label, value }) => (
            <AnimatedCard key={label} className="rounded-[1.5rem] surface-low p-5">
              <Icon className="text-[var(--accent-primary)]" size={22} />
              <div className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-primary-token">{value}</div>
              <div className="mt-1 text-sm font-semibold text-tertiary-token">{label}</div>
            </AnimatedCard>
          ))}
        </div>

        <div className="mt-6 rounded-[1.75rem] surface-low p-5">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent-primary)]">Guided reasoning</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-primary-token">Beginner coaching dependency</h2>
              <p className="mt-2 max-w-2xl font-medium leading-7 text-secondary-token">Hints are tracked so the product can reduce support as independent reasoning improves.</p>
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

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <DailyChallengeCard challenge={challenge} />
          <PracticeRoutinePanel onCreated={(schedule) => setSchedules((current) => [schedule, ...current])} />
        </div>

        <div className="mt-6 rounded-[1.75rem] surface-low p-5">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent-primary)]">Structured cognitive courses</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-primary-token">Build your cognitive strength.</h2>
              <p className="mt-2 max-w-2xl font-medium leading-7 text-secondary-token">Generate a multi-day reasoning program with calendar missions, pressure progression, reminders, and a skill tree.</p>
            </div>
            <Link href="/courses" className="rounded-2xl bg-[#6200a8] px-5 py-3 text-center font-semibold text-white shadow-[0_14px_30px_rgba(98,0,168,0.24)]">Open courses</Link>
          </div>
          {courses.length > 0 && (
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {courses.slice(0, 3).map((course) => (
                <Link key={course.id} href={courseHref(course.id)} className="rounded-[1.4rem] surface-medium p-4 transition hover:-translate-y-0.5">
                  <div className="text-xs font-bold uppercase tracking-[0.14em] text-tertiary-token">{course.durationDays} days · {course.difficulty}</div>
                  <div className="mt-2 text-lg font-semibold tracking-[-0.035em] text-primary-token">{course.title}</div>
                  <p className="mt-2 line-clamp-2 text-sm font-medium leading-6 text-secondary-token">{course.goal}</p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6">
          <LanguageSelector
            practiceLanguage={practiceLanguage}
            feedbackLanguage={feedbackLanguage}
            onPracticeLanguageChange={(language) => {
              setPracticeLanguage(language);
              updateLanguagePreferences(language, feedbackLanguage).catch(() => undefined);
            }}
            onFeedbackLanguageChange={(language) => {
              setFeedbackLanguage(language);
              updateLanguagePreferences(practiceLanguage, language).catch(() => undefined);
            }}
          />
        </div>

        <div className="mt-6 rounded-[1.75rem] surface-low p-4">
          <div className="mb-4 flex items-center justify-between gap-3 px-2">
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-primary-token">Upcoming practice</h2>
            <span className="inline-flex items-center gap-2 rounded-full surface-medium px-3 py-2 text-xs font-semibold text-secondary-token"><Bell size={14} /> browser reminders</span>
          </div>
          {schedules.length === 0 ? (
            <p className="p-4 font-medium text-secondary-token">No routine yet. Create one above to make training automatic.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {schedules.map((schedule) => (
                <div key={schedule.id} className="rounded-[1.5rem] surface-medium p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold capitalize text-primary-token">{schedule.frequencyType.replace("_", " ")}</div>
                    <button onClick={async () => {
                      const token = await getToken();
                      const updated = await updatePracticeSchedule(schedule.id, { enabled: !schedule.enabled }, token);
                      setSchedules((current) => current.map((item) => item.id === updated.id ? updated : item));
                    }} className="rounded-full surface-low px-3 py-1 text-xs font-semibold text-secondary-token">
                      {schedule.enabled ? "Snooze" : "Resume"}
                    </button>
                  </div>
                  <p className="mt-2 text-sm font-medium leading-6 text-secondary-token">{schedule.categories.join(", ")} · {schedule.durationPreference} min · {schedule.preferredTime}</p>
                  {schedule.nextReminderAt && <p className="mt-2 text-xs font-semibold text-tertiary-token">Next reminder: {new Date(schedule.nextReminderAt).toLocaleString()}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 rounded-[1.75rem] surface-low p-4">
          <h2 className="mb-4 px-2 text-2xl font-semibold tracking-[-0.04em] text-primary-token">Previous sessions</h2>
          {sessions.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-2xl font-semibold tracking-[-0.03em] text-slate-900 dark:text-white">No sessions yet</div>
              <Link href="/practice" className="mt-5 inline-flex rounded-2xl bg-[#6200a8] px-5 py-3 font-semibold text-white">Start your first rehearsal</Link>
            </div>
          ) : (
            <StaggeredGrid className="divide-y divide-slate-100 dark:divide-white/10">
              {sessions.map((session) => (
                <AnimatedCard key={session.id} className="grid gap-3 py-4 md:grid-cols-[1.5fr_1fr_1fr_1fr_auto] md:items-center">
                  <div className="font-semibold text-slate-900 dark:text-white">{session.practiceType}</div>
                  <div className="text-sm font-medium text-slate-500 dark:text-white/55">{session.difficulty}</div>
                  <div className="text-sm font-medium text-slate-500 dark:text-white/55">{new Date(session.createdAt).toLocaleDateString()}</div>
                  <div className="text-sm font-semibold text-slate-700 dark:text-white/70">Turns: {session.turnCount}</div>
                  <button onClick={() => openReport(session)} className="rounded-2xl bg-slate-50 px-4 py-2 text-center text-sm font-semibold text-slate-700 ring-1 ring-slate-200 dark:bg-white/10 dark:text-white/70 dark:ring-white/10">
                    {loadingId === session.id ? "Opening..." : "Report"}
                  </button>
                </AnimatedCard>
              ))}
            </StaggeredGrid>
          )}
        </div>
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
