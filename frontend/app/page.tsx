import { ArrowRight, BarChart3, MessageSquare, ShieldCheck, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { Nav } from "@/components/Nav";
import { practiceTypes } from "@/lib/types";

const steps = ["Choose a real situation", "Set the pressure level", "Rehearse with AI pushback", "Get a practical report"];
const faqs = [
  ["Is this therapy?", "No. RehearseAI is for practice, preparation, and feedback. It is not therapy, legal, medical, or financial advice."],
  ["Does it guarantee success?", "No product can guarantee outcomes. RehearseAI helps you prepare better and build confidence through repeated practice."],
  ["Can I use brutal mode safely?", "Yes. Brutal mode is direct and challenging, but the AI is instructed to avoid insults, abuse, and harmful language."]
];

export default function Home() {
  return (
    <main>
      <Nav />
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_20%_20%,#ffffff_0,#f6f7fb_35%,#eceefe_100%)]">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-14 md:grid-cols-[1.1fr_0.9fr] md:py-24">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-bold text-black/70 shadow-soft">
              <Sparkles size={16} /> Practice the moment before it matters.
            </div>
            <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl md:text-7xl">
              Practice difficult conversations before they happen.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-black/65">
              Rehearse interviews, presentations, panels, negotiations, and high-pressure conversations with AI that reacts like real people.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/practice">Start Rehearsing Free</ButtonLink>
              <ButtonLink href="/practice/setup?type=Panel%20Discussion&difficulty=Brutal" variant="secondary">Try Brutal Panel Mode</ButtonLink>
            </div>
          </div>
          <div className="rounded-[2rem] bg-ink p-5 text-white shadow-soft">
            <div className="rounded-3xl bg-white/10 p-5">
              <div className="flex items-center gap-3">
                <div className="grid size-11 place-items-center rounded-2xl bg-ember"><MessageSquare /></div>
                <div>
                  <div className="font-bold">Sharp Panelist</div>
                  <div className="text-sm text-white/60">Brutal, direct, useful</div>
                </div>
              </div>
              <p className="mt-8 text-2xl font-bold leading-snug">"You made a confident claim, but I do not see the evidence yet. What would change my mind in the next 30 seconds?"</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              {["Confidence 82", "Clarity 76", "Calmness 88", "Structure 79"].map((item) => (
                <div key={item} className="rounded-2xl bg-white/10 p-4 text-sm font-bold">{item}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-3xl font-black">How it works</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step} className="rounded-3xl bg-white p-6 shadow-soft ring-1 ring-black/5">
              <div className="mb-8 grid size-10 place-items-center rounded-full bg-ink font-black text-white">{index + 1}</div>
              <div className="text-xl font-black">{step}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-black">Practice categories</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {practiceTypes.map((type) => (
              <a key={type} href={`/practice/setup?type=${encodeURIComponent(type)}`} className="rounded-3xl bg-mist p-5 font-bold transition hover:-translate-y-1 hover:bg-white hover:shadow-soft">
                {type}
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-16 md:grid-cols-2">
        <div>
          <h2 className="text-3xl font-black">Sample feedback report</h2>
          <p className="mt-4 text-black/60">After each rehearsal, RehearseAI turns the messy moment into concrete next steps.</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-soft ring-1 ring-black/5">
          <div className="flex items-center gap-2 font-black"><BarChart3 size={20} /> Performance snapshot</div>
          {["Confidence", "Clarity", "Persuasiveness", "Calmness", "Structure"].map((score, index) => (
            <div key={score} className="mt-5">
              <div className="mb-2 flex justify-between text-sm font-bold"><span>{score}</span><span>{82 - index * 4}</span></div>
              <div className="h-2 rounded-full bg-black/10"><div className="h-2 rounded-full bg-teal" style={{ width: `${82 - index * 4}%` }} /></div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-ink py-16 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-black">Use cases built for real pressure</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {["Before an interview", "Before a raise conversation", "Before a room challenges your idea"].map((item) => (
              <div key={item} className="rounded-3xl bg-white/10 p-6"><ShieldCheck className="mb-6" /><div className="text-xl font-black">{item}</div></div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-4 md:grid-cols-3">
          {["Free", "Pro", "Coach"].map((plan) => (
            <div key={plan} className="rounded-3xl bg-white p-6 shadow-soft ring-1 ring-black/5">
              <div className="text-2xl font-black">{plan}</div>
              <p className="mt-3 text-black/55">{plan === "Free" ? "Start practicing." : "For deeper preparation."}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16">
        <h2 className="text-3xl font-black">FAQ</h2>
        <div className="mt-8 space-y-3">
          {faqs.map(([q, a]) => (
            <div key={q} className="rounded-3xl bg-white p-6 shadow-soft ring-1 ring-black/5">
              <div className="font-black">{q}</div>
              <p className="mt-2 text-black/60">{a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pb-16">
        <div className="mx-auto max-w-6xl rounded-[2rem] bg-ink p-8 text-white md:p-12">
          <h2 className="text-4xl font-black">Walk in better prepared.</h2>
          <p className="mt-3 text-white/65">Practice, rehearse, improve confidence, and get feedback before the real moment.</p>
          <a href="/practice" className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-bold text-ink">Start Rehearsing Free <ArrowRight size={18} /></a>
        </div>
      </section>
    </main>
  );
}
