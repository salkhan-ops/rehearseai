import Link from "next/link";
import { CheckCircle2, ChevronDown, Sparkles } from "lucide-react";
import { Nav } from "@/components/Nav";
import { AnimatedCard, AnimatedPage, StaggeredGrid } from "@/components/animations";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "",
    signal: "Get started",
    cta: "Start free",
    href: "/practice",
    featured: false,
    features: [
      "3 sessions per month",
      "Basic AI feedback",
      "Text rehearsal mode",
      "Starter performance reports",
    ],
  },
  {
    name: "Pro",
    price: "$19",
    period: "/mo",
    signal: "Most popular",
    cta: "Upgrade to Pro",
    href: process.env.NEXT_PUBLIC_PADDLE_PRO_CHECKOUT_URL || "/contact",
    featured: true,
    features: [
      "Unlimited sessions",
      "Voice + text rehearsal",
      "Advanced performance reports",
      "Brutal pressure mode",
      "Nerve Mode cross-examination",
      "Decision tree analysis",
      "Practice routines & reminders",
    ],
  },
  {
    name: "Coach",
    price: "$49",
    period: "/mo",
    signal: "Deep intelligence",
    cta: "Upgrade to Coach",
    href: process.env.NEXT_PUBLIC_PADDLE_COACH_CHECKOUT_URL || "/contact",
    featured: false,
    features: [
      "Everything in Pro",
      "Advanced AI personas",
      "Nerve panel defense mode",
      "Deep analytics & benchmarking",
      "Full session history",
      "Shareable report cards",
      "Priority support",
    ],
  },
];

const faqs = [
  {
    q: "Can I cancel at any time?",
    a: "Yes. Subscriptions are billed monthly and you can cancel from your account at any time. You keep access until the end of your billing period.",
  },
  {
    q: "What is Nerve Mode?",
    a: "Nerve Mode is a cross-examination engine. You upload or paste your thesis, pitch, or proposal and an AI panel challenges your evidence, logic, and assumptions. It is not coaching — it is structured pressure.",
  },
  {
    q: "Does RehearseAI record my sessions?",
    a: "No. Voice is processed in real time for conversation only. Raw audio is not stored by default. You control all data settings from your privacy dashboard.",
  },
  {
    q: "What practice types are included?",
    a: "Job interviews, public speaking, panel discussions, thesis defense, salary negotiation, difficult conversations, teaching sessions, and sales pitches. New arenas are added regularly.",
  },
  {
    q: "Is there a student discount?",
    a: "Yes. Contact us at support and we will apply a student discount to your account.",
  },
];

export default function PricingPage() {
  return (
    <main className="cog-bg min-h-screen text-primary-token">
      <Nav />
      <AnimatedPage className="mx-auto max-w-6xl px-4 py-14">
        <div className="mx-auto max-w-3xl text-center">
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
            <AnimatedCard key={plan.name} className={`relative flex flex-col overflow-hidden rounded-[2rem] p-6 ${plan.featured ? "surface-high ring-2 ring-[var(--accent-primary)]" : "surface-low"}`}>
              <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-gradient-to-br from-cyan-300/30 via-violet-400/30 to-blue-400/20 blur-3xl" />
              <div className="relative flex flex-1 flex-col">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-2xl font-semibold tracking-[-0.04em]">{plan.name}</div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${plan.featured ? "bg-[var(--accent-primary)] text-white ring-transparent" : "bg-[var(--surface-secondary)] text-secondary-token ring-[var(--border-soft)]"}`}>
                    {plan.signal}
                  </span>
                </div>
                <div className="mt-5 flex items-end gap-1">
                  <span className="text-5xl font-semibold tracking-[-0.055em]">{plan.price}</span>
                  {plan.period && <span className="mb-1.5 text-lg font-medium text-secondary-token">{plan.period}</span>}
                </div>
                <ul className="mt-7 flex-1 space-y-3 font-medium text-secondary-token">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 shrink-0 text-[var(--accent-secondary)]" size={18} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`mt-8 block w-full rounded-2xl px-5 py-3.5 text-center font-semibold transition hover:-translate-y-0.5 ${plan.featured ? "bg-[var(--accent-primary)] text-white shadow-[0_18px_42px_rgba(109,40,217,0.24)]" : "surface-medium text-primary-token ring-1 ring-[var(--border-soft)]"}`}
                >
                  {plan.cta}
                </Link>
              </div>
            </AnimatedCard>
          ))}
        </StaggeredGrid>

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
  );
}
