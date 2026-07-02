"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Minus, Plus, SkipForward } from "lucide-react";
import type { IntakeAnswers, PracticeType } from "@/lib/types";

// ── Per-type intake config ─────────────────────────────────────────────────

type IntakeConfig = {
  situationLabel: string;
  situationPlaceholder: string;
  eventLabel: string;
  weakSpots: string[];
};

const intakeConfig: Record<PracticeType, IntakeConfig> = {
  "Job Interview": {
    situationLabel: "What role and company are you targeting?",
    situationPlaceholder: "e.g. Senior Product Manager at Stripe",
    eventLabel: "When is your interview?",
    weakSpots: ["Structuring answers (STAR)", "Freezing under pressure", "Being too vague", "Handling unexpected questions", "Showing enthusiasm", "Salary discussion", "Demonstrating depth"],
  },
  "U.S. Visa Interview": {
    situationLabel: "Which U.S. visa interview are you preparing for?",
    situationPlaceholder: "e.g. F-1 student visa for an MS program",
    eventLabel: "When is your consular interview?",
    weakSpots: ["Explaining travel purpose", "Answering concisely", "Funding questions", "Home-country ties", "Study or work plans", "Document consistency", "Unexpected follow-ups"],
  },
  "Presentation / Public Speaking": {
    situationLabel: "What are you presenting and to whom?",
    situationPlaceholder: "e.g. Q3 roadmap to 12 board members",
    eventLabel: "When is the presentation?",
    weakSpots: ["Opening with impact", "Losing the thread mid-way", "Handling interruptions", "Q&A under pressure", "Filler words (um, uh)", "Pacing too fast", "Reading from slides"],
  },
  "Panel Discussion": {
    situationLabel: "What's the panel topic and your role on it?",
    situationPlaceholder: "e.g. AI ethics panel at a tech conference",
    eventLabel: "When is the panel?",
    weakSpots: ["Being too long-winded", "Getting cut off", "Handling direct contradiction", "Standing out memorably", "Responding quickly", "Holding a position under challenge", "Bridging to my key point"],
  },
  "Thesis Defense": {
    situationLabel: "What field and thesis topic are you defending?",
    situationPlaceholder: "e.g. Computational linguistics — neural discourse coherence",
    eventLabel: "When is your viva or defense?",
    weakSpots: ["Methodology challenges", "Defending assumptions", "Hostile examiner questions", "Acknowledging limitations confidently", "Going blank under pressure", "Explaining to non-specialists", "Managing time"],
  },
  "Salary Negotiation": {
    situationLabel: "What's the negotiation situation?",
    situationPlaceholder: "e.g. Offer of $90k, I know the role pays $110k",
    eventLabel: "When does this conversation happen?",
    weakSpots: ["Anchoring first", "Caving to silence", "Negotiating against myself", "Handling 'budget is fixed'", "Asking for non-salary items", "Staying calm when pushed", "Knowing when to stop"],
  },
  "Difficult Conversation": {
    situationLabel: "What's the situation and who is it with?",
    situationPlaceholder: "e.g. Addressing consistent missed deadlines with a direct report",
    eventLabel: "When do you need to have this conversation?",
    weakSpots: ["Staying calm when escalated", "Describing behaviour not character", "Avoiding the conversation", "Managing my own emotions", "Keeping it on track", "Being direct without being harsh", "Agreeing on a clear next step"],
  },
  "Teaching Session": {
    situationLabel: "What are you teaching and who is your audience?",
    situationPlaceholder: "e.g. Explaining machine learning to a non-technical team of 15",
    eventLabel: "When is the session?",
    weakSpots: ["Using too much jargon", "Losing the audience", "Handling questions I don't know", "Pacing the content", "Making it engaging", "Checking understanding", "Edge case questions"],
  },
  "Sales Pitch": {
    situationLabel: "What are you pitching and to whom?",
    situationPlaceholder: "e.g. SaaS analytics platform to a mid-market CFO",
    eventLabel: "When is the pitch?",
    weakSpots: ["Handling the ROI objection", "'We already have something'", "Timing objections", "Competitor questions", "Not discounting too fast", "Reading the room", "Closing without desperation"],
  },
  "Casual Chat": {
    situationLabel: "Any specific context or goal for this practice?",
    situationPlaceholder: "e.g. Networking at a tech event, meeting new people",
    eventLabel: "Any relevant date or deadline?",
    weakSpots: ["Running out of things to say", "Awkward silences", "Sounding scripted", "Active listening", "Asking good follow-up questions", "Expressing opinions confidently", "Natural transitions"],
  },
  "Podcast / Interview Show": {
    situationLabel: "What show or topic are you preparing for?",
    situationPlaceholder: "e.g. Tech podcast about my startup journey, expert interview on AI",
    eventLabel: "When is the recording?",
    weakSpots: ["Giving PR-safe non-answers", "Weak origin story", "No memorable soundbites", "Avoiding controversial opinions", "Rambling without a point", "Losing energy mid-answer", "Handling curveball questions"],
  },
};

