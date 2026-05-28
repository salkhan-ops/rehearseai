import { Nav } from "@/components/Nav";
import { AnimatedCard, AnimatedPage, StaggeredGrid } from "@/components/animations";

const plans = [
  { name: "Free", price: "$0", href: "/practice", features: ["3 sessions/month", "Basic feedback"] },
  { name: "Pro", price: "$19/mo", href: process.env.NEXT_PUBLIC_PADDLE_PRO_CHECKOUT_URL || "", features: ["Unlimited sessions", "Advanced reports", "Brutal mode", "Session history"] },
  { name: "Coach", price: "$49/mo", href: process.env.NEXT_PUBLIC_PADDLE_COACH_CHECKOUT_URL || "", features: ["Advanced personas", "Detailed analytics", "Priority features"] }
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#f4f8fc] dark:bg-[#0e1020]">
      <Nav />
      <AnimatedPage className="mx-auto max-w-6xl px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-5xl font-semibold tracking-[-0.045em] text-slate-900 dark:text-white md:text-6xl">Simple rehearsal plans</h1>
          <p className="mt-5 text-lg font-medium leading-8 text-slate-600 dark:text-white/60">Paddle checkout is prepared as a placeholder for the production billing flow.</p>
        </div>
        <StaggeredGrid className="mt-10 grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <AnimatedCard key={plan.name} className="rounded-[1.75rem] bg-white p-7 shadow-[0_18px_55px_rgba(35,45,75,0.06)] ring-1 ring-slate-200/75 dark:bg-white/10 dark:ring-white/10">
              <div className="text-2xl font-semibold tracking-[-0.03em] text-slate-900 dark:text-white">{plan.name}</div>
              <div className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-slate-900 dark:text-white">{plan.price}</div>
              <ul className="mt-6 space-y-3 font-medium text-slate-600 dark:text-white/60">
                {plan.features.map((feature) => <li key={feature}>• {feature}</li>)}
              </ul>
              {plan.href ? (
                <a href={plan.href} className="mt-8 block w-full rounded-2xl bg-[#6200a8] px-5 py-3 text-center font-semibold text-white shadow-[0_14px_30px_rgba(98,0,168,0.24)]">
                  {plan.name === "Free" ? "Start free" : "Open Paddle checkout"}
                </a>
              ) : (
                <button className="mt-8 w-full rounded-2xl bg-slate-50 px-5 py-3 font-semibold text-slate-500 ring-1 ring-slate-200 dark:bg-white/10 dark:text-white/50 dark:ring-white/10">Add Paddle sandbox URL</button>
              )}
            </AnimatedCard>
          ))}
        </StaggeredGrid>
      </AnimatedPage>
    </main>
  );
}
