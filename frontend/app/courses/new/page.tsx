"use client";

import Link from "next/link";
import { ArrowLeft, BrainCircuit } from "lucide-react";
import { AnimatedPage } from "@/components/animations";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CourseGenerator } from "@/components/courses/CourseGenerator";
import { Nav } from "@/components/Nav";

export default function NewCoursePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-slate-950 dark:bg-[#07111f] dark:text-white">
      <div className="pointer-events-none absolute left-1/2 top-40 h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-violet-400/14 blur-3xl" />
      <Nav />
      <ProtectedRoute>
        <AnimatedPage className="relative mx-auto max-w-4xl px-4 py-14">
          <Link href="/courses" className="mb-8 inline-flex items-center gap-2 rounded-2xl bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:-translate-y-0.5 dark:bg-white/10 dark:text-white/80 dark:ring-white/10">
            <ArrowLeft size={15} /> My courses
          </Link>
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-violet-700 ring-1 ring-slate-200/80 backdrop-blur-xl dark:bg-white/10 dark:text-cyan-100 dark:ring-white/10">
              <BrainCircuit size={16} /> Custom course builder
            </div>
            <h1 className="mt-5 text-5xl font-semibold leading-[0.94] tracking-[-0.06em] text-slate-950 dark:text-white md:text-6xl">
              Build your program.
            </h1>
            <p className="mt-4 max-w-xl text-lg font-medium leading-8 text-slate-600 dark:text-white/58">
              Tell us your goal and we will generate a structured course with daily missions, a skill tree, and a calendar.
            </p>
          </div>
          <CourseGenerator />
        </AnimatedPage>
      </ProtectedRoute>
    </main>
  );
}
