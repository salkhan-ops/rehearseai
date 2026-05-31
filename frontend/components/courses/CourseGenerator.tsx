"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrainCircuit, CalendarDays, Sparkles } from "lucide-react";
import { generateCourse } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { CourseSkillLevel, Difficulty, PracticeType } from "@/lib/types";
import { difficulties, practiceTypes } from "@/lib/types";

export function CourseGenerator() {
  const router = useRouter();
  const { getToken, profile, userId } = useAuth();
  const [goal, setGoal] = useState("Think clearly and answer with confidence under pressure");
  const [skillLevel, setSkillLevel] = useState<CourseSkillLevel>("intermediate");
  const [targetRole, setTargetRole] = useState("");
  const [weeklyHours, setWeeklyHours] = useState(3);
  const [duration, setDuration] = useState(20);
  const [targetDate, setTargetDate] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("Intermediate");
  const [categories, setCategories] = useState<PracticeType[]>(["Job Interview", "Difficult Conversation"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggleCategory(type: PracticeType) {
    setCategories((current) => current.includes(type) ? current.filter((item) => item !== type) : [...current, type]);
  }

  async function submit() {
    if (!goal.trim() || categories.length === 0) {
      setError("Add a goal and at least one practice arena.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      const bundle = await generateCourse({
        userId,
        goal,
        skillLevel,
        targetRole: targetRole || undefined,
        availableHoursPerWeek: weeklyHours,
        preferredSessionDuration: duration,
        targetCompletionDate: targetDate || undefined,
        practiceCategories: categories,
        difficulty,
        practiceLanguage: profile?.preferredPracticeLanguage || "en",
        feedbackLanguage: profile?.preferredFeedbackLanguage || "en",
      }, token);
      router.push(`/course/${bundle.course.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not generate course.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative overflow-hidden rounded-[2.4rem] bg-white/80 p-6 ring-1 ring-slate-200/80 backdrop-blur-2xl dark:bg-white/[0.07] dark:ring-white/12 md:p-8">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-400/20 blur-3xl" />
      <div className="relative">
        <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 dark:bg-white/10 dark:text-cyan-100">
          <BrainCircuit size={16} /> Generate my personalized training program
        </div>
        <h2 className="mt-5 text-4xl font-semibold tracking-[-0.055em] text-slate-950 dark:text-white md:text-5xl">Build your reasoning course.</h2>
        <p className="mt-3 max-w-2xl font-medium leading-7 text-slate-600 dark:text-white/58">Create a calendar of daily missions that progressively trains clarity, composure, persuasion, and pressure recovery.</p>

        <div className="mt-7 grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-white/70">Training goal</span>
            <textarea value={goal} onChange={(event) => setGoal(event.target.value)} className="min-h-28 rounded-[1.4rem] border border-slate-200 bg-white/80 p-4 text-lg font-semibold text-slate-950 outline-none transition focus:border-violet-300 dark:border-white/10 dark:bg-white/10 dark:text-white" />
          </label>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-white/70">Skill level</span>
              <select value={skillLevel} onChange={(event) => setSkillLevel(event.target.value as CourseSkillLevel)} className="rounded-2xl border border-slate-200 bg-white/80 p-4 font-semibold text-slate-950 dark:border-white/10 dark:bg-white/10 dark:text-white">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-white/70">Hours/week</span>
              <input type="number" min={1} max={20} value={weeklyHours} onChange={(event) => setWeeklyHours(Number(event.target.value))} className="rounded-2xl border border-slate-200 bg-white/80 p-4 font-semibold text-slate-950 dark:border-white/10 dark:bg-white/10 dark:text-white" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-white/70">Session length</span>
              <input type="number" min={5} max={120} value={duration} onChange={(event) => setDuration(Number(event.target.value))} className="rounded-2xl border border-slate-200 bg-white/80 p-4 font-semibold text-slate-950 dark:border-white/10 dark:bg-white/10 dark:text-white" />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-white/70">Target role</span>
              <input value={targetRole} onChange={(event) => setTargetRole(event.target.value)} placeholder="Founder, product manager, lecturer..." className="rounded-2xl border border-slate-200 bg-white/80 p-4 font-semibold text-slate-950 dark:border-white/10 dark:bg-white/10 dark:text-white" />
            </label>
            <label className="grid gap-2">
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-white/70"><CalendarDays size={16} /> Target completion date</span>
              <input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} className="rounded-2xl border border-slate-200 bg-white/80 p-4 font-semibold text-slate-950 dark:border-white/10 dark:bg-white/10 dark:text-white" />
            </label>
          </div>
          <div className="grid gap-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-white/70">Difficulty</span>
            <div className="grid gap-2 sm:grid-cols-4">
              {difficulties.map((item) => (
                <button key={item} type="button" onClick={() => setDifficulty(item)} className={`rounded-2xl px-4 py-3 text-sm font-bold transition ${difficulty === item ? "bg-[#6200a8] text-white shadow-[0_16px_34px_rgba(98,0,168,0.2)]" : "bg-white/70 text-slate-700 ring-1 ring-slate-200 dark:bg-white/10 dark:text-white/70 dark:ring-white/10"}`}>{item}</button>
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-white/70">Practice arenas</span>
            <div className="flex flex-wrap gap-2">
              {practiceTypes.map((type) => (
                <button key={type} type="button" onClick={() => toggleCategory(type)} className={`rounded-full px-4 py-2 text-sm font-bold transition ${categories.includes(type) ? "bg-cyan-100 text-violet-800 ring-1 ring-violet-200 dark:bg-cyan-300/15 dark:text-cyan-100 dark:ring-cyan-200/20" : "bg-white/70 text-slate-600 ring-1 ring-slate-200 dark:bg-white/10 dark:text-white/54 dark:ring-white/10"}`}>{type}</button>
              ))}
            </div>
          </div>
        </div>
        {error && <div className="mt-4 rounded-2xl bg-rose-50 p-4 font-semibold text-rose-700 dark:bg-rose-400/10 dark:text-rose-100">{error}</div>}
        <button onClick={submit} disabled={loading} className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#6200a8] px-6 py-4 text-lg font-bold text-white shadow-[0_18px_44px_rgba(98,0,168,0.25)] transition hover:-translate-y-0.5 disabled:opacity-60 md:w-auto">
          <Sparkles size={20} /> {loading ? "Generating course..." : "Generate cognitive course"}
        </button>
      </div>
    </section>
  );
}
