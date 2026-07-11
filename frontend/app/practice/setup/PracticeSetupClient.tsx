"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Bell, BookOpen, CalendarClock, Check, Clock, Sparkles, Target, UsersRound, Zap } from "lucide-react";
import { Suspense } from "react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { AnimatedCard, AnimatedPage, StaggeredGrid } from "@/components/animations";
import { AICharacterEnvironment } from "@/components/AICharacterEnvironment";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CameraSignalControls } from "@/components/local-signals/CameraSignalControls";
import { Nav } from "@/components/Nav";
import { ConversationModeToggle } from "@/components/session/ConversationModeToggle";
import { createPracticeSchedule, createSession, generateRandomScenario } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { getCourseConfig } from "@/lib/courseConfig";
import { canUsePracticeType, getDailyDocUsage, getUserEntitlements, getSessionUsage, incrementDailyDocCount, type UsageInfo } from "@/lib/entitlements";
import { sessionHref } from "@/lib/routes";
import { trackLead } from "@/lib/metaPixel";
import { updateTelemetryConsent } from "@/lib/telemetry";
import type { LanguageCode } from "@/lib/languages";
import { difficulties, Difficulty, environmentModes, nerveEntryTypes, nervePersonas, practiceTypes, PracticeType, visaTypes, type VisaType } from "@/lib/types";
import type { ConversationMode, DocumentMode, EnvironmentMode, NerveEntryType, NervePersona } from "@/lib/types";
import type { Entitlements } from "@/lib/admin";

const frequencyOptions = [
  ["daily", "Daily"],
  ["twice_weekly", "Twice weekly"],
  ["three_times_weekly", "Three times weekly"],
  ["weekdays", "Weekdays"],
  ["custom", "Mon / Wed / Fri"],
] as const;