// ── Slider ─────────────────────────────────────────────────────────────────

const RATING_LABELS: Record<number, string> = {
  1: "Not at all",
  2: "Slightly",
  3: "Somewhat",
  4: "Quite",
  5: "Very",
};

function RatingSlider({ label, sublabel, value, onChange }: { label: string; sublabel: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <div className="font-semibold text-slate-900 dark:text-white">{label}</div>
          <div className="mt-0.5 text-xs font-medium text-slate-500 dark:text-white/50">{sublabel}</div>
        </div>
        <span className="shrink-0 text-sm font-bold text-[#6200a8] dark:text-violet-300">{RATING_LABELS[value]}</span>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button type="button" title="Decrease" aria-label="Decrease" onClick={() => onChange(Math.max(1, value - 1))} className="grid size-7 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 dark:bg-white/10 dark:text-white/60">
          <Minus size={13} />
        </button>
        <div className="flex-1">
          <progress
            value={value - 1}
            max={4}
            className="h-2 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-slate-100 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-[#6200a8] [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-[#6200a8] dark:[&::-webkit-progress-bar]:bg-white/10 dark:[&::-webkit-progress-value]:bg-violet-400 dark:[&::-moz-progress-bar]:bg-violet-400"
          />
          <div className="mt-2 flex justify-between text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 dark:text-white/30">
            <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
          </div>
        </div>
        <button type="button" title="Increase" aria-label="Increase" onClick={() => onChange(Math.min(5, value + 1))} className="grid size-7 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 dark:bg-white/10 dark:text-white/60">
          <Plus size={13} />
        </button>
      </div>
    </div>
  );
}

// ── Suggested difficulty from ratings ──────────────────────────────────────

function suggestDifficulty(confidence: number, frequency: number): string {
  const avg = (confidence + frequency) / 2;
  if (avg <= 1.5) return "Beginner";
  if (avg <= 2.5) return "Beginner";
  if (avg <= 3.5) return "Intermediate";
  if (avg <= 4.2) return "Advanced";
  return "Advanced";
}

// ── Step definitions ────────────────────────────────────────────────────────

const STEP_TITLES = ["Your situation", "Weak spots", "Rate yourself"];
const STEP_SUBTITLES = [
  "Tell us about your specific event so the AI can tailor every session to your actual scenario.",
  "Pick the areas where you most often struggle. The AI will front-load pressure here first.",
  "An honest rating helps us calibrate the starting difficulty — we can always adjust later.",
];

// ── Main wizard ─────────────────────────────────────────────────────────────

interface Props {
  practiceType: PracticeType;
  onComplete: (answers: IntakeAnswers) => void;
  onSkip: () => void;
}

