import { Nav } from "@/components/Nav";

const plans = [
  { name: "Free", price: "$0", href: "/practice", features: ["3 sessions/month", "Basic feedback"] },
  { name: "Pro", price: "$19/mo", href: process.env.NEXT_PUBLIC_PADDLE_PRO_CHECKOUT_URL || "", features: ["Unlimited sessions", "Advanced reports", "Brutal mode", "Session history"] },
  { name: "Coach", price: "$49/mo", href: process.env.NEXT_PUBLIC_PADDLE_COACH_CHECKOUT_URL || "", features: ["Advanced personas", "Detailed analytics", "Priority features"] }
];

export default function PricingPage() {
  return (
    <main>
      <Nav />
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-4xl font-black md:text-6xl">Simple rehearsal plans</h1>
        <p className="mt-4 text-black/60">Paddle checkout is prepared as a placeholder for the production billing flow.</p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.name} className="rounded-[2rem] bg-white p-6 shadow-soft ring-1 ring-black/5">
              <div className="text-2xl font-black">{plan.name}</div>
              <div className="mt-3 text-4xl font-black">{plan.price}</div>
              <ul className="mt-6 space-y-3 text-black/65">
                {plan.features.map((feature) => <li key={feature}>• {feature}</li>)}
              </ul>
              {plan.href ? (
                <a href={plan.href} className="mt-8 block w-full rounded-full bg-ink px-5 py-3 text-center font-bold text-white">
                  {plan.name === "Free" ? "Start free" : "Open Paddle checkout"}
                </a>
              ) : (
                <button className="mt-8 w-full rounded-full bg-mist px-5 py-3 font-bold text-black/60">Add Paddle sandbox URL</button>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
