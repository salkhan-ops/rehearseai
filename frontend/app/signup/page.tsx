"use client";

import { AnimatedPage } from "@/components/animations";
import { AuthForm } from "@/components/auth/AuthForm";
import { Nav } from "@/components/Nav";
import { BrainCircuit, LineChart, Mic2, ShieldCheck, Sparkles } from "lucide-react";

const highlights = [
  ["Private training memory", "Keep sessions, reports, and growth signals attached to your account."],
  ["Pressure-ready practice", "Start with language, safety, and coaching preferences already tuned."],
  ["Voice and analytics", "Unlock the full rehearsal loop across dashboard, reports, and courses."],
];

export default function SignUpPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f4f8fc] dark:bg-[#0e1020]">
      <div className="pointer-events-none absolute left-[-10rem] top-28 h-[30rem] w-[30rem] rounded-full bg-cyan-200/35 blur-3xl dark:bg-cyan-300/10" />
      <div className="pointer-events-none absolute right-[-10rem] top-10 h-[34rem] w-[34rem] rounded-full bg-violet-200/45 blur-3xl dark:bg-violet-400/12" />
      <Nav />
      <AnimatedPage className="relative mx-auto grid max-w-6xl gap-6 px-4 py-14 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
        <section className="rounded-[2rem] bg-white/72 p-6 ring-1 ring-slate-200/80 backdrop-blur-2xl dark:bg-white/[0.07] dark:ring-white/12 lg:sticky lg:top-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-4 py-2 text-sm font-bold text-violet-700 ring-1 ring-violet-100 dark:bg-white/10 dark:text-violet-100 dark:ring-white/10">
            <Sparkles size={16} /> RehearseAI account
          </div>
          <h1 className="mt-5 text-5xl font-semibold leading-[0.95] tracking-[-0.055em] text-slate-950 dark:text-white md:text-6xl">
            Turn practice into a measurable skill.
          </h1>
          <p className="mt-5 text-lg font-medium leading-8 text-slate-600 dark:text-white/58">
            Your account connects the full loop: scenarios, voice sessions, reminders, reports, and reasoning analytics.
          </p>
          <div className="mt-7 grid gap-3">
            {highlights.map(([title, copy], index) => {
              const icons = [BrainCircuit, ShieldCheck, LineChart];
              const Icon = icons[index];
              return (
                <div key={title} className="flex gap-4 rounded-[1.4rem] bg-white/75 p-4 ring-1 ring-slate-200/80 dark:bg-white/[0.06] dark:ring-white/10">
                  <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#6200a8] text-white shadow-[0_14px_30px_rgba(98,0,168,0.18)]">
                    <Icon size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-950 dark:text-white">{title}</div>
                    <p className="mt-1 text-sm font-medium leading-6 text-slate-600 dark:text-white/58">{copy}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 rounded-[1.5rem] bg-slate-950 p-5 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)] dark:bg-white/10 dark:ring-1 dark:ring-white/10">
            <div className="flex items-center gap-2 text-sm font-bold text-cyan-100"><Mic2 size={17} /> Next rehearsal</div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              {["Calm", "Clarity", "Recovery"].map((label, index) => (
                <div key={label} className="rounded-2xl bg-white/10 p-3">
                  <div className="text-2xl font-semibold">{[82, 76, 91][index]}%</div>
                  <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white/45">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <AuthForm mode="signup" />
      </AnimatedPage>
    </main>
  );
}