const quickStarts: Record<PracticeType, Array<{ label: string; topic: string; context: string; goal: string; notes: string; visaType?: VisaType }>> = {
  "Job Interview": [
    { label: "Final-round PM interview", topic: "Senior product manager interview", context: "I am meeting a skeptical VP in a final round. They care about judgment, prioritization, leadership, and handling ambiguity.", goal: "Sound clear, calm, senior, and evidence-backed under pressure.", notes: "Push me when I become generic or vague." },
    { label: "Career switch story", topic: "Career transition interview", context: "I need to explain why I am moving into this role and make my previous experience feel relevant.", goal: "Tell a convincing story without rambling.", notes: "Probe weak logic and missing evidence." },
    { label: "Technical role screening", topic: "Software engineering or technical role interview", context: "I am being screened by a technical lead who will test my system design thinking, past architectural decisions, and trade-off reasoning.", goal: "Demonstrate technical depth, clear reasoning, and honest acknowledgement of trade-offs.", notes: "Drill into specifics — don't accept hand-wavy architecture answers." },
  ],
  "U.S. Visa Interview": [
    { label: "Visitor / business visa", visaType: "Visitor / Business (B-1/B-2)", topic: "U.S. B-1/B-2 visa interview", context: "I am applying for temporary travel to the United States and need to explain my purpose, itinerary, funding, and circumstances clearly and truthfully.", goal: "Give brief, consistent answers without sounding memorized or evasive.", notes: "Act as a professional consular officer. Probe inconsistencies, but do not invent legal requirements or promise an outcome." },
    { label: "Student visa", visaType: "Student (F-1)", topic: "U.S. F-1 student visa interview", context: "I need to explain my program choice, academic plans, funding, and post-study intentions in a concise and truthful way.", goal: "Show a coherent study plan and answer follow-ups calmly.", notes: "Check consistency across my school choice, finances, academic background, and plans. Do not coach me to conceal facts." },
    { label: "Work visa", visaType: "Employment / Work", topic: "U.S. employment visa interview", context: "I am preparing to discuss my employer, role, qualifications, and supporting petition or application accurately.", goal: "Answer role and eligibility questions clearly while staying aligned with my real documents.", notes: "Ask realistic document and employment follow-ups. This is communication practice, not legal advice." },
  ],
  "Presentation / Public Speaking": [
    { label: "Investor-style update", topic: "Quarterly strategy presentation", context: "I am presenting strategy to a skeptical group that may question priorities, numbers, and tradeoffs.", goal: "Stay structured and persuasive during Q&A.", notes: "Ask sharp audience questions." },
    { label: "Team town hall", topic: "Team announcement", context: "I need to communicate a change clearly to a mixed audience with concerns.", goal: "Sound confident, human, and organized.", notes: "Act like a worried audience member." },
    { label: "Conference keynote opener", topic: "Industry keynote or conference talk", context: "I am opening a 20-minute talk at a professional conference. The audience knows the basics and wants a fresh angle.", goal: "Hook the audience in the first 60 seconds and land a clear, memorable thesis.", notes: "Challenge weak openers — push for a hook that actually surprises." },
  ],
  "Panel Discussion": [
    { label: "Live panel mode", topic: "Industry panel discussion", context: "I am on a panel where people may interrupt, disagree, and ask for concise opinions.", goal: "Stay sharp, brief, and memorable.", notes: "Interrupt occasionally but keep it professional." },
    { label: "Debate-style panel", topic: "Contested industry topic", context: "I am on a panel where two other panelists hold opposing views. The moderator expects me to take and defend a clear position under contradiction.", goal: "Stay specific and hold my position under multi-directional pressure.", notes: "Have one panelist agree and one disagree — force me to navigate both." },
    { label: "Fireside chat with moderator", topic: "Career or expertise fireside chat", context: "A moderator is leading a Q&A with me as the featured guest. The audience can submit questions and some are uncomfortable.", goal: "Be candid and compelling — handle pointed questions without deflecting.", notes: "Mix warm questions with pointed ones. Redirect me when I drift." },
  ],
  "Thesis Defense": [
    { label: "Methodology defense", topic: "Thesis / viva defense", context: "I need to defend my research design, assumptions, limitations, and conclusions to an academic committee.", goal: "Answer with depth, humility, and logical structure.", notes: "Challenge methodology and unsupported claims." },
    { label: "STEM quantitative defense", topic: "Quantitative research methodology defense", context: "I am defending my data collection, sampling, and statistical analysis choices to a committee that questions my sample size and validity threats.", goal: "Defend methodology with depth and acknowledge limitations without undermining the study's value.", notes: "Challenge measurement validity, sample representativeness, and generalisability." },
    { label: "Humanities / qualitative defense", topic: "Qualitative or interpretive research defense", context: "I am defending interpretive research methods and theoretical frameworks to a committee that questions my epistemological choices and contribution.", goal: "Articulate my methodological positioning clearly and defend my analytical choices.", notes: "Challenge the generalisability, framing assumptions, and novelty claim." },
  ],
  "Salary Negotiation": [
    { label: "Promotion compensation", topic: "Salary negotiation after offer", context: "I have an offer or promotion discussion and need to ask for better compensation while keeping the relationship strong.", goal: "Be direct, credible, and calm when they push back.", notes: "Act budget-conscious and ask for evidence." },
    { label: "New-offer negotiation", topic: "New job offer negotiation with recruiter", context: "I have received an offer that is below my target. I need to counter without seeming ungrateful or inflexible.", goal: "Counter professionally with a specific number and rationale, then hold firm when they push back twice.", notes: "Push back with budget constraints first, then urgency." },
    { label: "Counter-offer leverage", topic: "Counter-offer leverage negotiation", context: "I have a competing offer and want to use it as leverage to improve my current employer's package without making it an ultimatum.", goal: "Use the competing offer as leverage and close with a better deal while keeping the relationship intact.", notes: "Play it as interested but not desperate — test whether I hold the frame." },
  ],
  "Difficult Conversation": [
    { label: "Boundary conversation", topic: "Difficult conversation with colleague", context: "I need to address a repeated issue without sounding angry or passive.", goal: "Be honest, composed, and specific.", notes: "Respond emotionally but fairly." },
    { label: "Delivering bad news", topic: "Delivering a difficult decision or bad news", context: "I need to tell someone news they will not want to hear — a rejection, a layoff, or a major change that affects them personally.", goal: "Deliver the message directly and compassionately, without softening it into confusion.", notes: "React with hurt or frustration — don't make it easy for me." },
    { label: "Performance feedback", topic: "Performance conversation with a direct report", context: "I am giving feedback to someone about consistent underperformance that has started affecting the team.", goal: "Be specific, fair, and clear about expectations without letting the conversation become vague or overly emotional.", notes: "Be defensive and make me prove the specific examples before accepting them." },
  ],
  "Teaching Session": [
    { label: "Explain a hard concept", topic: "Teaching a complex topic", context: "I need to teach people who are curious but confused and may ask basic or challenging questions.", goal: "Explain simply without sounding impatient.", notes: "Ask confused student questions." },
    { label: "Step-by-step process teaching", topic: "Teaching a process or multi-step skill", context: "I need to walk someone through a complex process. They understand the goal but not the steps, and they get stuck at specific points.", goal: "Explain each step clearly and verify understanding before moving on.", notes: "Get stuck at a specific step and ask me to explain it three different ways." },
    { label: "Skeptical 'but why' learner", topic: "Teaching a concept to a skeptical learner", context: "My student keeps asking 'but why does it work that way?' and seems unconvinced by surface explanations. They want to understand the real mechanism.", goal: "Satisfy their deeper curiosity with genuine reasoning, not just reassurance.", notes: "Keep asking 'but why' until the explanation reaches first principles." },
  ],
  "Sales Pitch": [
    { label: "Skeptical buyer call", topic: "Sales discovery and pitch", context: "I am pitching a solution to a buyer who worries about cost, urgency, and implementation risk.", goal: "Handle objections without becoming pushy.", notes: "Challenge ROI and timing." },
    { label: "Warm-lead upsell", topic: "Upselling an existing customer to a higher tier", context: "I am talking to a customer who already uses our product but has been on the basic plan. I want to move them up using what I know about their actual usage.", goal: "Show the specific value of upgrading for their situation — no generic pitch.", notes: "Make me prove the upgrade is worth the price difference specifically for them." },
    { label: "Price-objection close", topic: "Sales call with a heavy price objection", context: "I am talking to a buyer who likes the product but says it is too expensive and keeps comparing it to a cheaper competitor.", goal: "Hold my price, differentiate on value clearly, and close without discounting.", notes: "Return to the price objection twice — make me defend the number twice before testing whether I fold." },
  ],
  "Casual Chat": [
    { label: "Coffee catch-up", topic: "Catching up over coffee", context: "I am having a relaxed chat with a friend I haven't seen in a while.", goal: "Speak naturally and keep the conversation flowing without overthinking.", notes: "Be warm, curious, and genuine." },
    { label: "New acquaintance", topic: "Getting to know someone new", context: "I just met someone at an event and want to have a friendly, genuine conversation.", goal: "Ask good questions, share naturally, and avoid awkward silences.", notes: "Be friendly and curious." },
    { label: "Open-ended chat", topic: "Just talking", context: "No specific scenario — I want to practice keeping a natural conversation going on any topic.", goal: "Feel comfortable and present without overthinking.", notes: "Follow my lead on topic and energy." },
  ],
  "Podcast / Interview Show": [
    { label: "Tech founder story", topic: "My journey building a startup", context: "I am a guest on a tech podcast being interviewed about building my company from scratch.", goal: "Deliver a compelling origin story with specific moments and honest lessons.", notes: "Have a controversial opinion ready." },
    { label: "Expert guest", topic: "My area of expertise", context: "I am a subject-matter expert being interviewed on a podcast in my field.", goal: "Sound authoritative and quotable — give real insights, not safe generalities.", notes: "Avoid PR-speak. Be direct." },
    { label: "Career retrospective", topic: "Career journey and lessons learned", context: "I am a guest on a career-focused podcast being asked about my path, key decisions, and what I would do differently.", goal: "Give honest, specific answers about my decisions — including the failures and the pivots.", notes: "Push past the polished narrative — ask about a real failure and what it cost me." },
  ],
};

