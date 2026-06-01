import { CheckCircle2, Radio, Sparkles } from "lucide-react";
import { Nav } from "@/components/Nav";
import { AnimatedCard, AnimatedPage, StaggeredGrid } from "@/components/animations";

const plans = [
  { name: "Free", price: "$0", href: "/practice", signal: "Start", features: ["3 sessions/month", "Basic feedback", "Text rehearsal", "Starter reports"] },
  { name: "Pro", price: "$19/mo", href: process.env.NEXT_PUBLIC_PADDLE_PRO_CHECKOUT_URL || "", signal: "Most adaptive", features: ["Unlimited sessions", "Advanced reports", "Brutal mode", "Nerve Mode", "Decision tree analysis"] },
  { name: "Coach", price: "$49/mo", href: process.env.NEXT_PUBLIC_PADDLE_COACH_CHECKOUT_URL || "", signal: "Deep intelligence", features: ["Advanced personas", "Nerve panel defense", "Detailed analytics", "Benchmarking", "Extended history"] },
];

export default function PricingPage() {
  return (
    <main className="cog-bg min-h-screen text-primary-token">
      <Nav />
      <AnimatedPage className="mx-auto max-w-6xl px-4 py-14">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mx-auto inline-flex items-center gap-2 rounded-full surface-low px-4 py-2 text-sm font-semibold text-secondary-token">
            <Radio size={16} /> Paddle-ready billing architecture
          </p>
          <h1 className="mt-6 text-5xl font-semibold leading-[0.95] tracking-[-0.055em] md:text-7xl">
            Choose your <span className="accent-gradient-text">training depth.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg font-medium leading-8 text-secondary-token">
            Plans map directly to cognitive simulation limits, pressure modes, analytics depth, and long-term memory.
          </p>
        </div>

        <StaggeredGrid className="mt-12 grid gap-4 md:grid-cols-3">
          {plans.map((plan, index) => (
            <AnimatedCard key={plan.name} className={`relative overflow-hidden rounded-[2rem] p-6 ${index === 1 ? "surface-high" : "surface-low"}`}>
              <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-gradient-to-br from-cyan-300/30 via-violet-400/30 to-blue-400/20 blur-3xl" />
              <div className="relative">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-2xl font-semibold tracking-[-0.04em]">{plan.name}</div>
                  <span className="rounded-full bg-[var(--surface-secondary)] px-3 py-1 text-xs font-semibold text-secondary-token ring-1 ring-[var(--border-soft)]">{plan.signal}</span>
                </div>
                <div className="mt-5 text-5xl font-semibold tracking-[-0.055em]">{plan.price}</div>
                <ul className="mt-7 space-y-3 font-medium text-secondary-token">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 shrink-0 text-[var(--accent-secondary)]" size={18} />
                      {feature}
                    </li>
                  ))}
                </ul>
                {plan.href ? (
                  <a href={plan.href} className="mt-8 block w-full rounded-2xl bg-[var(--accent-primary)] px-5 py-3 text-center font-semibold text-white shadow-[0_18px_42px_rgba(109,40,217,0.24)]">
                    {plan.name === "Free" ? "Start free" : "Open Paddle checkout"}
                  </a>
                ) : (
                  <button className="mt-8 w-full rounded-2xl surface-medium px-5 py-3 font-semibold text-secondary-token">Add Paddle sandbox URL</button>
                )}
              </div>
            </AnimatedCard>
          ))}
        </StaggeredGrid>

        <div className="mt-8 rounded-[2rem] surface-medium p-6">
          <div className="flex items-center gap-2 font-semibold"><Sparkles size={18} /> Pricing controls are entitlement-driven.</div>
          <p className="mt-2 font-medium leading-7 text-secondary-token">
            Admin plan templates control sessions, brutal mode, voice mode, advanced analytics, shareable reports, decision trees, and historical memory.
          </p>
        </div>
      </AnimatedPage>
    </main>
  );
}
