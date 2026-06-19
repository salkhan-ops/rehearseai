"use client";

import { ArrowRight, Clock, Target } from "lucide-react";
import type { CourseTemplate } from "@/lib/types";

export function CourseTemplateCard({ template, onStart }: { template: CourseTemplate; onStart: (template: CourseTemplate) => void }) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[2rem] bg-white/75 p-5 ring-1 ring-slate-200/80 backdrop-blur-xl transition hover:-translate-y-1 hover:ring-violet-200 dark:bg-white/[0.07] dark:ring-white/12">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-400/20 blur-3xl transition group-hover:bg-cyan-300/20" />
      <div className="relative flex flex-1 flex-col">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700 dark:bg-white/10 dark:text-cyan-100">{template.category}</span>
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-white/42">{template.difficulty}</span>
        </div>
        <h3 className="mt-5 text-2xl font-semibold tracking-[-0.045em] text-slate-950 dark:text-white">{template.title}</h3>
        <p className="mt-3 text-sm font-medium leading-6 text-slate-600 dark:text-white/58">{template.description}</p>
        <div className="mt-5 grid gap-2 text-sm font-semibold text-slate-700 dark:text-white/70">
          <span className="inline-flex items-center gap-2"><Clock size={16} /> {template.durationDays} days · {template.dailyMinutes} min</span>
          <span className="inline-flex items-center gap-2"><Target size={16} /> {template.whoFor}</span>
        </div>
        <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-700 ring-1 ring-slate-100 dark:bg-white/10 dark:text-white/70 dark:ring-white/10">
          {template.expectedTransformation}
        </div>
        <button onClick={() => onStart(template)} className="mt-auto pt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#6200a8] px-5 py-3 font-bold text-white shadow-[0_14px_34px_rgba(98,0,168,0.22)] transition hover:-translate-y-0.5">
          Start training path <ArrowRight size={17} />
        </button>
      </div>
    </article>
  );
}
