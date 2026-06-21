"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Minus, Plus, Sparkles } from "lucide-react";
import { generateCourse } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { courseHref } from "@/lib/routes";
import type { CourseSkillLevel, Difficulty, PracticeType } from "@/lib/types";
import { practiceTypes } from "@/lib/types";

// ── Per-type weak spot banks ───────────────────────────────────────────────

const weakSpotBank: Record<PracticeType, string[]> = {
  "Job Interview": ["Structuring answers (STAR)", "Freezing under pressure", "Being too vague", "Handling unexpected questions", "Demonstrating depth", "Salary discussion"],
  "Presentation / Public Speaking": ["Opening with impact", "Losing the thread", "Handling interruptions", "Q&A under pressure", "Filler words", "Pacing"],
  "Panel Discussion": ["Being too long-winded", "Getting cut off", "Holding position under challenge", "Standing out memorably", "Responding quickly"],
  "Thesis Defense": ["Methodology challenges", "Defending assumptions", "Going blank under pressure", "Acknowledging limitations", "Managing time"],
  "Salary Negotiation": ["Anchoring first", "Caving to silence", "Not negotiating against myself", "Handling 'budget is fixed'", "Staying calm when pushed"],
  "Difficult Conversation": ["Staying calm when escalated", "Describing behaviour not character", "Being direct without being harsh", "Managing my own emotions", "Agreeing a clear next step"],
  "Teaching Session": ["Using too much jargon", "Losing the audience", "Handling unknown questions", "Pacing the content", "Checking understanding"],
  "Sales Pitch": ["Handling ROI objections", "Not discounting too fast", "Competitor questions", "Reading the room", "Closing without desperation"],
  "Casual Chat": ["Running out of things to say", "Sounding scripted", "Active listening", "Asking follow-up questions", "Expressing opinions confidently"],
};

// ── Shared sub-components ──────────────────────────────────────────────────

function RatingSlider({ label, sublabel, value, onChange }: { label: string; sublabel: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <div className="font-semibold text-slate-900 dark:text-white">{label}</div>
          <div className="mt-0.5 text-xs font-medium text-slate-500 dark:text-white/50">{sublabel}</div>
        </div>
        <span className="shrink-0 rounded-full bg-violet-50 px-2.5 py-0.5 text-sm font-bold text-violet-700 dark:bg-violet-400/10 dark:text-violet-300">{value}</span>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button type="button" title="Decrease" aria-label="Decrease" onClick={() => onChange(Math.max(1, value - 1))} className="grid size-7 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/60">
          <Minus size={13} />
        </button>
        <progress
          value={value - 1}
          max={4}
          className="h-2 flex-1 overflow-hidden rounded-full [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-slate-100 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-[#6200a8] [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-[#6200a8] dark:[&::-webkit-progress-bar]:bg-white/10 dark:[&::-webkit-progress-value]:bg-violet-400 dark:[&::-moz-progress-bar]:bg-violet-400"
        />
        <button type="button" title="Increase" aria-label="Increase" onClick={() => onChange(Math.min(5, value + 1))} className="grid size-7 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/60">
          <Plus size={13} />
        </button>
      </div>
    </div>
  );
}

function ChipButton({ label, selected, onToggle, disabled = false }: { label: string; selected: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`rounded-full px-4 py-2 text-sm font-semibold ring-1 transition disabled:opacity-40 ${
        selected
          ? "bg-[#6200a8] text-white ring-transparent shadow-[0_8px_20px_rgba(98,0,168,0.2)]"
          : "bg-white text-slate-600 ring-slate-200 hover:ring-violet-300 dark:bg-white/10 dark:text-white/70 dark:ring-white/10"
      }`}
    >
      {label}
    </button>
  );
}

// ── Step metadata ──────────────────────────────────────────────────────────

const STEPS = [
  { title: "Your goal",        sub: "What outcome do you want from this training? Be specific — it shapes every session." },
  { title: "Your situation",   sub: "Tell us about the specific event or role you're preparing for and who you are." },
  { title: "Weak spots",       sub: "Pick the arenas you want to train and flag where you struggle most." },
  { title: "Commitment",       sub: "How much time can you dedicate and when do you need to be ready?" },
  { title: "Self-assessment",  sub: "An honest rating helps us calibrate starting difficulty and track your growth." },
];

