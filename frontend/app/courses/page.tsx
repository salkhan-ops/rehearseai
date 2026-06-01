"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BrainCircuit, CalendarDays, Flame, Target, type LucideIcon } from "lucide-react";
import { AnimatedCard, AnimatedPage, StaggeredGrid } from "@/components/animations";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CourseGenerator } from "@/components/courses/CourseGenerator";
import { Nav } from "@/components/Nav";
import { getCourse, getUserCourses } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { courseHref } from "@/lib/routes";
import type { Course, CourseBundle } from "@/lib/types";

export default function CoursesPage() {
  const { getToken, userId } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseBundles, setCourseBundles] = useState<CourseBundle[]>([]);

  useEffect(() => {
    getToken()
      .then(async (token) => {
        const nextCourses = await getUserCourses(userId, token);
        setCourses(nextCourses);
        const bundles = await Promise.all(nextCourses.slice(0, 12).map((course) => getCourse(course.id, token).catch(() => null)));
        setCourseBundles(bundles.filter(Boolean) as CourseBundle[]);
      })
      .catch(() => {
        setCourses([]);
        setCourseBundles([]);
      });
  }, [getToken, userId]);

  const heroStats: Array<{ icon: LucideIcon; label: string; copy: string }> = [
    { icon: Flame, label: "Streaks", copy: "habit loop" },
    { icon: CalendarDays, label: "Calendar", copy: "daily missions" },
    { icon: Target, label: "Skills", copy: "growth map" },
  ];
  const activeBundles = courseBundles.filter((bundle) => bundle.progress.completedSessions < bundle.progress.totalSessions);
  const completedBundles = courseBundles.filter((bundle) => bundle.progress.completedSessions >= bundle.progress.totalSessions && bundle.progress.totalSessions > 0);

  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-slate-950 dark:bg-[#07111f] dark:text-white">
      <div className="pointer-events-none absolute left-1/2 top-40 h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-violet-400/14 blur-3xl" />
      <Nav />
      <ProtectedRoute>
        <AnimatedPage className="relative mx-auto max-w-7xl px-4 py-14">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-violet-700 ring-1 ring-slate-200/80 backdrop-blur-xl dark:bg-white/10 dark:text-cyan-100 dark:ring-white/10">
                <BrainCircuit size={16} /> Structured Cognitive Courses
              </div>
              <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[0.94] tracking-[-0.06em] text-slate-950 dark:text-white md:text-7xl">
                Train your reasoning daily.
              </h1>
              <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-slate-600 dark:text-white/58">
                Multi-day pressure programs that develop concise thinking, evidence use, composure, persuasion, and decision-making under stress.
              </p>
              <Link href="/courses/templates" className="mt-7 inline-flex rounded-2xl bg-[#6200a8] px-6 py-4 font-bold text-white shadow-[0_18px_44px_rgba(98,0,168,0.25)]">
                Choose a Training Path
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {heroStats.map(({ icon: Icon, label, copy }) => (
                <AnimatedCard key={label} className="rounded-[1.5rem] bg-white/75 p-5 ring-1 ring-slate-200/80 backdrop-blur-xl dark:bg-white/[0.07] dark:ring-white/12">
                  <Icon className="text-violet-700 dark:text-cyan-100" size={24} />
                  <div className="mt-5 text-xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">{label}</div>
                  <div className="mt-1 text-sm font-semibold text-slate-500 dark:text-white/42">{copy}</div>
                </AnimatedCard>
              ))}
            </div>
          </div>

          <div className="mt-10">
            <CourseGenerator />
          </div>

          <section className="mt-10">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-3xl font-semibold tracking-[-0.05em] text-slate-950 dark:text-white">Active courses</h2>
              <span className="rounded-full bg-violet-50 px-4 py-2 text-sm font-bold text-violet-700 dark:bg-white/10 dark:text-cyan-100">{courses.length} programs</span>
            </div>
            {courses.length === 0 ? (
              <div className="rounded-[2rem] bg-white/70 p-8 text-center ring-1 ring-slate-200/80 dark:bg-white/[0.07] dark:ring-white/12">
                <div className="text-2xl font-semibold tracking-[-0.04em]">No course yet</div>
                <p className="mx-auto mt-2 max-w-xl font-medium leading-7 text-slate-600 dark:text-white/58">Generate your first program above. It will create a calendar, daily missions, and a skill tree.</p>
              </div>
            ) : (
              <StaggeredGrid className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {(activeBundles.length ? activeBundles.map((bundle) => bundle.course) : courses).map((course) => {
                  const bundle = courseBundles.find((item) => item.course.id === course.id);
                  const percent = bundle?.progress.totalSessions ? Math.round((bundle.progress.completedSessions / bundle.progress.totalSessions) * 100) : 0;
                  return (
                  <AnimatedCard key={course.id} className="group rounded-[2rem] bg-white/75 p-5 ring-1 ring-slate-200/80 backdrop-blur-xl dark:bg-white/[0.07] dark:ring-white/12">
                    <Link href={courseHref(course.id)} className="block">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700 dark:text-cyan-100/60">{course.durationDays} days · {course.difficulty}</div>
                          <h3 className="mt-3 text-2xl font-semibold tracking-[-0.045em] text-slate-950 dark:text-white">{course.title}</h3>
                        </div>
                        <ArrowRight className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-violet-700 dark:text-white/30" />
                      </div>
                      <p className="mt-4 text-sm font-medium leading-6 text-slate-600 dark:text-white/58">{course.goal}</p>
                      <div className="mt-5 h-2 rounded-full bg-slate-100 dark:bg-white/10"><span className="block h-2 rounded-full bg-gradient-to-r from-cyan-300 to-violet-500" style={{ width: `${percent}%` }} /></div>
                      <div className="mt-5 flex flex-wrap gap-2">
                        {course.targetSkills.slice(0, 3).map((skill) => (
                          <span key={skill} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-white/10 dark:text-white/60">{skill}</span>
                        ))}
                      </div>
                    </Link>
                  </AnimatedCard>
                );})}
              </StaggeredGrid>
            )}
          </section>

          <section className="mt-10">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-3xl font-semibold tracking-[-0.05em] text-slate-950 dark:text-white">Completed courses</h2>
              <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-100">{completedBundles.length} completed</span>
            </div>
            <div className="rounded-[2rem] bg-white/70 p-6 ring-1 ring-slate-200/80 dark:bg-white/[0.07] dark:ring-white/12">
              {completedBundles.length === 0 ? (
                <p className="font-medium leading-7 text-slate-600 dark:text-white/58">Completed programs will appear here once every mission in a course is finished.</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {completedBundles.map((bundle) => (
                    <Link key={bundle.course.id} href={courseHref(bundle.course.id)} className="rounded-[1.4rem] bg-white/70 p-4 ring-1 ring-slate-200/80 transition hover:-translate-y-0.5 dark:bg-white/[0.06] dark:ring-white/10">
                      <div className="text-lg font-semibold tracking-[-0.035em]">{bundle.course.title}</div>
                      <p className="mt-1 text-sm font-medium text-slate-600 dark:text-white/58">{bundle.progress.completedSessions} missions completed · streak {bundle.progress.streak}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        </AnimatedPage>
      </ProtectedRoute>
    </main>
  );
}