export function CourseIntakeWizard({ practiceType, onComplete, onSkip }: Props) {
  const cfg = intakeConfig[practiceType] ?? intakeConfig["Job Interview"];

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  // Step 1
  const [situation, setSituation] = useState("");
  const [eventDate, setEventDate] = useState("");

  // Step 2
  const [weakSpots, setWeakSpots] = useState<string[]>([]);

  // Step 3
  const [confidence, setConfidence] = useState(3);
  const [frequency, setFrequency] = useState(2);

  function toggleSpot(spot: string) {
    setWeakSpots((prev) =>
      prev.includes(spot)
        ? prev.filter((s) => s !== spot)
        : prev.length < 3
        ? [...prev, spot]
        : prev
    );
  }

  function next() {
    if (step < 2) {
      setDirection(1);
      setStep((s) => s + 1);
    } else {
      finish();
    }
  }

  function back() {
    setDirection(-1);
    setStep((s) => s - 1);
  }

  function finish() {
    onComplete({
      situation: situation.trim() || undefined,
      eventDate: eventDate || undefined,
      weakSpots: weakSpots.length ? weakSpots : undefined,
      confidenceLevel: confidence,
      practiceFrequency: frequency,
    });
  }

  const slide = {
    initial: { opacity: 0, x: direction * 32 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: direction * -32 },
    transition: { duration: 0.22, ease: "easeOut" },
  };

  return (
    <div>
      {/* Progress bar + step label */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-white/35">
            Step {step + 1} of 3 — {STEP_TITLES[step]}
          </p>
          <button type="button" onClick={onSkip} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 transition hover:text-slate-600 dark:text-white/30 dark:hover:text-white/60">
            <SkipForward size={12} /> Skip intake
          </button>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
          <motion.div
            className="h-full rounded-full bg-[#6200a8] dark:bg-violet-400"
            animate={{ width: `${((step + 1) / 3) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <p className="mt-2.5 text-sm font-medium text-slate-500 dark:text-white/50">{STEP_SUBTITLES[step]}</p>
      </div>

      {/* Step content */}
      <div className="relative min-h-[240px]">
        <AnimatePresence mode="wait" initial={false}>
          {step === 0 && (
            <motion.div key="step0" {...slide} className="space-y-4">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700 dark:text-white/70">{cfg.situationLabel}</span>
                <input
                  value={situation}
                  onChange={(e) => setSituation(e.target.value)}
                  placeholder={cfg.situationPlaceholder}
                  className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 font-medium text-slate-950 outline-none transition focus:border-violet-300 dark:border-white/10 dark:bg-white/10 dark:text-white dark:focus:border-violet-500"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700 dark:text-white/70">{cfg.eventLabel}</span>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 font-medium text-slate-950 outline-none transition focus:border-violet-300 dark:border-white/10 dark:bg-white/10 dark:text-white dark:focus:border-violet-500"
                />
              </label>
              <p className="text-xs font-medium text-slate-400 dark:text-white/30">Both fields are optional but the more you share, the more personalised each session will be.</p>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="step1" {...slide}>
              <div className="flex flex-wrap gap-2">
                {cfg.weakSpots.map((spot) => {
                  const selected = weakSpots.includes(spot);
                  const maxed = weakSpots.length >= 3 && !selected;
                  return (
                    <button
                      key={spot}
                      type="button"
                      onClick={() => toggleSpot(spot)}
                      disabled={maxed}
                      className={`rounded-full px-4 py-2 text-sm font-semibold ring-1 transition disabled:opacity-40 ${
                        selected
                          ? "bg-[#6200a8] text-white ring-transparent"
                          : "bg-white text-slate-600 ring-slate-200 hover:ring-violet-300 dark:bg-white/10 dark:text-white/70 dark:ring-white/10 dark:hover:ring-violet-500"
                      }`}
                    >
                      {spot}
                    </button>
                  );
                })}
              </div>
              <p className="mt-4 text-xs font-medium text-slate-400 dark:text-white/30">
                {weakSpots.length === 0 && "Pick up to 3 — skip if you're not sure yet."}
                {weakSpots.length > 0 && weakSpots.length < 3 && `${3 - weakSpots.length} more you can pick.`}
                {weakSpots.length === 3 && "Maximum 3 selected. Deselect one to change."}
              </p>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" {...slide} className="space-y-6">
              <RatingSlider
                label="How confident are you in this situation right now?"
                sublabel="1 = very nervous, 5 = very confident"
                value={confidence}
                onChange={setConfidence}
              />
              <RatingSlider
                label="How much deliberate practice have you done in this area?"
                sublabel="1 = none, 5 = regular structured practice"
                value={frequency}
                onChange={setFrequency}
              />
              <div className="rounded-2xl bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-700 ring-1 ring-violet-100 dark:bg-violet-400/10 dark:text-violet-300 dark:ring-violet-400/20">
                Suggested starting difficulty: <span className="font-bold">{suggestDifficulty(confidence, frequency)}</span> — you can change this any time.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="mt-7 flex items-center justify-between gap-3">
        {step > 0 ? (
          <button type="button" onClick={back} className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:-translate-y-0.5 dark:bg-white/10 dark:text-white/80 dark:ring-white/10">
            <ArrowLeft size={15} /> Back
          </button>
        ) : (
          <div />
        )}
        <button
          type="button"
          onClick={next}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#6200a8] px-6 py-3 font-semibold text-white shadow-[0_14px_30px_rgba(98,0,168,0.22)] transition hover:-translate-y-0.5"
        >
          {step < 2 ? (
            <><span>Next</span><ArrowRight size={15} /></>
          ) : (
            <><span>Set schedule</span><ArrowRight size={15} /></>
          )}
        </button>
      </div>
    </div>
  );
}
