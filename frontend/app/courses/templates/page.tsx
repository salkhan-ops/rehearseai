"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatedPage, StaggeredGrid } from "@/components/animations";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CourseEnrollmentModal } from "@/components/courses/CourseEnrollmentModal";
import { CourseTemplateCard } from "@/components/courses/CourseTemplateCard";
import { Nav } from "@/components/Nav";
import { getCourseTemplates } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { CourseTemplate } from "@/lib/types";

const filters = ["All", "Interview", "Public Speaking", "Reasoning", "Negotiation", "Leadership", "Difficult Conversations", "Short Sprint", "Long Program"];

export default function CourseTemplatesPage() {
  const { getToken } = useAuth();
  const [templates, setTemplates] = useState<CourseTemplate[]>([]);
  const [selected, setSelected] = useState("All");
  const [enrolling, setEnrolling] = useState<CourseTemplate | null>(null);
  useEffect(() => {
    getToken().then((token) => getCourseTemplates(token)).then(setTemplates).catch(() => setTemplates([]));
  }, [getToken]);
  const visible = useMemo(() => templates.filter((template) => {
    if (selected === "All") return true;
    if (selected === "Short Sprint") return template.durationDays <= 14;
    if (selected === "Long Program") return template.durationDays >= 56;
    if (selected === "Negotiation") return template.title.toLowerCase().includes("negotiation");
    return template.category === selected;
  }), [selected, templates]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-slate-950 dark:bg-[#07111f] dark:text-white">
      <div className="pointer-events-none absolute left-1/2 top-36 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-cyan-300/12 blur-3xl" />
      <Nav />
      <ProtectedRoute>
        <AnimatedPage className="relative mx-auto max-w-7xl px-4 py-14">
          <div className="max-w-4xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-700 dark:text-cyan-100/60">Choose a training path</p>
            <h1 className="mt-4 text-5xl font-semibold leading-[0.94] tracking-[-0.06em] md:text-7xl">Start with a target course.</h1>
            <p className="mt-5 text-lg font-medium leading-8 text-slate-600 dark:text-white/58">Pick a premium training path, set your schedule, and RehearseAI builds the calendar, reminders, milestones, and missions.</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {filters.map((filter) => <button key={filter} onClick={() => setSelected(filter)} className={`rounded-full px-4 py-2 text-sm font-bold ${selected === filter ? "bg-[#6200a8] text-white" : "bg-white/75 text-slate-700 ring-1 ring-slate-200 dark:bg-white/10 dark:text-white/70 dark:ring-white/10"}`}>{filter}</button>)}
          </div>
          <StaggeredGrid className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((template) => <CourseTemplateCard key={template.id} template={template} onStart={setEnrolling} />)}
          </StaggeredGrid>
        </AnimatedPage>
      </ProtectedRoute>
      <CourseEnrollmentModal template={enrolling} onClose={() => setEnrolling(null)} />
    </main>
  );
}
