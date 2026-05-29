import Link from "next/link";
import type React from "react";
import { ArrowUpRight, BriefcaseBusiness, GraduationCap, Handshake, MessageSquareWarning, Mic2, Presentation, Scale, ShoppingBag, Sparkles } from "lucide-react";
import { AnimatedCard, AnimatedPage, StaggeredGrid } from "@/components/animations";
import { Nav } from "@/components/Nav";
import { PracticeType, practiceTypes } from "@/lib/types";

const arenaMeta: Record<PracticeType, { icon: React.ReactNode; line: string; pressure: string; color: string; tag: string }> = {
  "Job Interview": { icon: <BriefcaseBusiness size={22} />, line: "Answer sharp follow-ups without sounding rehearsed.", pressure: "Hiring manager + team lead", color: "from-sky-500 to-violet-600", tag: "Final round" },
  "Presentation / Public Speaking": { icon: <Presentation size={22} />, line: "Handle skeptical audience questions while keeping structure.", pressure: "Live Q&A simulation", color: "from-cyan-500 to-blue-600", tag: "Stage mode" },
  "Panel Discussion": { icon: <Mic2 size={22} />, line: "Stay crisp while multiple voices challenge your assumptions.", pressure: "Interruptions + moderator", color: "from-fuchsia-500 to-violet-700", tag: "Panel heat" },
  "Thesis Defense": { icon: <GraduationCap size={22} />, line: "Defend methods, logic, and originality under academic pressure.", pressure: "Committee examiner", color: "from-indigo-500 to-sky-600", tag: "Deep logic" },
  "Salary Negotiation": { icon: <Scale size={22} />, line: "Push for value while staying calm, direct, and credible.", pressure: "Budget-conscious manager", color: "from-emerald-500 to-teal-700", tag: "Leverage" },
  "Difficult Conversation": { icon: <MessageSquareWarning size={22} />, line: "Say the hard thing clearly without escalating the room.", pressure: "Emotional counterpart", color: "from-rose-500 to-orange-500", tag: "Tension" },
  "Teaching Session": { icon: <Sparkles size={22} />, line: "Explain simply while curious or confused people push back.", pressure: "Curious students", color: "from-teal-500 to-cyan-600", tag: "Clarity" },
  "Sales Pitch": { icon: <ShoppingBag size={22} />, line: "Handle objections, urgency, and skeptical buyer logic.", pressure: "Skeptical buyer", color: "from-amber-500 to-rose-500", tag: "Objections" },
};

export default function PracticePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f4f8fc] dark:bg-[#0e1020]">
      <Nav />
      <AnimatedPage className="relative mx-auto max-w-7xl px-4 py-12 md:py-16">
        <div className="pointer-events-none absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-300/25 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-violet-700 shadow-sm ring-1 ring-violet-100 dark:bg-white/10 dark:text-violet-100 dark:ring-white/10">
              <Sparkles size={16} /> Cognitive performance training
            </div>
            <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-[0.95] tracking-[-0.055em] text-slate-950 dark:text-white md:text-7xl">
              Pick the room that makes you better.
            </h1>
            <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-slate-600 dark:text-white/60">
              Choose a real-life pressure arena. Rehearse with an adaptive persona, get challenged, then see how your reasoning holds up.
            </p>
          </div>
          <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-5 text-white shadow-[0_30px_90px_rgba(60,20,120,0.22)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(139,92,246,0.5),transparent_32%),radial-gradient(circle_at_90%_10%,rgba(56,189,248,0.35),transparent_28%)]" />
            <div className="relative flex items-center justify-between">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Live pressure map</span>
              <span className="text-sm font-semibold text-emerald-300">Adaptive</span>
            </div>
            <div className="relative mt-8 grid grid-cols-12 items-end gap-1.5">
              {Array.from({ length: 36 }).map((_, index) => (
                <span
                  key={index}
                  className="rounded-full bg-gradient-to-t from-violet-500 to-cyan-300"
                  style={{ height: `${22 + ((index * 19) % 86)}px`, opacity: 0.38 + ((index % 5) * 0.12) }}
                />
              ))}
            </div>
            <div className="relative mt-6 grid grid-cols-3 gap-3 text-sm font-semibold">
              {["Reasoning", "Composure", "Recovery"].map((item, index) => (
                <div key={item} className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                  <div className="text-white/50">{item}</div>
                  <div className="mt-2 text-2xl">{82 + index * 4}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <StaggeredGrid className="relative mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {practiceTypes.map((type) => (
            <AnimatedCard key={type} className="group overflow-hidden rounded-[1.7rem] bg-white shadow-[0_18px_55px_rgba(35,45,75,0.06)] ring-1 ring-slate-200/70 transition dark:bg-white/10 dark:ring-white/10">
              <Link href={`/practice/setup?type=${encodeURIComponent(type)}`} className="block h-full p-5">
                <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${arenaMeta[type].color} text-white shadow-lg shadow-violet-500/15`}>
                  {arenaMeta[type].icon}
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div className="text-xl font-semibold tracking-[-0.035em] text-slate-950 dark:text-white">{type}</div>
                  <ArrowUpRight className="mt-1 text-slate-300 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-violet-600" size={18} />
                </div>
                <p className="mt-3 text-sm font-medium leading-6 text-slate-600 dark:text-white/60">{arenaMeta[type].line}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-white/10 dark:text-white/60">{arenaMeta[type].tag}</span>
                  <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-400/15 dark:text-violet-100">{arenaMeta[type].pressure}</span>
                </div>
              </Link>
            </AnimatedCard>
          ))}
        </StaggeredGrid>
      </AnimatedPage>
    </main>
  );
}