// Job Interview and Salary Negotiation are grounded in real background material — the AI
// needs a CV and the role it's being weighed against to ask questions that trace to actual
// specifics instead of generic ones, so both boxes are required for these two types.
const DOCUMENT_REQUIRED_TYPES: PracticeType[] = ["Job Interview", "Salary Negotiation"];

const DOCUMENT_TEMPLATES: Partial<Record<PracticeType, { resume: string; job: string }>> = {
  "Job Interview": {
    resume: "Product Marketing Manager with 5 years of experience leading go-to-market launches for B2B SaaS products. Grew qualified pipeline 40% YoY by rebuilding positioning and messaging for our flagship product. Managed a team of 2 and partnered closely with sales, product, and design. Previously worked in growth marketing at an early-stage startup.",
    job: "Hiring a Senior Product Marketing Manager to own positioning, launches, and sales enablement for our core platform. You'll work cross-functionally with product, sales, and design, reporting to the VP of Marketing. Looking for 4+ years of B2B SaaS marketing experience and a track record of driving measurable pipeline growth.",
  },
  "Salary Negotiation": {
    resume: "Senior Software Engineer with 6 years of experience, currently earning $125,000 base. Led the migration of our core service to a new architecture, cutting infra costs by 30%. Consistently rated a top performer and mentors two junior engineers.",
    job: "Received a competing offer from another company: $140,000 base plus equity for a similar senior engineering role. Bringing this to my current manager to negotiate a raise and see if they can match or beat it before I decide.",
  },
};

function buildDocumentText(resume: string, job: string) {
  return `=== CANDIDATE CV / RESUME ===\n${resume.trim()}\n\n=== JOB OPPORTUNITY / ROLE DETAILS ===\n${job.trim()}`;
}

