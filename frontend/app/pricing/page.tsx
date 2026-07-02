"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, ChevronDown, Clock, PartyPopper, Sparkles, Zap } from "lucide-react";
import { Nav } from "@/components/Nav";
import { AnimatedCard, AnimatedPage, StaggeredGrid } from "@/components/animations";
import { AuthDialog } from "@/components/auth/AuthDialog";
import type { AuthMode } from "@/components/auth/AuthForm";
import { PaddleCheckoutButton } from "@/components/billing/PaddleCheckoutButton";
import { defaultCoursePackages, defaultPlans, getCoursePackages, getPublicPlans, type CoursePackage, type Plan } from "@/lib/admin";
import { useAuth } from "@/lib/auth";

const stakeLabel: Record<CoursePackage["stakeLevel"], string> = {
  high: "High stakes",
  medium: "Skill building",
  low: "Confidence & fluency",
};
const stakeColor: Record<CoursePackage["stakeLevel"], string> = {
  high: "bg-rose-50 text-rose-700 ring-rose-100 dark:bg-rose-400/10 dark:text-rose-300 dark:ring-rose-400/20",
  medium: "bg-violet-50 text-violet-700 ring-violet-100 dark:bg-violet-400/10 dark:text-violet-300 dark:ring-violet-400/20",
  low: "bg-sky-50 text-sky-700 ring-sky-100 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-400/20",
};

const ctaLabel = (plan: Plan) => {
  if (plan.priceMonthly === 0) return "Start free";
  return `Upgrade to ${plan.name}`;
};

const paddleMonthlyPriceId = (plan: Plan) => plan.paddleMonthlyPriceId || "";

const currencySymbol = (currency: string) => (currency === "GBP" ? "£" : "$");

const formatPrice = (plan: Plan) => {
  if (plan.priceMonthly === 0) return "Free";
  return `${currencySymbol(plan.currency)}${plan.priceMonthly}`;
};

const faqs = [
  {
    q: "Can I cancel at any time?",
    a: "Yes. Subscriptions are billed monthly and you can cancel from your account at any time. You keep access until the end of your billing period.",
  },
  {
    q: "What is Nerve Mode?",
    a: "Nerve Mode is a cross-examination engine. You upload or paste your thesis, pitch, or proposal and an AI panel challenges your evidence, logic, and assumptions. It is not coaching — it is structured pressure. Available on the Coach plan.",
  },
  {
    q: "Does RehearseAI record my sessions?",
    a: "No. Voice is processed in real time for conversation only. Raw audio is not stored by default. You control all data settings from your privacy dashboard.",
  },
  {
    q: "What practice types are included?",
    a: "Job interviews, public speaking, panel discussions, thesis defense, salary negotiation, difficult conversations, teaching sessions, sales pitches, and casual conversation. New arenas are added regularly.",
  },
  {
    q: "Is there a student discount?",
    a: "Yes. Contact us at support and we will apply a student discount to your account.",
  },
  {
    q: "What happens when I hit my session limit?",
    a: "You will be notified when approaching your monthly limit. You can upgrade at any time to get more sessions. Sessions reset on the 1st of each month.",
  },
];

