"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BookOpen, Check, Clock, CreditCard, X } from "lucide-react";
import { PaddleCheckoutButton } from "@/components/billing/PaddleCheckoutButton";
import type { CoursePackage } from "@/lib/admin";
import { enrollCourseTemplate } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { categoryToPracticeType, getCourseConfig } from "@/lib/courseConfig";
import { courseHref } from "@/lib/routes";
import type { CourseTemplate, Difficulty, IntakeAnswers } from "@/lib/types";
import { difficulties } from "@/lib/types";
import { CourseIntakeWizard } from "./CourseIntakeWizard";

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CourseEnrollmentModal({ template, coursePackage, hasAccess, checkoutJustCompleted = false, onClose }: { template: CourseTemplate | null; coursePackage?: CoursePackage; hasAccess: boolean; checkoutJustCompleted?: boolean; onClose: () => void }) {
  const router = useRouter();
  const { getToken, profile, userId } = useAuth();

  // Two-phase flow: intake → schedule
  const [phase, setPhase] = useState<"intake" | "schedule">("intake");
  const [intakeAnswers, setIntakeAnswers] = useState<IntakeAnswers>({});

  // Schedule fields
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [days, setDays] = useState<number[]>([0, 1, 2, 3, 4]);
  const [time, setTime] = useState("20:00");
  const [reminder, setReminder] = useState(15);
  const [difficulty, setDifficulty] = useState<Difficulty>("Intermediate");

  const [loading, setLoading] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(checkoutJustCompleted);
  const [error, setError] = useState("");

  useEffect(() => {
    setPhase("intake");
    setIntakeAnswers({});
    setPaymentCompleted(checkoutJustCompleted);
    setError("");
  }, [checkoutJustCompleted, template?.id]);

  if (!template) return null;
  const resolvedTemplate = template;

  const practiceType = categoryToPracticeType[resolvedTemplate.category];

  function handleIntakeComplete(answers: IntakeAnswers) {
    setIntakeAnswers(answers);
    // Auto-suggest difficulty from self-rating
    const avg = ((answers.confidenceLevel ?? 3) + (answers.practiceFrequency ?? 2)) / 2;
    if (avg <= 2) setDifficulty("Beginner");
    else if (avg <= 3.5) setDifficulty("Intermediate");
    else setDifficulty("Advanced");
    setPhase("schedule");
  }

  function toggleDay(day: number) {
    setDays((current) => current.includes(day) ? current.filter((item) => item !== day) : [...current, day].sort());
  }

  async function enroll(attempt = 0) {
    setLoading(true);
    setError("");
    try {
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
        await Notification.requestPermission().catch(() => undefined);
      }
      const token = await getToken();
      const bundle = await enrollCourseTemplate({
        userId,
        templateId: resolvedTemplate.id,
        packageId: coursePackage?.packageId,
        preferredStartDate: startDate,
        preferredDays: days,
        preferredTime: time,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        reminderMinutesBefore: reminder,
        difficulty,
        practiceLanguage: profile?.preferredPracticeLanguage || "en",
        feedbackLanguage: profile?.preferredFeedbackLanguage || "en",
        intakeAnswers: Object.keys(intakeAnswers).length ? intakeAnswers : undefined,
      }, token);
      router.push(courseHref(bundle.course.id));
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Could not enroll in this course.";
      if (paymentCompleted && message.includes("403") && attempt < 8) {
        setError("Payment received. Waiting for access to activate...");
        await new Promise((resolve) => window.setTimeout(resolve, 1500));
        return enroll(attempt + 1);
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-xl">
      <div className="w-full max-w-2xl overflow-y-auto max-h-[calc(100vh-2rem)] rounded-[2rem] bg-white p-6 shadow-2xl ring-1 ring-slate-200 dark:bg-[#101827] dark:ring-white/10">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            {phase === "intake" ? (
              <>
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-violet-700 dark:text-cyan-100/60">Course intake</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-slate-950 dark:text-white">{resolvedTemplate.title}</h2>
              </>
            ) : (
              <>
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-violet-700 dark:text-cyan-100/60">Set your schedule</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-slate-950 dark:text-white">{resolvedTemplate.title}</h2>
              </>
            )}
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="grid size-10 place-items-center rounded-full bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="mt-6">
          {/* ── Phase 1: Intake wizard ─────────────────────────────────────── */}
          {phase === "intake" && practiceType && (
            <CourseIntakeWizard
              practiceType={practiceType}
              onComplete={handleIntakeComplete}
              onSkip={() => setPhase("schedule")}
            />
          )}

          {/* Fallback: no practice type mapped — skip straight to schedule */}
          {phase === "intake" && !practiceType && (
            <div className="py-4">
              <p className="font-medium text-slate-500 dark:text-white/50">No intake questions for this course type.</p>
              <button type="button" onClick={() => setPhase("schedule")} className="mt-4 rounded-2xl bg-[#6200a8] px-5 py-3 font-semibold text-white">
                Set schedule →
              </button>
            </div>
          )}

          {/* ── Phase 2: Schedule + confirm ───────────────────────────────── */}
          {phase === "schedule" && (
            <div className="grid gap-4">
              {/* Intake summary banner */}
              {intakeAnswers.situation && (
                <div className="rounded-2xl bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-700 ring-1 ring-violet-100 dark:bg-violet-400/10 dark:text-violet-300 dark:ring-violet-400/20">
                  Your AI will know: <span className="font-medium">{intakeAnswers.situation}</span>
                  {intakeAnswers.weakSpots && intakeAnswers.weakSpots.length > 0 && (
                    <span className="ml-1 text-violet-500 dark:text-violet-400/70">
                      · focusing on {intakeAnswers.weakSpots.slice(0, 2).join(", ")}
                    </span>
                  )}
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-white/70">
                  Start date
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-950 dark:border-white/10 dark:bg-white/10 dark:text-white" />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-white/70">
                  Practice time
                  <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-950 dark:border-white/10 dark:bg-white/10 dark:text-white" />
                </label>
              </div>

              <div>
                <div className="text-sm font-semibold text-slate-700 dark:text-white/70">Practice days</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {weekDays.map((label, index) => (
                    <button key={label} type="button" onClick={() => toggleDay(index)} className={`rounded-full px-4 py-2 text-sm font-bold ${days.includes(index) ? "bg-[#6200a8] text-white" : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/60"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-white/70">
                  Reminder
                  <select value={reminder} onChange={(e) => setReminder(Number(e.target.value))} className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-950 dark:border-white/10 dark:bg-white/10 dark:text-white">
                    <option value={0}>At scheduled time</option>
                    <option value={15}>15 min before</option>
                    <option value={30}>30 min before</option>
                    <option value={60}>60 min before</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-white/70">
                  Difficulty
                  <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)} className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-950 dark:border-white/10 dark:bg-white/10 dark:text-white">
                    {difficulties.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
              </div>

              {/* Session preview */}
              {(() => {
                if (!practiceType) return null;
                const cfg = getCourseConfig(practiceType);
                return (
                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
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
                      <span className="font-semibold text-slate-800 dark:text-white">Pressure arc:</span>{" "}
                      <span className="text-slate-600 dark:text-white/60">{cfg.pressureArc}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-white/35">
                      <BookOpen size={12} /> A personalised briefing card is shown before each session starts.
                    </div>
                  </div>
                );
              })()}

              {error && <div className="rounded-2xl bg-rose-50 p-4 font-semibold text-rose-700 dark:bg-rose-400/10 dark:text-rose-100">{error}</div>}

              {!hasAccess && !paymentCompleted && (
                <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200 dark:bg-amber-400/10 dark:ring-amber-300/20">
                  <div className="flex items-center gap-2 font-bold text-amber-950 dark:text-amber-100"><CreditCard size={17} /> Payment required before enrollment</div>
                  <p className="mt-1 text-sm font-medium text-amber-800 dark:text-amber-100/70">
                    {coursePackage
                      ? `${coursePackage.currency === "USD" ? "$" : `${coursePackage.currency} `}${coursePackage.price} one-time for ${coursePackage.sessionsIncluded} sessions. Course packages are separate from Pro and Coach subscriptions.`
                      : "This course is not currently available for purchase."}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setPhase("intake")} className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:-translate-y-0.5 dark:bg-white/10 dark:text-white/60">
                  ← Edit intake
                </button>
                {hasAccess || paymentCompleted ? (
                  <button
                    type="button"
                    onClick={() => enroll()}
                    disabled={loading || days.length === 0}
                    className="flex-1 rounded-2xl bg-[#6200a8] px-5 py-4 text-lg font-bold text-white shadow-[0_18px_44px_rgba(98,0,168,0.25)] transition hover:-translate-y-0.5 disabled:opacity-60"
                  >
                    {loading ? "Creating calendar..." : paymentCompleted ? "Activate purchased course" : "Set schedule and start"}
                  </button>
                ) : coursePackage?.paddlePriceId ? (
                  <PaddleCheckoutButton
                    priceId={coursePackage.paddlePriceId}
                    fallbackHref="/contact"
                    label={coursePackage.title}
                    onCompleted={() => {
                      setPaymentCompleted(true);
                      setError("");
                    }}
                    className="flex-1 rounded-2xl bg-[#6200a8] px-5 py-4 text-lg font-bold text-white shadow-[0_18px_44px_rgba(98,0,168,0.25)] transition hover:-translate-y-0.5 disabled:opacity-60"
                  >
                    Pay {coursePackage.currency === "USD" ? "$" : `${coursePackage.currency} `}{coursePackage.price} and continue
                  </PaddleCheckoutButton>
                ) : (
                  <Link href="/contact" className="flex-1 rounded-2xl bg-[#6200a8] px-5 py-4 text-center text-lg font-bold text-white shadow-[0_18px_44px_rgba(98,0,168,0.25)] transition hover:-translate-y-0.5">
                    Contact support
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