// ── Main component ─────────────────────────────────────────────────────────

export function CourseGenerator() {
  const router = useRouter();
  const { getToken, profile, userId } = useAuth();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 0 — Goal
  const [goal, setGoal] = useState("");

  // Step 1 — Situation
  const [situation, setSituation] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [eventDate, setEventDate] = useState("");

  // Step 2 — Arenas + weak spots
  const [categories, setCategories] = useState<PracticeType[]>([]);
  const [weakSpots, setWeakSpots] = useState<string[]>([]);

  // Step 3 — Commitment
  const [weeklyHours, setWeeklyHours] = useState(3);
  const [duration, setDuration] = useState(20);

  // Step 4 — Self-assessment
  const [confidence, setConfidence] = useState(3);
  const [practiceFreq, setPracticeFreq] = useState(2);
  const [pressure, setPressure] = useState(2);

  // ── Derived ──

  function suggestDifficulty(): Difficulty {
    const avg = (confidence + practiceFreq + pressure) / 3;
    if (avg <= 2) return "Beginner";
    if (avg <= 3.2) return "Intermediate";
    if (avg <= 4) return "Advanced";
    return "Advanced";
  }

  function suggestSkillLevel(): CourseSkillLevel {
    const avg = (confidence + practiceFreq) / 2;
    if (avg <= 2) return "beginner";
    if (avg <= 3.5) return "intermediate";
    return "advanced";
  }

  // ── Navigation ──

  function go(next: number) {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  }

  function canProceed(): boolean {
    if (step === 0) return goal.trim().length >= 10;
    if (step === 2) return categories.length > 0;
    return true;
  }

  // ── Weak spots from selected arenas ──

  const availableSpots = Array.from(new Set(categories.flatMap((c) => weakSpotBank[c] ?? [])));

  function toggleCategory(type: PracticeType) {
    setCategories((prev) => prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]);
    // drop weak spots that no longer belong to any selected category
    const next = categories.includes(type)
      ? categories.filter((t) => t !== type)
      : [...categories, type];
    const valid = new Set(next.flatMap((c) => weakSpotBank[c] ?? []));
    setWeakSpots((ws) => ws.filter((s) => valid.has(s)));
  }

  function toggleSpot(spot: string) {
    setWeakSpots((prev) =>
      prev.includes(spot)
        ? prev.filter((s) => s !== spot)
        : prev.length < 5 ? [...prev, spot] : prev
    );
  }

  // ── Submit ──

  async function submit() {
    if (categories.length === 0) { setError("Select at least one practice arena."); return; }
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      const bundle = await generateCourse({
        userId,
        goal: goal.trim(),
        skillLevel: suggestSkillLevel(),
        targetRole: targetRole.trim() || undefined,
        availableHoursPerWeek: weeklyHours,
        preferredSessionDuration: duration,
        targetCompletionDate: eventDate || undefined,
        practiceCategories: categories,
        difficulty: suggestDifficulty(),
        practiceLanguage: profile?.preferredPracticeLanguage || "en",
        feedbackLanguage: profile?.preferredFeedbackLanguage || "en",
        intakeAnswers: {
          situation: situation.trim() || undefined,
          eventDate: eventDate || undefined,
          weakSpots: weakSpots.length ? weakSpots : undefined,
          confidenceLevel: confidence,
          practiceFrequency: practiceFreq,
        },
      }, token);
      router.push(courseHref(bundle.course.id));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not generate course.");
    } finally {
      setLoading(false);
    }
  }

  const slide = {
    initial: { opacity: 0, x: direction * 40 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: direction * -40 },
    transition: { duration: 0.22, ease: "easeOut" },
  };

  return (
    <section className="relative overflow-hidden rounded-[2.4rem] bg-white/80 p-6 ring-1 ring-slate-200/80 backdrop-blur-2xl dark:bg-white/[0.07] dark:ring-white/12 md:p-8">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-400/20 blur-3xl" />

      <div className="relative">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-baseline justify-between mb-1.5">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-white/35">
              Step {step + 1} of {STEPS.length} — {STEPS[step].title}
            </p>
            <p className="text-xs font-semibold text-slate-400 dark:text-white/30">{step + 1}/{STEPS.length}</p>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
            <motion.div
              className="h-full rounded-full bg-[#6200a8] dark:bg-violet-400"
              animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="mt-2 text-sm font-medium text-slate-500 dark:text-white/50">{STEPS[step].sub}</p>
        </div>

        {/* Step content */}
        <div className="min-h-[300px]">
          <AnimatePresence mode="wait" initial={false}>

            {/* ── Step 0: Goal ──────────────────────────────────────────── */}
            {step === 0 && (
              <motion.div key="s0" {...slide} className="space-y-4">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-700 dark:text-white/70">What do you want to achieve?</span>
                  <textarea
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    rows={4}
                    placeholder="e.g. I want to handle hostile Q&A with composure and give concise, confident answers without freezing up when I don't know something"
                    className="rounded-[1.4rem] border border-slate-200 bg-white/80 p-4 font-medium text-slate-950 outline-none transition focus:border-violet-300 dark:border-white/10 dark:bg-white/10 dark:text-white"
                  />
                </label>
                <p className="text-xs font-medium text-slate-400 dark:text-white/30">
                  The more specific you are, the better the AI can build missions that match your real situation.
                </p>
              </motion.div>
            )}

            {/* ── Step 1: Situation ─────────────────────────────────────── */}
            {step === 1 && (
              <motion.div key="s1" {...slide} className="space-y-4">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-700 dark:text-white/70">What specific event or scenario are you preparing for?</span>
                  <input
                    value={situation}
                    onChange={(e) => setSituation(e.target.value)}
                    placeholder="e.g. Final round interview at DeepMind for a research scientist role"
                    className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 font-medium text-slate-950 outline-none transition focus:border-violet-300 dark:border-white/10 dark:bg-white/10 dark:text-white"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-700 dark:text-white/70">Your role or title <span className="font-normal text-slate-400">(optional)</span></span>
                  <input
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g. Founder, product manager, PhD student, sales director"
                    className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 font-medium text-slate-950 outline-none transition focus:border-violet-300 dark:border-white/10 dark:bg-white/10 dark:text-white"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-700 dark:text-white/70">Event date <span className="font-normal text-slate-400">(optional — sets your deadline)</span></span>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 font-medium text-slate-950 outline-none transition focus:border-violet-300 dark:border-white/10 dark:bg-white/10 dark:text-white"
                  />
                </label>
              </motion.div>
            )}

            {/* ── Step 2: Arenas + weak spots ───────────────────────────── */}
            {step === 2 && (
              <motion.div key="s2" {...slide} className="space-y-5">
                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-white/70">Practice arenas <span className="font-normal text-slate-400">(pick all that apply)</span></p>
                  <div className="flex flex-wrap gap-2">
                    {practiceTypes.map((type) => (
                      <ChipButton key={type} label={type} selected={categories.includes(type)} onToggle={() => toggleCategory(type)} />
                    ))}
                  </div>
                </div>

                {availableSpots.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-white/70">
                      Where do you struggle most? <span className="font-normal text-slate-400">Pick up to 5</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {availableSpots.map((spot) => {
                        const selected = weakSpots.includes(spot);
                        const maxed = weakSpots.length >= 5 && !selected;
                        return (
                          <ChipButton key={spot} label={spot} selected={selected} onToggle={() => toggleSpot(spot)} disabled={maxed} />
                        );
                      })}
                    </div>
                    <p className="mt-2 text-xs font-medium text-slate-400 dark:text-white/30">
                      {weakSpots.length > 0
                        ? `${weakSpots.length} selected · ${5 - weakSpots.length} more available`
                        : "The AI will use these to front-load pressure on your specific gaps first."}
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Step 3: Commitment ────────────────────────────────────── */}
            {step === 3 && (
              <motion.div key="s3" {...slide} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-700 dark:text-white/70">Hours available per week</span>
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 dark:border-white/10 dark:bg-white/10">
                      <button type="button" onClick={() => setWeeklyHours(Math.max(1, weeklyHours - 1))} className="grid size-7 place-items-center rounded-full bg-slate-100 dark:bg-white/10"><Minus size={13} /></button>
                      <span className="flex-1 text-center text-lg font-bold text-slate-900 dark:text-white">{weeklyHours}h</span>
                      <button type="button" onClick={() => setWeeklyHours(Math.min(20, weeklyHours + 1))} className="grid size-7 place-items-center rounded-full bg-slate-100 dark:bg-white/10"><Plus size={13} /></button>
                    </div>
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-slate-700 dark:text-white/70">Session length (minutes)</span>
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 dark:border-white/10 dark:bg-white/10">
                      <button type="button" onClick={() => setDuration(Math.max(5, duration - 5))} className="grid size-7 place-items-center rounded-full bg-slate-100 dark:bg-white/10"><Minus size={13} /></button>
                      <span className="flex-1 text-center text-lg font-bold text-slate-900 dark:text-white">{duration} min</span>
                      <button type="button" onClick={() => setDuration(Math.min(90, duration + 5))} className="grid size-7 place-items-center rounded-full bg-slate-100 dark:bg-white/10"><Plus size={13} /></button>
                    </div>
                  </label>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 ring-1 ring-slate-200 dark:bg-white/[0.04] dark:text-white/55 dark:ring-white/10">
                  That's roughly <strong className="text-slate-900 dark:text-white">{Math.round((weeklyHours * 60) / duration)} sessions per week</strong>.
                  {eventDate && (
                    <span> You have <strong className="text-slate-900 dark:text-white">{Math.max(0, Math.ceil((new Date(eventDate).getTime() - Date.now()) / 86_400_000))} days</strong> until your event.</span>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── Step 4: Self-assessment ───────────────────────────────── */}
            {step === 4 && (
              <motion.div key="s4" {...slide} className="space-y-6">
                <RatingSlider
                  label="How confident are you in this area right now?"
                  sublabel="1 = very nervous · 5 = very confident"
                  value={confidence}
                  onChange={setConfidence}
                />
                <RatingSlider
                  label="How much deliberate practice have you done here?"
                  sublabel="1 = none · 5 = regular structured practice"
                  value={practiceFreq}
                  onChange={setPracticeFreq}
                />
                <RatingSlider
                  label="How well do you perform under pressure compared to alone?"
                  sublabel="1 = much worse · 5 = same or better"
                  value={pressure}
                  onChange={setPressure}
                />
                <div className="rounded-2xl bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-700 ring-1 ring-violet-100 dark:bg-violet-400/10 dark:text-violet-300 dark:ring-violet-400/20">
                  Suggested: <span className="font-bold">{suggestDifficulty()}</span> · Skill level: <span className="font-bold capitalize">{suggestSkillLevel()}</span>
                  <span className="block mt-1 font-medium text-violet-500 dark:text-violet-400/70">Both will be applied to your generated program and can be changed at any time.</span>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-2xl bg-rose-50 p-4 font-semibold text-rose-700 dark:bg-rose-400/10 dark:text-rose-100">{error}</div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between gap-3">
          {step > 0 ? (
            <button type="button" onClick={() => go(step - 1)} className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:-translate-y-0.5 dark:bg-white/10 dark:text-white/80 dark:ring-white/10">
              <ArrowLeft size={15} /> Back
            </button>
          ) : <div />}

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => go(step + 1)}
              disabled={!canProceed()}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#6200a8] px-6 py-3 font-semibold text-white shadow-[0_14px_30px_rgba(98,0,168,0.22)] transition hover:-translate-y-0.5 disabled:opacity-50"
            >
              Next <ArrowRight size={15} />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={loading || categories.length === 0}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#6200a8] px-7 py-3.5 text-lg font-bold text-white shadow-[0_18px_44px_rgba(98,0,168,0.25)] transition hover:-translate-y-0.5 disabled:opacity-60"
            >
              <Sparkles size={18} />
              {loading ? "Generating your program…" : "Generate my course"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
