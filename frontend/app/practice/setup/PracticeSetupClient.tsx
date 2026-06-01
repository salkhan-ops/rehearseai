"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Bell, CalendarClock, Check, Clock, Sparkles, Zap } from "lucide-react";
import { Suspense } from "react";
import { FormEvent, useEffect, useState } from "react";
import { AnimatedCard, AnimatedPage, StaggeredGrid } from "@/components/animations";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Nav } from "@/components/Nav";
import { LanguageSelector } from "@/components/settings/LanguageSelector";
import { createPracticeSchedule, createSession, generateRandomScenario } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { canUsePracticeType, getUserEntitlements } from "@/lib/entitlements";
import type { LanguageCode } from "@/lib/languages";
import { difficulties, Difficulty, practiceTypes, PracticeType } from "@/lib/types";
import type { Entitlements } from "@/lib/admin";

const frequencyOptions = [
  ["daily", "Daily"],
  ["twice_weekly", "Twice weekly"],
  ["three_times_weekly", "Three times weekly"],
  ["weekdays", "Weekdays"],
  ["custom", "Mon / Wed / Fri"],
] as const;

const templates: Record<PracticeType, Array<{ label: string; topic: string; context: string; goal: string; notes: string }>> = {
  "Job Interview": [
    { label: "Final-round PM interview", topic: "Senior product manager interview", context: "I am meeting a skeptical VP in a final round. They care about judgment, prioritization, leadership, and handling ambiguity.", goal: "Sound clear, calm, senior, and evidence-backed under pressure.", notes: "Push me when I become generic or vague." },
    { label: "Career switch story", topic: "Career transition interview", context: "I need to explain why I am moving into this role and make my previous experience feel relevant.", goal: "Tell a convincing story without rambling.", notes: "Probe weak logic and missing evidence." },
  ],
  "Presentation / Public Speaking": [
    { label: "Investor-style update", topic: "Quarterly strategy presentation", context: "I am presenting strategy to a skeptical group that may question priorities, numbers, and tradeoffs.", goal: "Stay structured and persuasive during Q&A.", notes: "Ask sharp audience questions." },
    { label: "Team town hall", topic: "Team announcement", context: "I need to communicate a change clearly to a mixed audience with concerns.", goal: "Sound confident, human, and organized.", notes: "Act like a worried audience member." },
  ],
  "Panel Discussion": [
    { label: "Live panel mode", topic: "Industry panel discussion", context: "I am on a panel where people may interrupt, disagree, and ask for concise opinions.", goal: "Stay sharp, brief, and memorable.", notes: "Interrupt occasionally but keep it professional." },
  ],
  "Thesis Defense": [
    { label: "Methodology defense", topic: "Thesis / viva defense", context: "I need to defend my research design, assumptions, limitations, and conclusions to an academic committee.", goal: "Answer with depth, humility, and logical structure.", notes: "Challenge methodology and unsupported claims." },
  ],
  "Salary Negotiation": [
    { label: "Promotion compensation", topic: "Salary negotiation after offer", context: "I have an offer or promotion discussion and need to ask for better compensation while keeping the relationship strong.", goal: "Be direct, credible, and calm when they push back.", notes: "Act budget-conscious and ask for evidence." },
  ],
  "Difficult Conversation": [
    { label: "Boundary conversation", topic: "Difficult conversation with colleague", context: "I need to address a repeated issue without sounding angry or passive.", goal: "Be honest, composed, and specific.", notes: "Respond emotionally but fairly." },
  ],
  "Teaching Session": [
    { label: "Explain a hard concept", topic: "Teaching a complex topic", context: "I need to teach people who are curious but confused and may ask basic or challenging questions.", goal: "Explain simply without sounding impatient.", notes: "Ask confused student questions." },
  ],
  "Sales Pitch": [
    { label: "Skeptical buyer call", topic: "Sales discovery and pitch", context: "I am pitching a solution to a buyer who worries about cost, urgency, and implementation risk.", goal: "Handle objections without becoming pushy.", notes: "Challenge ROI and timing." },
  ],
};

function SetupForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [practiceType, setPracticeType] = useState<PracticeType>((params.get("type") as PracticeType) || "Job Interview");
  const [difficulty, setDifficulty] = useState<Difficulty>((params.get("difficulty") as Difficulty) || "Intermediate");
  const [loading, setLoading] = useState(false);
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
  const [error, setError] = useState("");
  const [topic, setTopic] = useState("");
  const [context, setContext] = useState("");
  const [goal, setGoal] = useState("");
  const [optionalNotes, setOptionalNotes] = useState("");
  const [durationPreference, setDurationPreference] = useState(10);
  const [customDuration, setCustomDuration] = useState(false);
  const [createRoutine, setCreateRoutine] = useState(false);
  const [frequencyType, setFrequencyType] = useState<"daily" | "twice_weekly" | "three_times_weekly" | "weekdays" | "custom">("daily");
  const [preferredTime, setPreferredTime] = useState("20:00");
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState(15);
  const { getToken, profile, updateLanguagePreferences, userId } = useAuth();
  const [practiceLanguage, setPracticeLanguage] = useState<LanguageCode>(profile?.preferredPracticeLanguage || "en");
  const [feedbackLanguage, setFeedbackLanguage] = useState<LanguageCode>(profile?.preferredFeedbackLanguage || "en");

  useEffect(() => {
    getUserEntitlements(userId).then(setEntitlements).catch(() => undefined);
  }, [userId]);

  useEffect(() => {
    if (profile?.preferredPracticeLanguage) setPracticeLanguage(profile.preferredPracticeLanguage);
    if (profile?.preferredFeedbackLanguage) setFeedbackLanguage(profile.preferredFeedbackLanguage);
  }, [profile?.preferredFeedbackLanguage, profile?.preferredPracticeLanguage]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (entitlements) {
      if (difficulty === "Brutal" && !entitlements.allowBrutalMode) {
        setError("Brutal mode requires Pro or Coach.");
        return;
      }
      if (!canUsePracticeType(entitlements, practiceType)) {
        setError("This practice mode is not included in your current plan.");
        return;
      }
    }
    setLoading(true);
    const token = await getToken();
    if (createRoutine && typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission().catch(() => undefined);
    }
    const session = await createSession({
      userId,
      practiceType,
      difficulty,
      topic,
      context,
      goal,
      optionalNotes,
      practiceLanguage,
      feedbackLanguage,
      durationPreference
    }, token);
    if (createRoutine) {
      await createPracticeSchedule({
        userId,
        frequencyType,
        daysOfWeek: frequencyType === "weekdays" ? [1, 2, 3, 4, 5] : frequencyType === "twice_weekly" ? [2, 4] : frequencyType === "three_times_weekly" || frequencyType === "custom" ? [1, 3, 5] : [],
        preferredTime,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        enabled: true,
        categories: [practiceType],
        durationPreference,
        reminderMinutesBefore,
      }, token).catch(() => undefined);
    }
    router.push(`/session/${session.id}`);
  }

  function applyTemplate(template: { topic: string; context: string; goal: string; notes: string }) {
    setTopic(template.topic);
    setContext(template.context);
    setGoal(template.goal);
    setOptionalNotes(template.notes);
  }

  async function generateScenario() {
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      const scenario = await generateRandomScenario({ userId, category: practiceType, difficulty, practiceLanguage, feedbackLanguage }, token);
      setTopic(scenario.topic);
      setContext(`${scenario.setting}\n\nEmotional context: ${scenario.emotionalContext}\nPressure: ${scenario.pressureSituation}`);
      setGoal(scenario.objective);
      setOptionalNotes(`${scenario.personalityDynamics}\n${scenario.optionalNotes}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate a scenario.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f4f8fc] dark:bg-[#0e1020]">
      <Nav />
      <AnimatedPage className="relative mx-auto max-w-7xl px-4 py-10 md:py-14">
        <div className="pointer-events-none absolute right-10 top-20 h-72 w-72 rounded-full bg-violet-300/20 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
          <aside className="rounded-[2rem] bg-white/82 p-6 text-slate-950 shadow-[0_24px_70px_rgba(35,45,75,0.08)] ring-1 ring-slate-200/75 backdrop-blur-xl dark:bg-slate-950 dark:text-white dark:shadow-[0_30px_90px_rgba(0,0,0,0.26)] dark:ring-white/10">
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 ring-1 ring-violet-100 dark:bg-white/10 dark:text-violet-100 dark:ring-white/10">
              <Zap size={14} /> Setup studio
            </div>
            <h1 className="mt-5 text-4xl font-semibold leading-[0.98] tracking-[-0.045em] text-slate-950 md:text-5xl dark:text-white">Skip the blank page.</h1>
            <p className="mt-5 text-base font-medium leading-7 text-slate-600 dark:text-white/60">Start from a real scenario, tune the pressure, and let RehearseAI build the room around you.</p>
            <div className="mt-8 grid gap-3">
              {["Pick a pressure template", "Edit only what matters", "Start talking in under a minute"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 dark:bg-white/[0.08] dark:text-white dark:ring-white/10">
                  <span className="flex size-7 items-center justify-center rounded-full bg-emerald-400 text-slate-950"><Check size={16} /></span>
                  {item}
                </div>
              ))}
            </div>
          </aside>

          <form onSubmit={onSubmit} className="relative rounded-[2rem] bg-white p-4 shadow-[0_24px_70px_rgba(35,45,75,0.08)] ring-1 ring-slate-200/75 dark:bg-white/10 dark:ring-white/10 md:p-6">
            <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
              <label className="block text-sm font-semibold text-slate-700 dark:text-white/75">
                Pressure arena
                <select value={practiceType} onChange={(event) => setPracticeType(event.target.value as PracticeType)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:border-white/10 dark:bg-white/10 dark:text-white">
                  {practiceTypes.map((type) => <option key={type}>{type}</option>)}
                </select>
              </label>
              <div className="rounded-2xl bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-700 dark:bg-violet-400/15 dark:text-violet-100">
                <span className="mb-1 flex items-center gap-2"><Clock size={16} /> Session length</span>
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  {customDuration ? (
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={durationPreference}
                      onChange={(event) => setDurationPreference(Math.min(120, Math.max(1, Number(event.target.value) || 1)))}
                      className="w-full rounded-xl bg-white/70 px-3 py-2 text-lg font-bold text-violet-800 outline-none dark:bg-white/10 dark:text-violet-100"
                    />
                  ) : (
                    <select value={durationPreference} onChange={(event) => setDurationPreference(Number(event.target.value))} className="w-full bg-transparent text-lg font-bold outline-none">
                      {[5, 10, 15, 30, 45, 60].map((minutes) => <option key={minutes} value={minutes}>{minutes} min</option>)}
                    </select>
                  )}
                  <button type="button" onClick={() => setCustomDuration((value) => !value)} className="rounded-xl bg-white/80 px-3 py-2 text-xs font-bold text-violet-700 ring-1 ring-violet-100 dark:bg-white/10 dark:text-violet-100 dark:ring-white/10">
                    {customDuration ? "Presets" : "Custom"}
                  </button>
                </div>
                {customDuration && <span className="mt-1 block text-xs text-violet-500 dark:text-violet-200/70">1-120 minutes</span>}
              </div>
            </div>

            <div className="mt-5">
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

            <div className="mt-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-white/75">
                <Sparkles size={16} /> Quick starts
              </div>
              <button type="button" onClick={generateScenario} disabled={loading} className="mb-3 inline-flex items-center gap-2 rounded-2xl bg-[#6200a8] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(98,0,168,0.22)] disabled:opacity-60">
                <Sparkles size={16} /> Generate Random Practice Scenario
              </button>
              <StaggeredGrid className="grid gap-3 md:grid-cols-2">
                {templates[practiceType].map((template) => (
                  <AnimatedCard key={template.label} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 transition dark:bg-white/10 dark:ring-white/10">
                    <button type="button" onClick={() => applyTemplate(template)} className="w-full text-left">
                      <div className="font-semibold tracking-[-0.02em] text-slate-950 dark:text-white">{template.label}</div>
                      <p className="mt-2 line-clamp-2 text-sm font-medium leading-6 text-slate-600 dark:text-white/60">{template.context}</p>
                    </button>
                  </AnimatedCard>
                ))}
              </StaggeredGrid>
            </div>

            <div className="mt-5 grid gap-4">
              <label className="block text-sm font-semibold text-slate-700 dark:text-white/75">Topic
                <input value={topic} onChange={(event) => setTopic(event.target.value)} required className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:border-white/10 dark:bg-white/10 dark:text-white" placeholder="Example: final-round PM interview, investor pitch, tense 1:1..." />
              </label>
              <label className="block text-sm font-semibold text-slate-700 dark:text-white/75">What is happening?
                <textarea value={context} onChange={(event) => setContext(event.target.value)} required rows={3} className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:border-white/10 dark:bg-white/10 dark:text-white" placeholder="Short is fine. Who is in the room? What pressure should the AI create?" />
              </label>
              <label className="block text-sm font-semibold text-slate-700 dark:text-white/75">Win condition
                <input value={goal} onChange={(event) => setGoal(event.target.value)} required className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:border-white/10 dark:bg-white/10 dark:text-white" placeholder="Example: sound calm, concise, strategic, and credible" />
              </label>
            </div>

            <div className="mt-5">
              <div className="text-sm font-semibold text-slate-700 dark:text-white/75">Pressure level</div>
              <div className="mt-2 grid gap-2 sm:grid-cols-4">
              {difficulties.map((item) => (
                <button key={item} type="button" disabled={item === "Brutal" && entitlements?.allowBrutalMode === false} onClick={() => setDifficulty(item)} className={`rounded-2xl px-4 py-3 text-sm font-semibold ring-1 transition disabled:cursor-not-allowed disabled:opacity-45 ${difficulty === item ? "bg-slate-950 text-white ring-slate-950 shadow-[0_16px_35px_rgba(15,23,42,0.16)] dark:bg-white dark:text-slate-950" : "bg-slate-50 text-slate-700 ring-slate-200 hover:bg-white dark:bg-white/10 dark:text-white/70 dark:ring-white/10"}`}>{item}</button>
              ))}
              </div>
              {difficulty === "Beginner" && <p className="mt-2 text-sm font-medium text-slate-500 dark:text-white/50">Beginner Mode adds a briefing, conversation map, and reasoning hints. It teaches structure without feeding answers.</p>}
            </div>

            <section className="mt-5 rounded-[1.5rem] bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-white/10 dark:ring-white/10">
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={createRoutine} onChange={(event) => setCreateRoutine(event.target.checked)} className="mt-1 size-5 accent-[#6200a8]" />
                <span>
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white"><CalendarClock size={16} /> Add reminders / make this a routine</span>
                  <span className="mt-1 block text-sm font-medium leading-6 text-slate-600 dark:text-white/60">Save this arena to your calendar-style practice routine and enable browser reminders.</span>
                </span>
              </label>
              {createRoutine && (
                <div className="mt-4 grid gap-3">
                  <div className="grid gap-2 sm:grid-cols-5">
                    {frequencyOptions.map(([value, label]) => (
                      <button key={value} type="button" onClick={() => setFrequencyType(value)} className={`rounded-2xl px-3 py-2 text-xs font-semibold ring-1 transition ${frequencyType === value ? "bg-[#6200a8] text-white ring-[#6200a8]" : "bg-white text-slate-700 ring-slate-200 dark:bg-white/10 dark:text-white/70 dark:ring-white/10"}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="text-sm font-semibold text-slate-700 dark:text-white/75">
                      Reminder time
                      <input type="time" value={preferredTime} onChange={(event) => setPreferredTime(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none dark:border-white/10 dark:bg-white/10 dark:text-white" />
                    </label>
                    <label className="text-sm font-semibold text-slate-700 dark:text-white/75">
                      Notify me
                      <select value={reminderMinutesBefore} onChange={(event) => setReminderMinutesBefore(Number(event.target.value))} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none dark:border-white/10 dark:bg-white/10 dark:text-white">
                        {[0, 5, 15, 30, 60].map((minutes) => <option key={minutes} value={minutes}>{minutes === 0 ? "At start time" : `${minutes} min before`}</option>)}
                      </select>
                    </label>
                    <div className="rounded-2xl bg-white p-4 text-sm font-semibold text-violet-700 ring-1 ring-slate-200 dark:bg-white/10 dark:text-violet-100 dark:ring-white/10">
                      <Bell className="mr-2 inline" size={16} /> Saved to dashboard routine
                    </div>
                  </div>
                </div>
              )}
            </section>

            <label className="mt-5 block text-sm font-semibold text-slate-700 dark:text-white/75">Optional coaching style
              <textarea value={optionalNotes} onChange={(event) => setOptionalNotes(event.target.value)} rows={2} className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:border-white/10 dark:bg-white/10 dark:text-white" placeholder="Example: interrupt me if I ramble, challenge weak evidence, stay professional" />
            </label>
            {error && <p className="mt-4 rounded-2xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p>}
            <button disabled={loading} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#6200a8] px-5 py-4 font-semibold text-white shadow-[0_18px_38px_rgba(98,0,168,0.22)] transition hover:-translate-y-0.5 hover:bg-[#50008b] disabled:opacity-60">
              {loading ? "Building the room..." : "Enter rehearsal room"} <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </AnimatedPage>
    </main>
  );
}

export default function SetupPage() {
  return (
    <Suspense fallback={<main><Nav /><div className="px-4 py-12 text-center font-bold">Loading setup...</div></main>}>
      <ProtectedRoute><SetupForm /></ProtectedRoute>
    </Suspense>
  );
}
