"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Bell, BookOpen, CalendarClock, Check, Clock, Sparkles, Target, UsersRound, Zap } from "lucide-react";
import { Suspense } from "react";
import { FormEvent, useEffect, useState } from "react";
import { AnimatedCard, AnimatedPage, StaggeredGrid } from "@/components/animations";
import { AICharacterEnvironment } from "@/components/AICharacterEnvironment";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CameraSignalControls } from "@/components/local-signals/CameraSignalControls";
import { Nav } from "@/components/Nav";
import { ConversationModeToggle } from "@/components/session/ConversationModeToggle";
import { LanguageSelector } from "@/components/settings/LanguageSelector";
import { createPracticeSchedule, createSession, generateRandomScenario } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { getCourseConfig } from "@/lib/courseConfig";
import { canUsePracticeType, getUserEntitlements, getSessionUsage, incrementMonthlySessionCount, type UsageInfo } from "@/lib/entitlements";
import { sessionHref } from "@/lib/routes";
import { updateTelemetryConsent } from "@/lib/telemetry";
import type { LanguageCode } from "@/lib/languages";
import { difficulties, Difficulty, environmentModes, nerveEntryTypes, nervePersonas, practiceTypes, PracticeType } from "@/lib/types";
import type { ConversationMode, EnvironmentMode, NerveEntryType, NervePersona } from "@/lib/types";
import type { Entitlements } from "@/lib/admin";

const frequencyOptions = [
  ["daily", "Daily"],
  ["twice_weekly", "Twice weekly"],
  ["three_times_weekly", "Three times weekly"],
  ["weekdays", "Weekdays"],
  ["custom", "Mon / Wed / Fri"],
] as const;

const quickStarts: Record<PracticeType, Array<{ label: string; topic: string; context: string; goal: string; notes: string }>> = {
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
  "Casual Chat": [
    { label: "Coffee catch-up", topic: "Catching up over coffee", context: "I am having a relaxed chat with a friend I haven't seen in a while.", goal: "Speak naturally and keep the conversation flowing without overthinking.", notes: "Be warm, curious, and genuine." },
    { label: "New acquaintance", topic: "Getting to know someone new", context: "I just met someone at an event and want to have a friendly, genuine conversation.", goal: "Ask good questions, share naturally, and avoid awkward silences.", notes: "Be friendly and curious." },
  ],
};

const STEP_LABELS = ["Scenario", "How", "Environment", "Briefing", "Ready"];

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="mb-8 flex items-center gap-2">
      {STEP_LABELS.map((label, index) => {
        const stepNum = index + 1;
        const done = stepNum < current;
        const active = stepNum === current;
        return (
          <div key={label} className="flex items-center gap-2">
            <div className={`flex size-7 items-center justify-center rounded-full text-xs font-bold transition ${done ? "bg-emerald-500 text-white" : active ? "bg-[#6200a8] text-white shadow-[0_6px_20px_rgba(98,0,168,0.35)]" : "bg-slate-100 text-slate-400 dark:bg-white/10 dark:text-white/30"}`}>
              {done ? <Check size={13} /> : stepNum}
            </div>
            <span className={`hidden text-sm font-semibold sm:inline ${active ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-white/30"}`}>{label}</span>
            {index < total - 1 && <div className={`h-px w-6 sm:w-10 ${done ? "bg-emerald-300" : "bg-slate-200 dark:bg-white/10"}`} />}
          </div>
        );
      })}
    </div>
  );
}

function SetupForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [practiceType, setPracticeType] = useState<PracticeType>((params.get("type") as PracticeType) || "Job Interview");
  const [difficulty, setDifficulty] = useState<Difficulty>((params.get("difficulty") as Difficulty) || "Intermediate");
  const [loading, setLoading] = useState(false);
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [error, setError] = useState("");
  const [topic, setTopic] = useState("");
  const [context, setContext] = useState("");
  const [goal, setGoal] = useState("");
  const [optionalNotes, setOptionalNotes] = useState("");
  const [durationPreference, setDurationPreference] = useState(() => getCourseConfig("Job Interview").defaultDuration);
  const [environmentMode, setEnvironmentMode] = useState<EnvironmentMode>("AI Orb");
  const [preferredConversationMode, setPreferredConversationMode] = useState<ConversationMode>("natural");
  const [nerveEntryType, setNerveEntryType] = useState<NerveEntryType>("Topic");
  const [nervePersona, setNervePersona] = useState<NervePersona>("Mixed Panel");
  const [nerveMaterialName, setNerveMaterialName] = useState("");
  const [nerveMaterialText, setNerveMaterialText] = useState("");
  const [customDuration, setCustomDuration] = useState(false);
  const [createRoutine, setCreateRoutine] = useState(false);
  const [frequencyType, setFrequencyType] = useState<"daily" | "twice_weekly" | "three_times_weekly" | "weekdays" | "custom">("daily");
  const [preferredTime, setPreferredTime] = useState("20:00");
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState(15);
  const { getToken, profile, updateLanguagePreferences, userId } = useAuth();
  const [practiceLanguage, setPracticeLanguage] = useState<LanguageCode>(profile?.preferredPracticeLanguage || "en");
  const [feedbackLanguage, setFeedbackLanguage] = useState<LanguageCode>(profile?.preferredFeedbackLanguage || "en");
  const [cameraAssistedTiming, setCameraAssistedTiming] = useState(Boolean(profile?.privacySettings?.allowCameraAssistedTiming));

  useEffect(() => {
    getUserEntitlements(userId).then((e) => {
      setEntitlements(e);
      getSessionUsage(userId, e).then(setUsage).catch(() => undefined);
    }).catch(() => undefined);
  }, [userId]);

  useEffect(() => {
    if (profile?.preferredPracticeLanguage) setPracticeLanguage(profile.preferredPracticeLanguage);
    if (profile?.preferredFeedbackLanguage) setFeedbackLanguage(profile.preferredFeedbackLanguage);
    setCameraAssistedTiming(Boolean(profile?.privacySettings?.allowCameraAssistedTiming));
  }, [profile?.preferredFeedbackLanguage, profile?.preferredPracticeLanguage, profile?.privacySettings?.allowCameraAssistedTiming]);

  // Auto-set duration to the category default when the arena changes
  useEffect(() => {
    setDurationPreference(getCourseConfig(practiceType).defaultDuration);
    setCustomDuration(false);
  }, [practiceType]);

  async function updateCameraAssistedTiming(enabled: boolean) {
    setCameraAssistedTiming(enabled);
    const token = await getToken();
    const current = profile?.privacySettings || {
      allowTelemetry: true,
      allowModelImprovement: true,
      allowRawAudioStorage: false,
      allowCameraAssistedTiming: false,
      allowLocalSignalTelemetry: false,
      allowRawVideoStorage: false as const,
    };
    await updateTelemetryConsent(userId, { ...current, allowCameraAssistedTiming: enabled, allowRawVideoStorage: false }, token).catch(() => undefined);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (entitlements) {
      if (difficulty === "Brutal" && !entitlements.allowBrutalMode) { setError("Brutal mode requires Pro or Coach."); return; }
      if (difficulty === "Nerve" && !entitlements.allowNerveMode && !entitlements.allowBrutalMode) { setError("Nerve Mode requires Pro or Coach."); return; }
      if (!canUsePracticeType(entitlements, practiceType)) { setError("This practice mode is not included in your current plan."); return; }
      if (usage && usage.limit !== "unlimited" && usage.remaining === 0) {
        setError(`You've used all ${usage.limit} sessions this month. Upgrade your plan for more. Resets ${usage.resetDate}.`);
        return;
      }
    }
    setLoading(true);
    const token = await getToken();
    if (createRoutine && typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission().catch(() => undefined);
    }
    const session = await createSession({
      userId, practiceType, difficulty, topic, context, goal, optionalNotes,
      practiceLanguage, feedbackLanguage, durationPreference, environmentMode, preferredConversationMode,
      ...(difficulty === "Nerve" ? { nerveEntryType, nervePersona, nerveMaterialName, nerveMaterialText } : {}),
    }, token);
    incrementMonthlySessionCount(userId).catch(() => undefined);
    if (createRoutine) {
      await createPracticeSchedule({
        userId, frequencyType,
        daysOfWeek: frequencyType === "weekdays" ? [1, 2, 3, 4, 5] : frequencyType === "twice_weekly" ? [2, 4] : frequencyType === "three_times_weekly" || frequencyType === "custom" ? [1, 3, 5] : [],
        preferredTime, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        enabled: true, categories: [practiceType], durationPreference, reminderMinutesBefore,
      }, token).catch(() => undefined);
    }
    router.push(sessionHref(session.id));
  }

  function applyTemplate(t: { topic: string; context: string; goal: string; notes: string }) {
    setTopic(t.topic);
    setContext(t.context);
    setGoal(t.goal);
    setOptionalNotes(t.notes);
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

  async function handleNerveMaterial(file?: File) {
    if (!file) return;
    setNerveMaterialName(file.name);
    if (/\.(txt|md|csv|json)$/i.test(file.name)) {
      setNerveMaterialText((await file.text()).slice(0, 8000));
      return;
    }
    setNerveMaterialText(`Uploaded file: ${file.name}. Binary formats are used as material context by name in this MVP; paste key claims or abstract text below for deeper analysis.`);
  }

  const config = getCourseConfig(practiceType);
  const briefingSections = config.prepSections({ topic, context, goal });

  return (
    <main className="min-h-screen overflow-hidden bg-[#f4f8fc] dark:bg-[#0e1020]">
      <Nav />
      <AnimatedPage className="relative mx-auto max-w-3xl px-4 py-10 md:py-14">
        <div className="pointer-events-none absolute right-10 top-20 h-72 w-72 rounded-full bg-violet-300/20 blur-3xl" />

        <div className="relative mb-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 ring-1 ring-violet-100 dark:bg-white/10 dark:text-violet-100 dark:ring-white/10">
            <Zap size={14} /> Setup studio
          </div>
          <h1 className="mt-3 text-3xl font-semibold leading-[0.98] tracking-[-0.04em] text-slate-950 dark:text-white md:text-4xl">
            {step === 1 && "What are you practising?"}
            {step === 2 && "How should it feel?"}
            {step === 3 && "Pick your environment."}
            {step === 4 && "Read your briefing."}
            {step === 5 && "You're ready."}
          </h1>
        </div>

        <StepIndicator current={step} total={STEP_LABELS.length} />

        <form onSubmit={onSubmit}>

          {/* ── Step 1: Scenario ── */}
          {step === 1 && (
            <div className="rounded-[2rem] bg-white p-6 shadow-[0_24px_70px_rgba(35,45,75,0.08)] ring-1 ring-slate-200/75 dark:bg-white/10 dark:ring-white/10">
              <label className="block text-sm font-semibold text-slate-700 dark:text-white/75">
                Pressure arena
                <select value={practiceType} onChange={(e) => setPracticeType(e.target.value as PracticeType)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:border-white/10 dark:bg-white/10 dark:text-white">
                  {practiceTypes.map((type) => <option key={type}>{type}</option>)}
                </select>
              </label>

              <div className="mt-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-white/75">
                  <Sparkles size={16} /> Quick starts
                </div>
                <button type="button" onClick={generateScenario} disabled={loading} className="mb-3 inline-flex items-center gap-2 rounded-2xl bg-[#6200a8] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(98,0,168,0.22)] disabled:opacity-60">
                  <Sparkles size={16} /> Generate random scenario
                </button>
                <StaggeredGrid className="grid gap-3 md:grid-cols-2">
                  {quickStarts[practiceType].map((t) => (
                    <AnimatedCard key={t.label} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 transition dark:bg-white/10 dark:ring-white/10">
                      <button type="button" onClick={() => applyTemplate(t)} className="w-full text-left">
                        <div className="font-semibold tracking-[-0.02em] text-slate-950 dark:text-white">{t.label}</div>
                        <p className="mt-2 line-clamp-2 text-sm font-medium leading-6 text-slate-600 dark:text-white/60">{t.context}</p>
                      </button>
                    </AnimatedCard>
                  ))}
                </StaggeredGrid>
              </div>

              <div className="mt-5 grid gap-4">
                <label className="block text-sm font-semibold text-slate-700 dark:text-white/75">
                  Topic
                  <input value={topic} onChange={(e) => setTopic(e.target.value)} required className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:border-white/10 dark:bg-white/10 dark:text-white" placeholder="Example: final-round PM interview, investor pitch, tense 1:1..." />
                </label>
                <label className="block text-sm font-semibold text-slate-700 dark:text-white/75">
                  What is happening?
                  <textarea value={context} onChange={(e) => setContext(e.target.value)} required rows={3} className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:border-white/10 dark:bg-white/10 dark:text-white" placeholder="Short is fine. Who is in the room? What pressure should the AI create?" />
                </label>
                <label className="block text-sm font-semibold text-slate-700 dark:text-white/75">
                  Win condition
                  <input value={goal} onChange={(e) => setGoal(e.target.value)} required className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:border-white/10 dark:bg-white/10 dark:text-white" placeholder="Example: sound calm, concise, strategic, and credible" />
                </label>
              </div>

              {error && <p className="mt-4 rounded-2xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p>}

              <button
                type="button"
                disabled={!topic.trim() || !context.trim() || !goal.trim()}
                onClick={() => setStep(2)}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#6200a8] px-5 py-4 font-semibold text-white shadow-[0_18px_38px_rgba(98,0,168,0.22)] transition hover:-translate-y-0.5 hover:bg-[#50008b] disabled:opacity-50"
              >
                Next: How should it feel? <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* ── Step 2: How ── */}
          {step === 2 && (
            <div className="rounded-[2rem] bg-white p-6 shadow-[0_24px_70px_rgba(35,45,75,0.08)] ring-1 ring-slate-200/75 dark:bg-white/10 dark:ring-white/10">
              <div>
                <div className="text-sm font-semibold text-slate-700 dark:text-white/75">Pressure level</div>
                <div className="mt-2 grid gap-2 sm:grid-cols-5">
                  {difficulties.map((item) => (
                    <button key={item} type="button"
                      disabled={
                        (practiceType === "Casual Chat" && (item === "Brutal" || item === "Nerve" || item === "Advanced")) ||
                        (item === "Brutal" && entitlements?.allowBrutalMode === false) ||
                        (item === "Nerve" && entitlements?.allowNerveMode === false && entitlements?.allowBrutalMode === false)
                      }
                      onClick={() => setDifficulty(item)}
                      className={`rounded-2xl px-4 py-3 text-sm font-semibold ring-1 transition disabled:cursor-not-allowed disabled:opacity-45 ${difficulty === item ? item === "Nerve" ? "bg-rose-50 text-rose-800 ring-rose-200 shadow-[0_16px_35px_rgba(190,18,60,0.10)] dark:bg-slate-950 dark:text-rose-100 dark:ring-slate-800" : "bg-slate-950 text-white ring-slate-950 shadow-[0_16px_35px_rgba(15,23,42,0.16)] dark:bg-white dark:text-slate-950" : "bg-slate-50 text-slate-700 ring-slate-200 hover:bg-white dark:bg-white/10 dark:text-white/70 dark:ring-white/10"}`}
                    >{item}</button>
                  ))}
                </div>
                {difficulty === "Beginner" && <p className="mt-2 text-sm font-medium text-slate-500 dark:text-white/50">Beginner Mode adds a briefing, conversation map, and reasoning hints. It teaches structure without feeding answers.</p>}
                {difficulty === "Nerve" && <p className="mt-2 text-sm font-medium text-slate-500 dark:text-white/50">Nerve Mode is not coaching. It cross-examines your idea and exposes weak evidence, assumptions, and evasive answers.</p>}
              </div>

              {difficulty === "Nerve" && (
                <section className="mt-5 rounded-[1.5rem] bg-white p-4 text-slate-950 shadow-[0_18px_50px_rgba(15,23,42,0.08)] ring-1 ring-slate-200 dark:bg-slate-950 dark:text-white dark:shadow-none dark:ring-slate-800">
                  <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-rose-700 dark:text-rose-200">
                    <Zap size={16} /> Nerve Mode
                  </div>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-600 dark:text-white/64">Defend your ideas under pressure. Upload or paste material, choose the panel, then survive cross-examination.</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-white/80">
                      Entry type
                      <select value={nerveEntryType} onChange={(e) => setNerveEntryType(e.target.value as NerveEntryType)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none dark:border-white/10 dark:bg-white/10 dark:text-white dark:[color-scheme:dark]">
                        {nerveEntryTypes.map((item) => <option key={item}>{item}</option>)}
                      </select>
                    </label>
                    <label className="text-sm font-semibold text-slate-700 dark:text-white/80">
                      Panel persona
                      <select value={nervePersona} onChange={(e) => setNervePersona(e.target.value as NervePersona)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none dark:border-white/10 dark:bg-white/10 dark:text-white dark:[color-scheme:dark]">
                        {nervePersonas.map((item) => <option key={item}>{item}</option>)}
                      </select>
                    </label>
                  </div>
                  <label className="mt-4 block text-sm font-semibold text-slate-700 dark:text-white/80">
                    Upload material
                    <input type="file" accept=".txt,.md,.csv,.json,.pdf,.ppt,.pptx,.doc,.docx" onChange={(e) => handleNerveMaterial(e.target.files?.[0]).catch(() => undefined)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-950 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white dark:border-white/10 dark:bg-white/10 dark:text-white dark:file:bg-white dark:file:text-slate-950" />
                  </label>
                  {nerveMaterialName && <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-white/45">Loaded: {nerveMaterialName}</p>}
                  <label className="mt-4 block text-sm font-semibold text-slate-700 dark:text-white/80">
                    Key claims, abstract, slide notes, or proposal text
                    <textarea value={nerveMaterialText} onChange={(e) => setNerveMaterialText(e.target.value.slice(0, 8000))} rows={5} className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-rose-300 focus:ring-4 focus:ring-rose-100 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder:text-white/30 dark:focus:border-rose-200/50 dark:focus:ring-rose-200/10" placeholder="Paste the argument you want attacked. Example: Remote work improves productivity because..." />
                  </label>
                  <button type="button" onClick={() => {
                    setTopic("Remote work improves productivity");
                    setContext("Nerve Mode demo. The panel should challenge evidence quality, industry exclusions, measurement, and selection bias.");
                    setGoal("Defend the claim with evidence, logic, consistency, and composure.");
                    setNerveMaterialText("Claim: Remote work improves productivity. The defense should address evidence, excluded industries, measurement quality, team effects, and selection bias.");
                    setNervePersona("Mixed Panel");
                    setNerveEntryType("Topic");
                  }} className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800 ring-1 ring-rose-100 dark:bg-white dark:text-slate-950 dark:ring-white">
                    <Sparkles size={16} /> Load sample challenge
                  </button>
                </section>
              )}

              {/* Duration — category-aware */}
              <div className="mt-5 rounded-[1.5rem] bg-violet-50 px-4 py-4 dark:bg-violet-400/15">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-violet-700 dark:text-violet-100">
                    <Clock size={16} /> Session length
                  </div>
                  <span className="text-xs font-medium text-violet-500 dark:text-violet-200/70">
                    Recommended for {practiceType}: {config.minDuration}–{config.maxDuration} min
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  {customDuration ? (
                    <input
                      type="number"
                      min={config.minDuration}
                      max={config.maxDuration}
                      aria-label="Session length in minutes"
                      title="Session length in minutes"
                      value={durationPreference}
                      onChange={(e) => setDurationPreference(Math.min(config.maxDuration, Math.max(config.minDuration, Number(e.target.value) || config.minDuration)))}
                      className="w-28 rounded-xl bg-white px-3 py-2 text-lg font-bold text-violet-800 outline-none dark:bg-white/10 dark:text-violet-100"
                    />
                  ) : (
                    <select
                      aria-label="Session length"
                      title="Session length"
                      value={durationPreference}
                      onChange={(e) => setDurationPreference(Number(e.target.value))}
                      className="rounded-xl bg-white px-3 py-2 text-lg font-bold text-violet-800 outline-none dark:bg-white/10 dark:text-violet-100"
                    >
                      {Array.from({ length: Math.floor((config.maxDuration - config.minDuration) / 5) + 1 }, (_, i) => {
                        const val = config.minDuration + i * 5;
                        return val <= config.maxDuration ? val : null;
                      }).filter(Boolean).map((minutes) => (
                        <option key={minutes} value={minutes!}>{minutes} min{minutes === config.defaultDuration ? " (default)" : ""}</option>
                      ))}
                    </select>
                  )}
                  <button type="button" onClick={() => setCustomDuration((v) => !v)} className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-violet-700 ring-1 ring-violet-100 dark:bg-white/10 dark:text-violet-100 dark:ring-white/10">
                    {customDuration ? "Presets" : "Custom"}
                  </button>
                </div>
              </div>

              <div className="mt-5">
                <LanguageSelector
                  practiceLanguage={practiceLanguage}
                  feedbackLanguage={feedbackLanguage}
                  onPracticeLanguageChange={(language) => { setPracticeLanguage(language); updateLanguagePreferences(language, feedbackLanguage).catch(() => undefined); }}
                  onFeedbackLanguageChange={(language) => { setFeedbackLanguage(language); updateLanguagePreferences(practiceLanguage, language).catch(() => undefined); }}
                />
              </div>

              <section className="mt-5 rounded-[1.5rem] bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-white/10 dark:ring-white/10">
                <ConversationModeToggle value={preferredConversationMode} onChange={setPreferredConversationMode} />
              </section>

              {error && <p className="mt-4 rounded-2xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p>}

              <div className="mt-6 flex gap-3">
                <button type="button" aria-label="Back to scenario" onClick={() => setStep(1)} className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-5 py-4 font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-white/10 dark:text-white/80 dark:hover:bg-white/15">
                  <ArrowLeft size={18} />
                </button>
                <button type="button" onClick={() => setStep(3)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#6200a8] px-5 py-4 font-semibold text-white shadow-[0_18px_38px_rgba(98,0,168,0.22)] transition hover:-translate-y-0.5 hover:bg-[#50008b]">
                  Next: Pick your environment <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Environment ── */}
          {step === 3 && (
            <div className="rounded-[2rem] bg-white p-6 shadow-[0_24px_70px_rgba(35,45,75,0.08)] ring-1 ring-slate-200/75 dark:bg-white/10 dark:ring-white/10">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-white/75">
                <UsersRound size={16} /> Visual environment
              </div>
              <AICharacterEnvironment mode={environmentMode} preview />
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                {environmentModes.map((mode) => (
                  <button key={mode} type="button" onClick={() => setEnvironmentMode(mode)}
                    className={`min-h-16 rounded-2xl px-3 py-3 text-left text-xs font-bold leading-5 ring-1 transition ${environmentMode === mode ? "bg-slate-950 text-white ring-slate-950 shadow-[0_14px_34px_rgba(15,23,42,0.14)] dark:bg-white dark:text-slate-950 dark:ring-white" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50 dark:bg-white/10 dark:text-white/70 dark:ring-white/10 dark:hover:bg-white/14"}`}
                  >{mode}</button>
                ))}
              </div>
              <div className="mt-6 flex gap-3">
                <button type="button" aria-label="Back to pressure settings" onClick={() => setStep(2)} className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-5 py-4 font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-white/10 dark:text-white/80 dark:hover:bg-white/15">
                  <ArrowLeft size={18} />
                </button>
                <button type="button" onClick={() => setStep(4)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#6200a8] px-5 py-4 font-semibold text-white shadow-[0_18px_38px_rgba(98,0,168,0.22)] transition hover:-translate-y-0.5 hover:bg-[#50008b]">
                  Next: Read your briefing <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: Briefing ── */}
          {step === 4 && (
            <div className="space-y-4">
              {/* Persona + pressure arc header */}
              <div className="rounded-[2rem] bg-gradient-to-br from-[#3d006b] to-[#6200a8] p-6 text-white shadow-[0_24px_60px_rgba(98,0,168,0.30)]">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-violet-200">
                  <UsersRound size={14} /> Who you're facing
                </div>
                <p className="mt-3 text-lg font-semibold leading-7">{config.aiPersona}</p>
                <div className="mt-4 rounded-2xl bg-white/10 px-4 py-3 text-sm font-medium leading-6 text-violet-100">
                  <span className="font-bold text-white">Pressure arc:</span> {config.pressureArc}
                </div>
              </div>

              {/* Prep sections */}
              {briefingSections.map((section) => (
                <div key={section.heading} className="rounded-[1.75rem] bg-white p-5 shadow-[0_8px_30px_rgba(35,45,75,0.06)] ring-1 ring-slate-200/75 dark:bg-white/10 dark:ring-white/10">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-white/40">
                    {section.heading === "Your brief" ? <BookOpen size={13} /> : section.heading.startsWith("Prepare") ? <Sparkles size={13} /> : section.heading.startsWith("What good") ? <Target size={13} /> : <BookOpen size={13} />}
                    {section.heading}
                  </div>
                  <p className="mt-3 whitespace-pre-line text-sm font-medium leading-7 text-slate-700 dark:text-white/80">{section.body}</p>
                </div>
              ))}

              {/* Success */}
              <div className="rounded-[1.75rem] bg-emerald-50 p-5 ring-1 ring-emerald-100 dark:bg-emerald-400/10 dark:ring-emerald-400/20">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                  <Check size={13} /> What good looks like
                </div>
                <p className="mt-3 text-sm font-semibold leading-7 text-emerald-800 dark:text-emerald-100">{config.successLooks}</p>
              </div>

              <div className="flex gap-3">
                <button type="button" aria-label="Back to environment" onClick={() => setStep(3)} className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-5 py-4 font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-white/10 dark:text-white/80 dark:hover:bg-white/15">
                  <ArrowLeft size={18} />
                </button>
                <button type="button" onClick={() => setStep(5)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#6200a8] px-5 py-4 font-semibold text-white shadow-[0_18px_38px_rgba(98,0,168,0.22)] transition hover:-translate-y-0.5 hover:bg-[#50008b]">
                  I'm ready — continue <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 5: Ready ── */}
          {step === 5 && (
            <div className="rounded-[2rem] bg-white p-6 shadow-[0_24px_70px_rgba(35,45,75,0.08)] ring-1 ring-slate-200/75 dark:bg-white/10 dark:ring-white/10">
              {/* Summary card */}
              <div className="mb-6 rounded-[1.5rem] bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-white/8 dark:ring-white/10">
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-white/30">Your session</div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {([["Arena", practiceType], ["Difficulty", difficulty], ["Duration", `${durationPreference} min`], ["Environment", environmentMode]] as const).map(([label, value]) => (
                    <div key={label} className="rounded-2xl bg-white p-3 ring-1 ring-slate-200 dark:bg-white/10 dark:ring-white/10">
                      <div className="text-xs font-semibold text-slate-400 dark:text-white/35">{label}</div>
                      <div className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white">{value}</div>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => setStep(1)} className="mt-3 text-xs font-semibold text-violet-600 underline underline-offset-2 dark:text-violet-300">
                  Edit scenario
                </button>
              </div>

              <section className="rounded-[1.5rem] bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-white/10 dark:ring-white/10">
                <label className="flex cursor-pointer items-start gap-3">
                  <input type="checkbox" checked={createRoutine} onChange={(e) => setCreateRoutine(e.target.checked)} className="mt-1 size-5 accent-[#6200a8]" />
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
                        <input type="time" value={preferredTime} onChange={(e) => setPreferredTime(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none dark:border-white/10 dark:bg-white/10 dark:text-white" />
                      </label>
                      <label className="text-sm font-semibold text-slate-700 dark:text-white/75">
                        Notify me
                        <select value={reminderMinutesBefore} onChange={(e) => setReminderMinutesBefore(Number(e.target.value))} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none dark:border-white/10 dark:bg-white/10 dark:text-white">
                          {[0, 5, 15, 30, 60].map((m) => <option key={m} value={m}>{m === 0 ? "At start time" : `${m} min before`}</option>)}
                        </select>
                      </label>
                      <div className="rounded-2xl bg-white p-4 text-sm font-semibold text-violet-700 ring-1 ring-slate-200 dark:bg-white/10 dark:text-violet-100 dark:ring-white/10">
                        <Bell className="mr-2 inline" size={16} /> Saved to dashboard routine
                      </div>
                    </div>
                  </div>
                )}
              </section>

              <div className="mt-5">
                <CameraSignalControls
                  enabled={cameraAssistedTiming}
                  onEnabledChange={(enabled) => updateCameraAssistedTiming(enabled).catch(() => undefined)}
                />
              </div>

              <label className="mt-5 block text-sm font-semibold text-slate-700 dark:text-white/75">
                Optional coaching style
                <textarea value={optionalNotes} onChange={(e) => setOptionalNotes(e.target.value)} rows={2} className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:border-white/10 dark:bg-white/10 dark:text-white" placeholder="Example: interrupt me if I ramble, challenge weak evidence, stay professional" />
              </label>

              {error && <p className="mt-4 rounded-2xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p>}

              {usage && usage.limit !== "unlimited" && (
                <div className="mt-5 rounded-[1.25rem] bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-white/[0.05] dark:ring-white/10">
                  <div className="flex items-center justify-between text-sm font-semibold text-slate-700 dark:text-white/70">
                    <span>{usage.used} of {usage.limit as number} sessions used this month</span>
                    <span className="text-xs text-slate-400 dark:text-white/38">Resets {usage.resetDate}</span>
                  </div>
                  <progress
                    value={usage.used}
                    max={usage.limit as number}
                    className={`mt-2 h-2 w-full rounded-full [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-slate-200 dark:[&::-webkit-progress-bar]:bg-white/10 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:transition-all ${(usage.used / (usage.limit as number)) >= 0.9 ? "[&::-webkit-progress-value]:bg-rose-500" : "[&::-webkit-progress-value]:bg-[#6200a8]"}`}
                  />
                  {usage.remaining === 0 && (
                    <p className="mt-2 text-sm font-semibold text-rose-600 dark:text-rose-400">
                      No sessions remaining. <a href="/pricing" className="underline">Upgrade your plan</a> to continue.
                    </p>
                  )}
                  {typeof usage.remaining === "number" && usage.remaining > 0 && usage.remaining <= 3 && (
                    <p className="mt-2 text-sm font-semibold text-amber-600 dark:text-amber-400">
                      {usage.remaining} session{usage.remaining !== 1 ? "s" : ""} remaining this month.
                    </p>
                  )}
                </div>
              )}
              <div className="mt-6 flex gap-3">
                <button type="button" aria-label="Back to briefing" onClick={() => setStep(4)} className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-5 py-4 font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-white/10 dark:text-white/80 dark:hover:bg-white/15">
                  <ArrowLeft size={18} />
                </button>
                <button type="submit" disabled={loading || (usage?.remaining === 0 && usage?.limit !== "unlimited")} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#6200a8] px-5 py-4 font-semibold text-white shadow-[0_18px_38px_rgba(98,0,168,0.22)] transition hover:-translate-y-0.5 hover:bg-[#50008b] disabled:opacity-60">
                  {loading ? "Building the room..." : usage?.remaining === 0 && usage?.limit !== "unlimited" ? "Session limit reached" : "Enter rehearsal room"} <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}
        </form>
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