const STEP_LABELS = ["Scenario", "How"];

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
  // Skip environment / briefing / ready steps for brand-new users — they just
  // want to start. Steps 3-5 are available on every subsequent session.
  const isFirstSession = params.get("first") === "true";
  // First-time signups land on a minimal role + difficulty picker instead of the full
  // setup form, so they reach their first interview in seconds. "Customize instead"
  // drops through to the full form below without losing any of its functionality.
  const [quickStartMode, setQuickStartMode] = useState(isFirstSession);
  // Picking role + difficulty isn't the same as being ready to talk to an AI — this adds
  // one explicit "ready?" beat before we ever create the session and enter the live room,
  // instead of dropping people straight from a button click into the AI room.
  const [quickStartConfirming, setQuickStartConfirming] = useState(false);
  const leadTrackedRef = useRef(false);
  const [step, setStep] = useState(1);
  const [practiceType, setPracticeType] = useState<PracticeType>((params.get("type") as PracticeType) || "Job Interview");
  const [visaType, setVisaType] = useState<VisaType>("Visitor / Business (B-1/B-2)");
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
  const [useDocument, setUseDocument] = useState(false);
  const [documentText, setDocumentText] = useState("");
  const [documentMode, setDocumentMode] = useState<DocumentMode>("neutral");
  const [resumeText, setResumeText] = useState("");
  const [jobText, setJobText] = useState("");
  const [docUsage, setDocUsage] = useState<{ used: number; limit: number | "unlimited"; remaining: number | "unlimited" } | null>(null);
  const [customDuration, setCustomDuration] = useState(false);
  const [createRoutine, setCreateRoutine] = useState(false);
  const [frequencyType, setFrequencyType] = useState<"daily" | "twice_weekly" | "three_times_weekly" | "weekdays" | "custom">("daily");
  const [preferredTime, setPreferredTime] = useState("20:00");
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState(15);
  const { getToken, profile, userId } = useAuth();
  const [practiceLanguage, setPracticeLanguage] = useState<LanguageCode>("en");
  const [feedbackLanguage, setFeedbackLanguage] = useState<LanguageCode>("en");
  const [cameraAssistedTiming, setCameraAssistedTiming] = useState(Boolean(profile?.privacySettings?.allowCameraAssistedTiming));

  useEffect(() => {
    if (!isFirstSession || leadTrackedRef.current) return;
    leadTrackedRef.current = true;
    trackLead();
  }, [isFirstSession]);

  useEffect(() => {
    getUserEntitlements(userId).then((e) => {
      setEntitlements(e);
      getSessionUsage(userId, e).then(setUsage).catch(() => undefined);
      getDailyDocUsage(userId, e).then(setDocUsage).catch(() => undefined);
    }).catch(() => undefined);
  }, [userId]);

  useEffect(() => {
    if (profile?.preferredPracticeLanguage) setPracticeLanguage(profile.preferredPracticeLanguage);
    if (profile?.preferredFeedbackLanguage) setFeedbackLanguage(profile.preferredFeedbackLanguage);
    setCameraAssistedTiming(Boolean(profile?.privacySettings?.allowCameraAssistedTiming));
  }, [profile?.preferredFeedbackLanguage, profile?.preferredPracticeLanguage, profile?.privacySettings?.allowCameraAssistedTiming]);

  // Auto-set duration and document mode when the arena changes
  useEffect(() => {
    setDurationPreference(getCourseConfig(practiceType).defaultDuration);
    setCustomDuration(false);
    if (practiceType === "Job Interview" || practiceType === "Salary Negotiation" || practiceType === "U.S. Visa Interview" || practiceType === "Thesis Defense" || practiceType === "Sales Pitch" || practiceType === "Podcast / Interview Show") {
      setDocumentMode("profile");
    } else {
      setDocumentMode("neutral");
    }
    if (practiceType === "U.S. Visa Interview" || DOCUMENT_REQUIRED_TYPES.includes(practiceType)) setUseDocument(true);
  }, [practiceType]);

  // CV + job opportunity are collected as two separate boxes for these types, then merged
  // into the single documentText field the rest of the form/backend already expects.
  useEffect(() => {
    if (!DOCUMENT_REQUIRED_TYPES.includes(practiceType)) return;
    setDocumentText(resumeText.trim() || jobText.trim() ? buildDocumentText(resumeText, jobText) : "");
  }, [resumeText, jobText, practiceType]);

  async function updateCameraAssistedTiming(enabled: boolean) {
    setCameraAssistedTiming(enabled);
    const token = await getToken();
    const current = profile?.privacySettings || {
      allowTelemetry: true,
      allowModelImprovement: true,
      allowRawAudioStorage: false,
      allowCameraAssistedTiming: true,
      allowLocalSignalTelemetry: false,
      allowRawVideoStorage: false as const,
    };
    await updateTelemetryConsent(userId, { ...current, allowCameraAssistedTiming: enabled, allowRawVideoStorage: false }, token).catch(() => undefined);
  }

  // Accepts overrides so the quick-start flow can supply topic/context/goal from a
  // template and start immediately, without waiting a render cycle for setState to
  // flush into `topic`/`context`/`goal` first.
  async function startSession(overrides?: { topic?: string; context?: string; goal?: string; optionalNotes?: string }) {
    setError("");
    const effectiveTopic = overrides?.topic ?? topic;
    const effectiveContext = overrides?.context ?? context;
    const effectiveGoal = overrides?.goal ?? goal;
    const effectiveNotes = overrides?.optionalNotes ?? optionalNotes;
    if (practiceType === "U.S. Visa Interview") {
      const words = documentText.trim() ? documentText.trim().split(/\s+/).length : 0;
      if (!visaType) { setError("Select the U.S. visa interview type."); return; }
      if (!useDocument || words < 50) {
        setError("Paste a redacted application and background brief of at least 50 words so the officer can keep questions relevant and consistent.");
        return;
      }
    }
    if (DOCUMENT_REQUIRED_TYPES.includes(practiceType)) {
      const resumeWords = resumeText.trim() ? resumeText.trim().split(/\s+/).length : 0;
      const jobWords = jobText.trim() ? jobText.trim().split(/\s+/).length : 0;
      if (resumeWords < 25 || jobWords < 25) {
        setError("Add your CV/résumé and the job opportunity (or use the example) — both are required, at least a few sentences each, so the AI can ask targeted questions instead of generic ones.");
        return;
      }
    }
    if (entitlements) {
      if (difficulty === "Brutal" && !entitlements.allowBrutalMode) { setError("Brutal mode requires Pro or Coach."); return; }
      if (difficulty === "Nerve" && !entitlements.allowNerveMode && !entitlements.allowBrutalMode) { setError("Nerve Mode requires Pro or Coach."); return; }
      if (!canUsePracticeType(entitlements, practiceType)) { setError("This practice mode is not included in your current plan."); return; }
      if (usage && usage.limit !== "unlimited" && usage.remaining === 0) {
        setError(`You've used all ${usage.limit} sessions this month. Upgrade your plan for more. Resets ${usage.resetDate}.`);
        return;
      }
      if (useDocument && documentText.trim()) {
        const docWordCount = documentText.trim().split(/\s+/).length;
        if (docWordCount < 50) {
          setError("Document is too short — paste at least 50 words for meaningful grounding.");
          return;
        }
        if (docUsage && docUsage.limit !== "unlimited" && docUsage.remaining === 0) {
          setError(`You've reached your daily document limit (${docUsage.limit}/day). Resets at midnight UTC.`);
          return;
        }
      }
    }
    setLoading(true);
    try {
      const token = await getToken();
      if (createRoutine && typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
        await Notification.requestPermission().catch(() => undefined);
      }
      const session = await createSession({
        userId, practiceType, difficulty, topic: effectiveTopic, context: effectiveContext, goal: effectiveGoal, optionalNotes: effectiveNotes,
        ...(practiceType === "U.S. Visa Interview" ? { visaType } : {}),
        practiceLanguage, feedbackLanguage, durationPreference, environmentMode, preferredConversationMode,
        ...(difficulty === "Nerve" ? { nerveEntryType, nervePersona, nerveMaterialName, nerveMaterialText } : {}),
        ...(useDocument && documentText.trim() ? { documentText: documentText.trim(), documentName: DOCUMENT_REQUIRED_TYPES.includes(practiceType) ? "CV + job opportunity" : "pasted document", documentMode } : {}),
      }, token);
      if (useDocument && documentText.trim()) {
        incrementDailyDocCount(userId).catch(() => undefined);
      }
      if (createRoutine) {
        await createPracticeSchedule({
          userId, frequencyType,
          daysOfWeek: frequencyType === "weekdays" ? [1, 2, 3, 4, 5] : frequencyType === "twice_weekly" ? [2, 4] : frequencyType === "three_times_weekly" || frequencyType === "custom" ? [1, 3, 5] : [],
          preferredTime, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
          enabled: true, categories: [practiceType], durationPreference, reminderMinutesBefore,
        }, token).catch(() => undefined);
      }
      router.push(sessionHref(session.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start session. Please try again.");
      setLoading(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await startSession();
  }

  function applyTemplate(t: { topic: string; context: string; goal: string; notes: string; visaType?: VisaType }) {
    setTopic(t.topic);
    setContext(t.context);
    setGoal(t.goal);
    setOptionalNotes(t.notes);
    if (t.visaType) setVisaType(t.visaType);
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

  // Pre-compute usage display so TypeScript can narrow properly outside JSX.
  const usageSection = usage !== null && usage.limit !== "unlimited" ? (() => {
    const numLimit = usage.limit as number;
    const numRemaining = usage.remaining as number;
    return { numLimit, numRemaining, used: usage.used, resetDate: usage.resetDate };
  })() : null;

  if (quickStartMode && quickStartConfirming) {
    return (
      <main className="min-h-screen overflow-hidden bg-[#f4f8fc] dark:bg-[#0e1020]">
        <Nav />
        <AnimatedPage className="relative mx-auto max-w-xl px-4 py-10 md:py-14">
          <div className="pointer-events-none absolute right-10 top-20 h-72 w-72 rounded-full bg-violet-300/20 blur-3xl" />
          <div className="rounded-[2rem] bg-white p-6 shadow-[0_24px_70px_rgba(35,45,75,0.08)] ring-1 ring-slate-200/75 dark:bg-white/10 dark:ring-white/10">
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 ring-1 ring-violet-100 dark:bg-white/10 dark:text-violet-100 dark:ring-white/10">
              <Target size={14} /> Ready check
            </div>
            <h1 className="mt-3 text-2xl font-semibold leading-[1.05] tracking-[-0.03em] text-slate-950 dark:text-white sm:text-3xl">
              {practiceType} · {difficulty}
            </h1>
            <p className="mt-3 text-sm font-medium leading-6 text-slate-600 dark:text-white/60">
              This is a live spoken conversation with an AI — it will ask you questions and react to your answers, out loud. Your first session is 3 minutes, then you will get a scored report.
            </p>
            <ul className="mt-4 space-y-2 text-sm font-medium text-slate-600 dark:text-white/60">
              <li className="flex items-start gap-2"><Check size={16} className="mt-0.5 shrink-0 text-emerald-500" /> Your browser will ask for microphone access — allow it to talk out loud, or type instead.</li>
              <li className="flex items-start gap-2"><Check size={16} className="mt-0.5 shrink-0 text-emerald-500" /> Find a quiet spot. You can end early at any time.</li>
            </ul>

            {DOCUMENT_REQUIRED_TYPES.includes(practiceType) && (
              <div className="mt-5 rounded-2xl bg-slate-50 p-4 dark:bg-white/10">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-slate-600 dark:text-white/60">
                    Add your CV and the role — required so the AI asks targeted questions. 30 seconds, or use an example.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const template = DOCUMENT_TEMPLATES[practiceType];
                      if (!template) return;
                      setResumeText(template.resume);
                      setJobText(template.job);
                    }}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-violet-100 px-3 py-2 text-xs font-bold text-violet-700 transition hover:bg-violet-200 dark:bg-white/10 dark:text-violet-200"
                  >
                    <Sparkles size={13} /> Use example
                  </button>
                </div>
                <label className="mt-3 block text-xs font-semibold text-slate-600 dark:text-white/60">
                  Your CV / résumé
                  <textarea
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value.slice(0, 4000))}
                    rows={3}
                    placeholder="Paste your CV, LinkedIn summary, or a few lines about your background…"
                    className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder:text-white/30"
                  />
                </label>
                <label className="mt-3 block text-xs font-semibold text-slate-600 dark:text-white/60">
                  Job opportunity / description
                  <textarea
                    value={jobText}
                    onChange={(e) => setJobText(e.target.value.slice(0, 4000))}
                    rows={3}
                    placeholder="Paste the job posting, offer details, or a few lines about the role…"
                    className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder:text-white/30"
                  />
                </label>
              </div>
            )}

            {error && <p className="mt-4 rounded-2xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p>}

            <button
              type="button"
              disabled={loading || (DOCUMENT_REQUIRED_TYPES.includes(practiceType) && (!resumeText.trim() || !jobText.trim()))}
              onClick={() => {
                const template = quickStarts[practiceType][0];
                applyTemplate(template);
                startSession({ topic: template.topic, context: template.context, goal: template.goal, optionalNotes: template.notes }).catch(() => undefined);
              }}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#6200a8] px-5 py-4 font-semibold text-white shadow-[0_18px_38px_rgba(98,0,168,0.22)] transition hover:-translate-y-0.5 hover:bg-[#50008b] disabled:opacity-60"
            >
              {loading ? "Building your room…" : <>Begin interview <ArrowRight size={18} /></>}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => setQuickStartConfirming(false)}
              className="mt-3 w-full text-center text-sm font-semibold text-slate-500 underline underline-offset-2 hover:text-slate-700 dark:text-white/50 dark:hover:text-white/80 disabled:opacity-50"
            >
              ← Back
            </button>
          </div>
        </AnimatedPage>
      </main>
    );
  }

  if (quickStartMode) {
    // U.S. Visa Interview always requires a pasted document — not a fit for a
    // zero-friction quick start, so it's only offered from the full customize form.
    const quickStartRoles = practiceTypes.filter((type) => type !== "U.S. Visa Interview");
    const quickStartDifficulties: Difficulty[] = ["Beginner", "Intermediate", "Advanced"];
    return (
      <main className="min-h-screen overflow-hidden bg-[#f4f8fc] dark:bg-[#0e1020]">
        <Nav />
        <AnimatedPage className="relative mx-auto max-w-2xl px-4 py-10 md:py-14">
          <div className="pointer-events-none absolute right-10 top-20 h-72 w-72 rounded-full bg-violet-300/20 blur-3xl" />
          <div className="relative mb-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 ring-1 ring-violet-100 dark:bg-white/10 dark:text-violet-100 dark:ring-white/10">
              <Sparkles size={14} /> Quick start
            </div>
            <h1 className="mt-3 text-3xl font-semibold leading-[0.98] tracking-[-0.04em] text-slate-950 dark:text-white md:text-4xl">
              Let&apos;s get you talking
            </h1>
            <p className="mt-3 text-base font-medium leading-7 text-slate-600 dark:text-white/60">
              Pick what you&apos;re practising and how hard it should push. You can fine-tune everything else later.
            </p>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-[0_24px_70px_rgba(35,45,75,0.08)] ring-1 ring-slate-200/75 dark:bg-white/10 dark:ring-white/10">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-white/75">
              <Target size={16} /> What are you practising?
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {quickStartRoles.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setPracticeType(role)}
                  className={`rounded-2xl px-4 py-3 text-left text-sm font-semibold ring-1 transition ${practiceType === role ? "bg-slate-950 text-white ring-slate-950 shadow-[0_16px_35px_rgba(15,23,42,0.16)] dark:bg-white dark:text-slate-950" : "bg-slate-50 text-slate-700 ring-slate-200 hover:bg-white dark:bg-white/10 dark:text-white/70 dark:ring-white/10"}`}
                >
                  {role}
                </button>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-white/75">
              <Zap size={16} /> Difficulty
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {quickStartDifficulties.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setDifficulty(item)}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold ring-1 transition ${difficulty === item ? "bg-slate-950 text-white ring-slate-950 shadow-[0_16px_35px_rgba(15,23,42,0.16)] dark:bg-white dark:text-slate-950" : "bg-slate-50 text-slate-700 ring-slate-200 hover:bg-white dark:bg-white/10 dark:text-white/70 dark:ring-white/10"}`}
                >
                  {item}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setQuickStartConfirming(true)}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#6200a8] px-5 py-4 font-semibold text-white shadow-[0_18px_38px_rgba(98,0,168,0.22)] transition hover:-translate-y-0.5 hover:bg-[#50008b]"
            >
              Continue <ArrowRight size={18} />
            </button>
            <button
              type="button"
              onClick={() => setQuickStartMode(false)}
              className="mt-3 w-full text-center text-sm font-semibold text-slate-500 underline underline-offset-2 hover:text-slate-700 dark:text-white/50 dark:hover:text-white/80"
            >
              Customize instead (topic, duration, environment…)
            </button>
          </div>
        </AnimatedPage>
      </main>
    );
  }

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

              {practiceType === "U.S. Visa Interview" && (
                <label className="mt-5 block text-sm font-semibold text-slate-700 dark:text-white/75">
                  U.S. visa interview type
                  <select value={visaType} onChange={(e) => setVisaType(e.target.value as VisaType)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:border-white/10 dark:bg-white/10 dark:text-white">
                    {visaTypes.map((type) => <option key={type}>{type}</option>)}
                  </select>
                  <span className="mt-2 block text-xs font-medium leading-5 text-slate-500 dark:text-white/45">This selection is sent to the officer persona and retained for every question in the session.</span>
                </label>
              )}

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
                      onWheel={(e) => e.currentTarget.blur()}
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

              <section className="mt-5 rounded-[1.5rem] bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-white/10 dark:ring-white/10">
                <ConversationModeToggle value={preferredConversationMode} onChange={setPreferredConversationMode} />
              </section>

              {/* ── Document grounding ── */}
              <section className="mt-5 rounded-[1.5rem] bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-white/10 dark:ring-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-white/75">
                    <BookOpen size={16} /> {practiceType === "U.S. Visa Interview" ? "Application and background brief (required)" : DOCUMENT_REQUIRED_TYPES.includes(practiceType) ? "CV and job opportunity (required)" : "Ground in a document"}
                  </div>
                  <button
                    type="button"
                    onClick={() => { if (practiceType !== "U.S. Visa Interview" && !DOCUMENT_REQUIRED_TYPES.includes(practiceType)) { setUseDocument((v) => !v); if (useDocument) setDocumentText(""); } }}
                    disabled={practiceType === "U.S. Visa Interview" || DOCUMENT_REQUIRED_TYPES.includes(practiceType)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold ring-1 transition ${useDocument ? "bg-slate-950 text-white ring-slate-950 dark:bg-white dark:text-slate-950" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50 dark:bg-white/10 dark:text-white/60 dark:ring-white/10"}`}
                  >
                    {useDocument ? "On" : "Off"}
                  </button>
                </div>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-white/45">
                  {practiceType === "U.S. Visa Interview"
                    ? "Paste a redacted summary of your real application, travel or study/work purpose, funding, background, and relevant CV details. Never paste passport, case, bank-account, or other sensitive identification numbers."
                    : DOCUMENT_REQUIRED_TYPES.includes(practiceType)
                    ? "The AI needs your CV and the role to ask questions that trace to real specifics instead of generic ones."
                    : "Paste your CV, research, pitch deck, or any text — the AI reads it before the session and asks targeted questions from it."}
                </p>

                {useDocument && DOCUMENT_REQUIRED_TYPES.includes(practiceType) && (
                  <div className="mt-4 space-y-3">
                    {docUsage && docUsage.limit !== "unlimited" && (
                      <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200 dark:bg-white/10 dark:ring-white/10">
                        <span className="text-xs font-semibold text-slate-600 dark:text-white/60">
                          {docUsage.remaining} of {docUsage.limit as number} documents remaining today
                        </span>
                        {docUsage.remaining === 0 && (
                          <span className="text-xs font-bold text-rose-600">Limit reached — resets midnight UTC</span>
                        )}
                      </div>
                    )}
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          const template = DOCUMENT_TEMPLATES[practiceType];
                          if (!template) return;
                          setResumeText(template.resume);
                          setJobText(template.job);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-violet-100 px-3 py-2 text-xs font-bold text-violet-700 transition hover:bg-violet-200 dark:bg-white/10 dark:text-violet-200"
                      >
                        <Sparkles size={13} /> Use example
                      </button>
                    </div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-white/60">
                      Your CV / résumé
                      <textarea
                        value={resumeText}
                        onChange={(e) => setResumeText(e.target.value.slice(0, 4000))}
                        rows={5}
                        className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder:text-white/30"
                        placeholder="Paste your CV, LinkedIn summary, or a few lines about your background…"
                      />
                    </label>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-white/60">
                      Job opportunity / description
                      <textarea
                        value={jobText}
                        onChange={(e) => setJobText(e.target.value.slice(0, 4000))}
                        rows={5}
                        className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder:text-white/30"
                        placeholder="Paste the job posting, offer details, or a few lines about the role…"
                      />
                    </label>
                  </div>
                )}

                {useDocument && !DOCUMENT_REQUIRED_TYPES.includes(practiceType) && (
                  <div className="mt-4 space-y-4">
                    {docUsage && docUsage.limit !== "unlimited" && (
                      <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200 dark:bg-white/10 dark:ring-white/10">
                        <span className="text-xs font-semibold text-slate-600 dark:text-white/60">
                          {docUsage.remaining} of {docUsage.limit as number} documents remaining today
                        </span>
                        {docUsage.remaining === 0 && (
                          <span className="text-xs font-bold text-rose-600">Limit reached — resets midnight UTC</span>
                        )}
                      </div>
                    )}

                    <div>
                      <div className="mb-2 text-xs font-semibold text-slate-600 dark:text-white/60">Document mode</div>
                      {practiceType === "U.S. Visa Interview" && <p className="mb-2 text-xs font-medium text-violet-700 dark:text-violet-300">Profile mode is locked for visa practice so questions stay grounded in your supplied facts.</p>}
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                        {([ ["profile", "Profile"], ["neutral", "Neutral"], ["harsh_critical", "Harsh Critical"], ["socratic", "Socratic"], ["supportive", "Supportive"] ] as [DocumentMode, string][]).filter(([id]) => practiceType !== "U.S. Visa Interview" || id === "profile").map(([id, label]) => (
                          <button key={id} type="button" onClick={() => setDocumentMode(id)}
                            className={`rounded-xl py-2.5 text-xs font-bold ring-1 transition ${documentMode === id ? "bg-slate-950 text-white ring-slate-950 shadow-[0_8px_20px_rgba(15,23,42,0.14)] dark:bg-white dark:text-slate-950" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50 dark:bg-white/10 dark:text-white/60 dark:ring-white/10"}`}
                          >{label}</button>
                        ))}
                      </div>
                      {documentMode === "profile" && <p className="mt-1.5 text-xs font-medium text-violet-700 dark:text-violet-400">AI reads your document as your background and asks targeted questions from it — ideal for CVs, research, and pitches.</p>}
                      {documentMode === "neutral" && <p className="mt-1.5 text-xs font-medium text-slate-500 dark:text-white/40">Challenges stay grounded in your document — every question traces to a specific claim or section.</p>}
                      {documentMode === "harsh_critical" && <p className="mt-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">Every gap, contradiction, and unsupported claim gets attacked. No softening.</p>}
                      {documentMode === "socratic" && <p className="mt-1.5 text-xs font-medium text-slate-500 dark:text-white/40">You'll be guided to discover weaknesses yourself through questions — no direct attacks.</p>}
                      {documentMode === "supportive" && <p className="mt-1.5 text-xs font-medium text-slate-500 dark:text-white/40">Strengths acknowledged first, then gaps probed constructively.</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-white/60">
                        Paste your document
                        <textarea
                          value={documentText}
                          onChange={(e) => {
                            const val = e.target.value;
                            const words = val.trim() ? val.trim().split(/\s+/).length : 0;
                            if (words <= 2500) setDocumentText(val);
                          }}
                          rows={7}
                          className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder:text-white/30"
                          placeholder={practiceType === "U.S. Visa Interview" ? "Paste a redacted application/background brief: purpose, intended dates, itinerary or program/employer, funding, education/work history, and relevant ties. Include only truthful facts…" : documentMode === "profile" ? "Paste your CV, LinkedIn bio, research summary, pitch deck, or any background document. The AI will read it before the session and ask targeted questions from it…" : "Paste your thesis, pitch deck, research proposal, or any text you want to defend…"}
                        />
                      </label>
                      {(() => {
                        const words = documentText.trim() ? documentText.trim().split(/\s+/).length : 0;
                        const nonAlpha = documentText.split("").filter((c) => !c.match(/[a-zA-Z\s]/)).length;
                        const symbolHeavy = documentText.length > 50 && nonAlpha / documentText.length > 0.15;
                        return (
                          <div className="mt-1.5 flex items-center justify-between gap-2">
                            <span className={`text-xs font-medium ${words > 2400 ? "text-rose-600" : "text-slate-400 dark:text-white/30"}`}>
                              {words.toLocaleString()} / 2,500 words
                            </span>
                            {symbolHeavy && (
                              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                                Math / code detected — AI will focus on reasoning, not calculations
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </section>

              {/* Routine + camera + notes — moved here from the old step 5 */}
              <section className="mt-6 rounded-[1.5rem] bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-white/[0.05] dark:ring-white/10">
                <label className="flex cursor-pointer items-start gap-3">
                  <input type="checkbox" checked={createRoutine} onChange={(e) => setCreateRoutine(e.target.checked)} className="mt-1 size-5 accent-[#6200a8]" />
                  <span>
                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white"><CalendarClock size={16} /> Add reminders / make this a routine</span>
                    <span className="mt-1 block text-sm font-medium leading-6 text-slate-600 dark:text-white/60">Save this arena to your dashboard routine and enable browser reminders.</span>
                  </span>
                </label>
                {createRoutine && (
                  <div className="mt-4 grid gap-3">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                      {frequencyOptions.map(([value, label]) => (
                        <button key={value} type="button" onClick={() => setFrequencyType(value)} className={`rounded-2xl px-3 py-2 text-xs font-semibold ring-1 transition ${frequencyType === value ? "bg-[#6200a8] text-white ring-[#6200a8]" : "bg-white text-slate-700 ring-slate-200 dark:bg-white/10 dark:text-white/70 dark:ring-white/10"}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
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
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 ring-1 ring-violet-100 dark:bg-white/10 dark:text-violet-200 dark:ring-white/10">
                      <Bell size={13} /> Saved to dashboard routine
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

              <div className="mt-6 flex gap-3">
                <button type="button" aria-label="Back to scenario" onClick={() => setStep(1)} className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-5 py-4 font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-white/10 dark:text-white/80 dark:hover:bg-white/15">
                  <ArrowLeft size={18} />
                </button>
                <button type="submit" disabled={loading || (usage?.remaining === 0 && usage?.limit !== "unlimited")} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#6200a8] px-5 py-4 font-semibold text-white shadow-[0_18px_38px_rgba(98,0,168,0.22)] transition hover:-translate-y-0.5 hover:bg-[#50008b] disabled:opacity-60">
                  {loading ? "Building the room…" : usage?.remaining === 0 && usage?.limit !== "unlimited" ? "Session limit reached" : <>Enter rehearsal room <ArrowRight size={18} /></>}
                </button>
              </div>
            </div>
          )}

          {/* Steps 3-5 removed — environment defaults to AI Orb (changeable in-session),
              briefing shown inside the room for Beginner mode, Ready was pure friction. */}
          {false && step === 3 && (
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

          {false && step === 4 && (
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

          {false && step === 5 && (
            <div className="rounded-[2rem] bg-white p-6 shadow-[0_24px_70px_rgba(35,45,75,0.08)] ring-1 ring-slate-200/75 dark:bg-white/10 dark:ring-white/10">
              {/* Summary card */}
              <div className="mb-6 rounded-[1.5rem] bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-white/10 dark:ring-white/10">
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
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                      {frequencyOptions.map(([value, label]) => (
                        <button key={value} type="button" onClick={() => setFrequencyType(value)} className={`rounded-2xl px-3 py-2 text-xs font-semibold ring-1 transition ${frequencyType === value ? "bg-[#6200a8] text-white ring-[#6200a8]" : "bg-white text-slate-700 ring-slate-200 dark:bg-white/10 dark:text-white/70 dark:ring-white/10"}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
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
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 ring-1 ring-violet-100 dark:bg-white/10 dark:text-violet-200 dark:ring-white/10">
                      <Bell size={13} /> Saved to dashboard routine
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

              {usageSection ? (
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                (() => { const u = usageSection!; return (
                <div className="mt-5 rounded-[1.25rem] bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-white/[0.05] dark:ring-white/10">
                  <div className="flex items-center justify-between text-sm font-semibold text-slate-700 dark:text-white/70">
                    <span>{u.used} of {u.numLimit} sessions used this month</span>
                    <span className="text-xs text-slate-400 dark:text-white/38">Resets {u.resetDate}</span>
                  </div>
                  <progress value={u.used} max={u.numLimit} className={`mt-2 h-2 w-full rounded-full [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-slate-200 dark:[&::-webkit-progress-bar]:bg-white/10 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:transition-all ${u.used / u.numLimit >= 0.9 ? "[&::-webkit-progress-value]:bg-rose-500" : "[&::-webkit-progress-value]:bg-[#6200a8]"}`} />
                  {u.numRemaining === 0 ? <p className="mt-2 text-sm font-semibold text-rose-600 dark:text-rose-400">No sessions remaining. <a href="/pricing" className="underline">Upgrade your plan</a> to continue.</p> : null}
                  {u.numRemaining > 0 && u.numRemaining <= 3 ? <p className="mt-2 text-sm font-semibold text-amber-600 dark:text-amber-400">{u.numRemaining} session{u.numRemaining !== 1 ? "s" : ""} remaining this month.</p> : null}
                </div>
                ); })()
              ) : null}
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