export default function PricingPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const currentPlanId = profile?.planId ?? null;
  const [plans, setPlans] = useState<Plan[]>(defaultPlans.filter((p) => p.isPublic && p.isActive));
  const [packages, setPackages] = useState<CoursePackage[]>(defaultCoursePackages.filter((p) => p.isActive));
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);

  useEffect(() => {
    getPublicPlans().then(setPlans).catch(() => undefined);
    getCoursePackages().then(setPackages).catch(() => undefined);
  }, []);

  useEffect(() => {
    function onAuthRequest(event: Event) {
      const requestedMode = (event as CustomEvent<AuthMode>).detail;
      setAuthMode(requestedMode === "signin" || requestedMode === "forgot" ? requestedMode : "signup");
    }

    window.addEventListener("rehearseai:auth", onAuthRequest);
    return () => window.removeEventListener("rehearseai:auth", onAuthRequest);
  }, []);

  useEffect(() => {
    function onPayment(e: Event) {
      const detail = (e as CustomEvent).detail;
      const label = detail?.items?.[0]?.product?.name ?? "your purchase";
      setSuccessMsg(`Payment complete — ${label} is now active. Check Settings → Billing for details.`);
      if (successTimer.current) clearTimeout(successTimer.current);
      successTimer.current = setTimeout(() => setSuccessMsg(null), 12_000);
    }
    window.addEventListener("paddle:payment-complete", onPayment);
    return () => {
      window.removeEventListener("paddle:payment-complete", onPayment);
      if (successTimer.current) clearTimeout(successTimer.current);
    };
  }, []);

  return (
    <>
    <main className="cog-bg min-h-screen text-primary-token">
      <Nav />
      <AnimatedPage className="mx-auto max-w-6xl px-4 py-14">
        {successMsg && (
          <div className="mb-8 flex items-center gap-3 rounded-2xl bg-emerald-50 px-5 py-4 font-semibold text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20">
            <PartyPopper size={18} className="shrink-0" />
            <span>{successMsg}</span>
            <Link href="/settings#billing" className="ml-auto shrink-0 text-sm underline underline-offset-2">View in settings →</Link>
          </div>
        )}
        <div id="subscriptions" className="mx-auto max-w-3xl scroll-mt-8 text-center">
          <p className="mx-auto inline-flex items-center gap-2 rounded-full surface-low px-4 py-2 text-sm font-semibold text-secondary-token">
            <Sparkles size={16} /> Simple, transparent pricing
          </p>
          <h1 className="mt-6 text-5xl font-semibold leading-[0.95] tracking-[-0.055em] md:text-7xl">
            Choose your <span className="accent-gradient-text">training depth.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg font-medium leading-8 text-secondary-token">
            Every plan includes the core rehearsal engine. Paid plans unlock deeper pressure modes, analytics, and full session history.
          </p>
        </div>

        <StaggeredGrid className="mt-12 grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <AnimatedCard key={plan.planId} className={`relative flex flex-col overflow-hidden rounded-[2rem] p-6 ${plan.isFeatured ? "surface-high ring-2 ring-[var(--accent-primary)]" : "surface-low"}`}>
              <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-gradient-to-br from-cyan-300/30 via-violet-400/30 to-blue-400/20 blur-3xl" />
              <div className="relative flex flex-1 flex-col">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-2xl font-semibold tracking-[-0.04em]">{plan.name}</div>
                  {plan.signal && (
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${plan.isFeatured ? "bg-[var(--accent-primary)] text-white ring-transparent" : "bg-[var(--surface-secondary)] text-secondary-token ring-[var(--border-soft)]"}`}>
                      {plan.signal}
                    </span>
                  )}
                </div>
                <div className="mt-5 flex items-end gap-1">
                  <span className="text-5xl font-semibold tracking-[-0.055em]">{formatPrice(plan)}</span>
                  {plan.priceMonthly > 0 && <span className="mb-1.5 text-lg font-medium text-secondary-token">/mo</span>}
                </div>
                {plan.priceYearly > 0 && (
                  <p className="mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    or {currencySymbol(plan.currency)}{plan.priceYearly}/yr — save {currencySymbol(plan.currency)}{(plan.priceMonthly * 12) - plan.priceYearly}
                  </p>
                )}
                <ul className="mt-7 flex-1 space-y-3 font-medium text-secondary-token">
                  {(plan.features || []).filter((feature) => !feature.toLowerCase().includes("course template")).map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 shrink-0 text-[var(--accent-secondary)]" size={18} />
                      {feature}
                    </li>
                  ))}
                </ul>
                {currentPlanId === plan.planId ? (
                  <div className="mt-8 flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-5 py-3.5 text-center font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20">
                    <CheckCircle2 size={16} className="shrink-0" /> Your current plan
                  </div>
                ) : plan.priceMonthly === 0 ? (
                  <Link
                    href="/practice"
                    className="mt-8 block w-full rounded-2xl px-5 py-3.5 text-center font-semibold transition hover:-translate-y-0.5 surface-medium text-primary-token ring-1 ring-[var(--border-soft)]"
                  >
                    {currentPlanId && currentPlanId !== "free" ? "Switch to Free" : ctaLabel(plan)}
                  </Link>
                ) : (
                  <PaddleCheckoutButton
                    priceId={paddleMonthlyPriceId(plan)}
                    fallbackHref="/contact"
                    label={plan.name}
                    className={`mt-8 block w-full rounded-2xl px-5 py-3.5 text-center font-semibold transition hover:-translate-y-0.5 disabled:opacity-60 ${plan.isFeatured ? "bg-[var(--accent-primary)] text-white shadow-[0_18px_42px_rgba(109,40,217,0.24)]" : "surface-medium text-primary-token ring-1 ring-[var(--border-soft)]"}`}
                  >
                    {currentPlanId && currentPlanId !== "free" ? `Switch to ${plan.name}` : ctaLabel(plan)}
                  </PaddleCheckoutButton>
                )}
              </div>
            </AnimatedCard>
          ))}
        </StaggeredGrid>

        {/* Course packages */}
        <div id="course-packages" className="mt-20 scroll-mt-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full surface-low px-4 py-2 text-sm font-semibold text-secondary-token">
              <Zap size={15} /> One-time course packages
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em]">Preparing for one specific moment?</h2>
            <p className="mx-auto mt-4 max-w-2xl font-medium leading-7 text-secondary-token">
              Buy a focused course package outright — no subscription needed. Each session is included in the price.
              Course packages are separate purchases and are not included with Pro or Coach.
              One human coaching session costs £100–200. These packages deliver 7–21 days of daily practice for a fraction of that.
            </p>
          </div>
          <StaggeredGrid className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => (
              <AnimatedCard key={pkg.packageId} className="relative flex flex-col overflow-hidden rounded-[2rem] surface-low p-6 ring-1 ring-[var(--border-soft)]">
                <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-gradient-to-br from-cyan-300/20 via-violet-400/20 to-transparent blur-3xl" />
                <div className="relative flex flex-1 flex-col">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${stakeColor[pkg.stakeLevel]}`}>
                      {stakeLabel[pkg.stakeLevel]}
                    </span>
                    <span className="text-xs font-semibold text-secondary-token">
                      <Clock size={11} className="mr-1 inline" />{pkg.durationDays} days
                    </span>
                  </div>
                  <h3 className="mt-4 text-xl font-semibold tracking-[-0.04em]">{pkg.title}</h3>
                  <p className="mt-2 flex-1 text-sm font-medium leading-6 text-secondary-token">{pkg.description}</p>
                  <div className="mt-4 flex items-end gap-1">
                    <span className="text-4xl font-semibold tracking-[-0.05em]">{currencySymbol(pkg.currency || "USD")}{pkg.price}</span>
                    <span className="mb-1 text-sm font-medium text-secondary-token">one-time</span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-secondary-token">{pkg.sessionsIncluded} sessions included · no subscription</p>
                  <PaddleCheckoutButton
                    priceId={pkg.paddlePriceId}
                    fallbackHref="/contact"
                    label={pkg.title}
                    onCompleted={() => router.push(`/courses/templates?package=${encodeURIComponent(pkg.packageId)}&payment=complete`)}
                    className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-[var(--accent-primary)] px-5 py-3 text-center font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-60"
                  >
                    {currentPlanId && currentPlanId !== "free"
                      ? <>Buy separately <ArrowRight size={16} /></>
                      : <>{pkg.paddlePriceId ? "Buy now" : "Get access"} <ArrowRight size={16} /></>
                    }
                  </PaddleCheckoutButton>
                  {currentPlanId && currentPlanId !== "free" && (
                    <p className="mt-2 text-center text-xs font-medium text-secondary-token">
                      One-time purchase — sessions are in addition to your subscription.
                    </p>
                  )}
                </div>
              </AnimatedCard>
            ))}
          </StaggeredGrid>
          <p className="mt-6 text-center text-sm font-medium text-secondary-token">
            Have a subscription? Course sessions are in addition to your monthly quick sessions.
          </p>
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="mb-8 text-center text-3xl font-semibold tracking-[-0.045em]">Common questions</h2>
          <div className="mx-auto max-w-3xl space-y-3">
            {faqs.map(({ q, a }) => (
              <details key={q} className="group rounded-[1.5rem] surface-low p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-primary-token">
                  {q}
                  <ChevronDown size={18} className="shrink-0 text-secondary-token transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 font-medium leading-7 text-secondary-token">{a}</p>
              </details>
            ))}
          </div>
        </div>

        <div className="mt-12 rounded-[2rem] surface-medium p-8 text-center">
          <h3 className="text-2xl font-semibold tracking-[-0.04em]">Still not sure?</h3>
          <p className="mx-auto mt-3 max-w-xl font-medium leading-7 text-secondary-token">Start on the Free plan — no card required. Upgrade any time from your account settings.</p>
          <Link href="/practice" className="mt-6 inline-flex rounded-2xl bg-[var(--accent-primary)] px-7 py-4 font-semibold text-white shadow-[0_18px_42px_rgba(109,40,217,0.24)] transition hover:-translate-y-0.5">
            Try your first session free
          </Link>
        </div>
      </AnimatedPage>
    </main>
    <AuthDialog
      mode={authMode}
      onClose={() => setAuthMode(null)}
      onModeChange={setAuthMode}
      onAuthenticated={() => setAuthMode(null)}
    />
    </>
  );
}
