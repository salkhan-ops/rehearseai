"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BookOpen, Check, Clock, X } from "lucide-react";
import { enrollCourseTemplate } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { categoryToPracticeType, getCourseConfig } from "@/lib/courseConfig";
import { courseHref } from "@/lib/routes";
import type { CourseTemplate, Difficulty } from "@/lib/types";
import { difficulties } from "@/lib/types";

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CourseEnrollmentModal({ template, onClose }: { template: CourseTemplate | null; onClose: () => void }) {
  const router = useRouter();
  const { getToken, profile, userId } = useAuth();
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [days, setDays] = useState<number[]>([0, 1, 2, 3, 4]);
  const [time, setTime] = useState("20:00");
  const [reminder, setReminder] = useState(15);
  const [difficulty, setDifficulty] = useState<Difficulty>("Intermediate");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  if (!template) return null;
  const selectedTemplate = template;

  function toggleDay(day: number) {
    setDays((current) => current.includes(day) ? current.filter((item) => item !== day) : [...current, day].sort());
  }

  async function enroll() {
    setLoading(true);
    setError("");
    try {
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
        await Notification.requestPermission().catch(() => undefined);
      }
      const token = await getToken();
      const bundle = await enrollCourseTemplate({
        userId,
        templateId: selectedTemplate.id,
        preferredStartDate: startDate,
        preferredDays: days,
        preferredTime: time,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        reminderMinutesBefore: reminder,
        difficulty,
        practiceLanguage: profile?.preferredPracticeLanguage || "en",
        feedbackLanguage: profile?.preferredFeedbackLanguage || "en",
      }, token);
      router.push(courseHref(bundle.course.id));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not enroll in this course.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-xl">
      <div className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl ring-1 ring-slate-200 dark:bg-[#101827] dark:ring-white/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-violet-700 dark:text-cyan-100/60">Enroll in training path</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-slate-950 dark:text-white">{template.title}</h2>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="grid size-10 place-items-center rounded-full bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white"><X size={18} /></button>
        </div>
        <div className="mt-6 grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-white/70">Start date<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-950 dark:border-white/10 dark:bg-white/10 dark:text-white" /></label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-white/70">Practice time<input type="time" value={time} onChange={(event) => setTime(event.target.value)} className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-950 dark:border-white/10 dark:bg-white/10 dark:text-white" /></label>
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-700 dark:text-white/70">Practice days</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {weekDays.map((label, index) => <button key={label} onClick={() => toggleDay(index)} className={`rounded-full px-4 py-2 text-sm font-bold ${days.includes(index) ? "bg-[#6200a8] text-white" : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/60"}`}>{label}</button>)}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-white/70">Reminder<select value={reminder} onChange={(event) => setReminder(Number(event.target.value))} className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-950 dark:border-white/10 dark:bg-white/10 dark:text-white"><option value={0}>At scheduled time</option><option value={15}>15 min before</option><option value={30}>30 min before</option><option value={60}>60 min before</option></select></label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-white/70">Difficulty<select value={difficulty} onChange={(event) => setDifficulty(event.target.value as Difficulty)} className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-950 dark:border-white/10 dark:bg-white/10 dark:text-white">{difficulties.map((item) => <option key={item}>{item}</option>)}</select></label>
          </div>
        </div>
        {/* What to expect each session */}
        {(() => {
          const practiceType = categoryToPracticeType[template.category];
          if (!practiceType) return null;
          const cfg = getCourseConfig(practiceType);
          return (
            <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
              <div className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-white/35">What to expect each session</div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-white/75">
                <Clock size={14} className="shrink-0 text-[#6200a8]" />
                {cfg.defaultDuration} min default · {cfg.minDuration}–{cfg.maxDuration} min range
              </div>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-600 dark:text-white/60">{cfg.aiPersona}</p>
              <div className="mt-3 flex items-start gap-2 rounded-2xl bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-800 ring-1 ring-emerald-100 dark:bg-emerald-400/10 dark:text-emerald-200 dark:ring-emerald-400/20">
                <Check size={14} className="mt-0.5 shrink-0" />
                {cfg.successLooks}
              </div>
              <div className="mt-3 rounded-2xl bg-white px-3 py-2.5 text-sm font-medium leading-6 text-slate-600 ring-1 ring-slate-200 dark:bg-white/5 dark:text-white/55 dark:ring-white/10">
                <span className="font-semibold text-slate-800 dark:text-white">Pressure arc:</span> <span className="text-slate-600 dark:text-white/60">{cfg.pressureArc}</span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-white/35">
                <BookOpen size={12} /> A personalised briefing card is shown before each session starts.
              </div>
            </div>
          );
        })()}
        {error && <div className="mt-4 rounded-2xl bg-rose-50 p-4 font-semibold text-rose-700 dark:bg-rose-400/10 dark:text-rose-100">{error}</div>}
        <button onClick={enroll} disabled={loading || days.length === 0} className="mt-6 w-full rounded-2xl bg-[#6200a8] px-5 py-4 text-lg font-bold text-white disabled:opacity-60">{loading ? "Creating calendar..." : "Start this training program"}</button>
      </div>
    </div>
  );
}
