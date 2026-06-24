"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Award, Bell, CalendarDays, Clock, Flame, PartyPopper, Share2, Target, TrendingUp, type LucideIcon } from "lucide-react";
import { AnimatedCard, AnimatedPage } from "@/components/animations";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CourseCalendar } from "@/components/courses/CourseCalendar";
import { ReasoningSkillTree } from "@/components/courses/ReasoningSkillTree";
import { Nav } from "@/components/Nav";
import { createPracticeSchedule, getCourse, startCourseSession } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { sessionHref } from "@/lib/routes";
import type { CourseBundle, CourseSession } from "@/lib/types";

export default function CourseDetailPage() {
  const params = useParams<{ id?: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params?.id || searchParams.get("id") || "";
  const { getToken, userId } = useAuth();
  const [bundle, setBundle] = useState<CourseBundle | null>(null);
  const [loadingMission, setLoadingMission] = useState<string | null>(null);
  const [routineSaved, setRoutineSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setError("Missing course id.");
      return;
    }
    getToken()
      .then((token) => getCourse(id, token))
      .then(setBundle)
      .catch(() => setError("Could not load this course."));
  }, [getToken, id]);

  const [shareCopied, setShareCopied] = useState(false);
  const nextMission = useMemo(() => bundle?.sessions.find((session) => !session.completed) || bundle?.sessions[0], [bundle]);
  const progress = bundle?.progress.totalSessions ? Math.round((bundle.progress.completedSessions / bundle.progress.totalSessions) * 100) : 0;
  const isCompleted = progress === 100 && (bundle?.progress.completedSessions ?? 0) > 0;

  function shareCompletion() {
    const text = `I just completed "${bundle?.course.title}" on RehearseAI — ${bundle?.progress.totalSessions} sessions, ready for anything. 🎯`;
    if (navigator.share) { navigator.share({ text, url: window.location.href }).catch(() => undefined); }
    else { navigator.clipboard.writeText(`${text}\n${window.location.href}`); setShareCopied(true); setTimeout(() => setShareCopied(false), 3000); }
  }

  async function startMission(session: CourseSession) {
    setLoadingMission(session.id);
    const token = await getToken();
    const response = await startCourseSession(session.id, token);
    router.push(sessionHref(response.sessionId, { courseSessionId: session.id }));
  }

  async function createRoutine() {
    if (!bundle) return;
    const first = nextMission || bundle.sessions[0];
    const token = await getToken();
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission().catch(() => undefined);
    }
    await createPracticeSchedule({
      userId,
      frequencyType: "daily",
      daysOfWeek: [],
      preferredTime: "20:00",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      enabled: true,
      categories: [first.practiceType],
      durationPreference: first.durationMinutes,
      reminderMinutesBefore: 15,
    }, token);
    setRoutineSaved(true);
  }

  if (!bundle) {
    return (
      <main className="min-h-screen bg-white dark:bg-[#07111f]">
        <Nav />
        <div className="px-4 py-20 text-center font-semibold text-slate-600 dark:text-white/60">{error || "Loading course..."}</div>
      </main>
    );
  }

  const stats: Array<{ icon: LucideIcon; label: string; value: string | number }> = [
    { icon: Flame, label: "Streak", value: bundle.progress.streak },
    { icon: TrendingUp, label: "Progress", value: `${progress}%` },
    { icon: Clock, label: "Weekly", value: `${bundle.course.weeklyHours}h` },
    { icon: CalendarDays, label: "Duration", value: `${bundle.course.durationDays}d` },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-slate-950 dark:bg-[#07111f] dark:text-white">
      <div className="pointer-events-none absolute right-0 top-20 h-[36rem] w-[36rem] rounded-full bg-cyan-300/12 blur-3xl" />
      <div className="pointer-events-none absolute left-0 top-80 h-[30rem] w-[30rem] rounded-full bg-violet-400/14 blur-3xl" />
      <Nav />
      <ProtectedRoute>
        <AnimatedPage className="relative mx-auto max-w-7xl px-4 py-14">
          {/* ── Course completion banner ──────────────────────────────── */}
          {isCompleted && (
            <section className="mb-6 rounded-[2.5rem] bg-gradient-to-br from-violet-900 via-[#1a0040] to-slate-900 p-8 text-white ring-1 ring-violet-700/40 shadow-[0_30px_80px_rgba(98,0,168,0.3)]">
              <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-violet-500/20 ring-2 ring-violet-400/40">
                  <Award size={40} className="text-yellow-300" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-center gap-2 sm:justify-start">
                    <PartyPopper size={18} className="text-yellow-300" />
                    <span className="text-sm font-bold uppercase tracking-[0.18em] text-violet-300">Course complete</span>
                  </div>
                  <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{bundle?.course.title}</h2>
                  <p className="mt-2 text-base text-white/70">You completed all {bundle?.progress.totalSessions} sessions. Your preparation is done — now go perform.</p>
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <button type="button" onClick={shareCompletion} className="inline-flex items-center gap-2 rounded-2xl bg-white/15 px-5 py-2.5 text-sm font-semibold hover:bg-white/20 transition">
                      <Share2 size={15} /> {shareCopied ? "Link copied!" : "Share achievement"}
                    </button>
                    <a href="/progress" className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-2.5 text-sm font-semibold hover:bg-violet-500 transition shadow-[0_8px_24px_rgba(98,0,168,0.35)]">
                      <TrendingUp size={15} /> View my progress
                    </a>
                    <a href="/courses" className="text-sm font-semibold text-white/60 underline underline-offset-4 hover:text-white transition">
                      Start another course
                    </a>
                  </div>
                </div>
              </div>
            </section>
          )}

          <section className="rounded-[2.5rem] bg-white/75 p-6 ring-1 ring-slate-200/80 backdrop-blur-2xl dark:bg-white/[0.07] dark:ring-white/10 md:p-8">
            <div className="grid gap-8 lg:grid-cols-[1fr_0.72fr] lg:items-end">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-700 dark:text-cyan-100/60">Pressure Training Program</p>
                <h1 className="mt-4 text-5xl font-semibold leading-[0.94] tracking-[-0.06em] text-slate-950 dark:text-white md:text-7xl">{bundle.course.title}</h1>
                <p className="mt-5 max-w-3xl text-lg font-medium leading-8 text-slate-600 dark:text-white/58">{bundle.course.goal}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {stats.map(({ icon: Icon, label, value }) => (
                  <AnimatedCard key={label} className="rounded-[1.5rem] bg-white/70 p-4 ring-1 ring-slate-200/80 dark:bg-white/[0.06] dark:ring-white/10">
                    <Icon className="text-violet-700 dark:text-cyan-100" size={20} />
                    <div className="mt-3 text-2xl font-semibold tracking-[-0.04em]">{value}</div>
                    <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-white/42">{label}</div>
                  </AnimatedCard>
                ))}
              </div>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {nextMission && (
                <button onClick={() => startMission(nextMission)} disabled={loadingMission === nextMission.id} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#6200a8] px-6 py-4 text-lg font-bold text-white shadow-[0_18px_44px_rgba(98,0,168,0.25)] transition hover:-translate-y-0.5 disabled:opacity-60">
                  <Target size={20} /> {loadingMission === nextMission.id ? "Opening mission..." : "Start next mission"}
                </button>
              )}
              <button onClick={createRoutine} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/80 px-6 py-4 font-bold text-slate-800 ring-1 ring-slate-200 dark:bg-white/10 dark:text-white dark:ring-white/10">
                <Bell size={18} /> {routineSaved ? "Reminder routine saved" : "Add daily reminders"}
              </button>
            </div>
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <CourseCalendar sessions={bundle.sessions} onStart={startMission} />
            <ReasoningSkillTree skills={bundle.course.targetSkills} growth={bundle.progress.growthMetrics as Record<string, number | string>} />
          </div>

          <section className="mt-6 rounded-[2rem] bg-white/75 p-5 ring-1 ring-slate-200/80 backdrop-blur-2xl dark:bg-white/[0.07] dark:ring-white/10">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-cyan-100/60">Course modules</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {bundle.modules.map((module) => (
                <div key={module.id} className="rounded-[1.5rem] bg-white/70 p-5 ring-1 ring-slate-200/80 dark:bg-white/[0.06] dark:ring-white/10">
                  <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-white/42">Block {module.order}</div>
                  <div className="mt-2 text-xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">{module.title}</div>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-600 dark:text-white/58">{module.objective}</p>
                </div>
              ))}
            </div>
          </section>
        </AnimatedPage>
      </ProtectedRoute>
    </main>
  );
}
