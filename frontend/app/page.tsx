"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3, CheckCircle2, Sparkles } from "lucide-react";
import { AnimatedCard, AnimatedPage, AnimatedSection, StaggeredGrid } from "@/components/animations";
import { ButtonLink } from "@/components/ButtonLink";
import { Nav } from "@/components/Nav";
import { practiceTypes } from "@/lib/types";

const steps = ["Choose the situation", "Set the pressure", "Respond in the moment", "Review your feedback"];
const useCases = ["Job interview follow-ups", "Panel questions and interruptions", "Salary and sales objections"];
const faqs = [
  ["Is this therapy?", "No. RehearseAI is practice and feedback software. It is not therapy, legal, medical, or financial advice."],
  ["Does it guarantee success?", "No. It helps you rehearse, improve confidence, and prepare better for the real moment."],
  ["Is brutal mode mean?", "No. Brutal mode is direct and high-pressure, but it is designed to stay constructive and never abusive."]
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f4f8fc] text-slate-900 dark:bg-[#0e1020] dark:text-white">
      <Nav />

      <section className="mesh-bg overflow-hidden px-4 pb-20 pt-24 md:pt-28">
        <AnimatedPage className="mx-auto max-w-6xl text-center">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full bg-white/70 px-5 py-3 text-[15px] font-semibold text-slate-700 shadow-[0_10px_30px_rgba(35,45,75,0.05)] ring-1 ring-slate-200/80 dark:bg-white/10 dark:text-white/75 dark:ring-white/10">
            <Sparkles size={17} className="text-[#6200a8]" />
            AI rehearsal coach now available
            <ArrowRight size={17} className="text-[#6200a8]" />
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.08 }} className="mx-auto max-w-5xl text-balance text-[3.4rem] font-semibold leading-[1.02] tracking-[-0.055em] text-[#242936] dark:text-white sm:text-7xl lg:text-[5.4rem]">
            Practice difficult conversations
            <span className="block bg-gradient-to-r from-[#8b00ff] via-[#6d48ff] to-[#5577ff] bg-clip-text text-transparent">
              powered by AI
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.16 }} className="mx-auto mt-7 max-w-3xl text-balance text-xl font-medium leading-9 text-slate-700 dark:text-white/70">
            <span className="text-[#8b00ff]">Rehearse before the pressure hits</span> with interviews, presentations, panels, negotiations, and difficult conversations that react like real people.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.24 }} className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href="/practice">Start Rehearsing Free</ButtonLink>
            <ButtonLink href="/practice/setup?type=Panel%20Discussion&difficulty=Brutal" variant="secondary">Try Brutal Panel Mode</ButtonLink>
          </motion.div>

          <div className="mt-9 flex items-center justify-center gap-3">
            <div className="flex -space-x-3">
              {["S", "A", "M", "K", "R"].map((item, index) => (
                <div key={item} className="grid size-9 place-items-center rounded-full border-2 border-[#f4f8fc] bg-white text-xs font-semibold text-slate-700 shadow-sm dark:border-[#0e1020]" style={{ color: ["#6200a8", "#3572ff", "#7c3aed", "#0f766e", "#be185d"][index] }}>
                  {item}
                </div>
              ))}
            </div>
            <p className="text-sm font-semibold text-slate-600 dark:text-white/60">Built for real conversations, not generic chat.</p>
          </div>

          <motion.div animate={{ y: [0, -7, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="relative mx-auto mt-16 max-w-5xl">
            <div className="absolute -left-6 top-10 hidden rounded-2xl bg-white/85 px-5 py-4 text-left shadow-[0_16px_45px_rgba(35,45,75,0.08)] ring-1 ring-slate-200/80 backdrop-blur dark:bg-white/10 dark:ring-white/10 md:block">
              <div className="text-sm font-semibold text-slate-500 dark:text-white/55">Live prompt</div>
              <div className="mt-1 max-w-56 text-[15px] font-semibold text-slate-800 dark:text-white/80">“What evidence supports that claim?”</div>
            </div>
            <div className="absolute -right-6 bottom-10 hidden rounded-2xl bg-white/85 px-5 py-4 text-left shadow-[0_16px_45px_rgba(35,45,75,0.08)] ring-1 ring-slate-200/80 backdrop-blur dark:bg-white/10 dark:ring-white/10 md:block">
              <div className="text-sm font-semibold text-slate-500 dark:text-white/55">Report preview</div>
              <div className="mt-1 text-[15px] font-semibold text-slate-800 dark:text-white/80">Clarity +14% after rehearsal</div>
            </div>
            <div className="overflow-hidden rounded-[2rem] bg-white/75 p-2 shadow-[0_26px_80px_rgba(35,45,75,0.10)] ring-1 ring-slate-200/80 dark:bg-white/10 dark:ring-white/10">
              <Image
                src="/images/rehearsal-hero.png"
                alt="A person rehearsing an interview and panel discussion with AI feedback"
                width={1280}
                height={900}
                priority
                className="aspect-[16/8.2] w-full rounded-[1.5rem] object-cover object-center"
              />
            </div>
          </motion.div>
        </AnimatedPage>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <StaggeredGrid className="grid gap-4 md:grid-cols-4">
          {steps.map((step, index) => (
            <AnimatedCard key={step} className="rounded-[1.5rem] bg-white p-6 shadow-[0_16px_45px_rgba(35,45,75,0.05)] ring-1 ring-slate-200/75 dark:bg-white/10 dark:ring-white/10">
              <div className="mb-7 text-sm font-semibold text-[#6200a8]">0{index + 1}</div>
              <div className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">{step}</div>
            </AnimatedCard>
          ))}
        </StaggeredGrid>
      </section>

      <section className="bg-white/70 py-20 backdrop-blur dark:bg-white/[0.04]">
        <AnimatedSection className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-5xl font-semibold tracking-[-0.045em] text-slate-900 dark:text-white">Practice categories</h2>
            <p className="mt-4 text-lg font-medium leading-8 text-slate-600 dark:text-white/60">Each mode has its own persona, tone, objections, and feedback style.</p>
          </div>
          <StaggeredGrid className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {practiceTypes.map((type) => (
              <AnimatedCard key={type} className="group rounded-[1.5rem] bg-white p-5 shadow-[0_14px_40px_rgba(35,45,75,0.04)] ring-1 ring-slate-200/75 dark:bg-white/10 dark:ring-white/10">
                <a href={`/practice/setup?type=${encodeURIComponent(type)}`} className="block">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-900 dark:text-white">{type}</span>
                    <ArrowRight className="text-[#6200a8] transition group-hover:translate-x-1" size={18} />
                  </div>
                  <p className="mt-3 text-sm font-medium leading-6 text-slate-600 dark:text-white/60">Realistic questions, objections, and next-step feedback.</p>
                </a>
              </AnimatedCard>
            ))}
          </StaggeredGrid>
        </AnimatedSection>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-20 md:grid-cols-[0.9fr_1.1fr] md:items-center">
        <div>
          <h2 className="text-5xl font-semibold tracking-[-0.045em] text-slate-900 dark:text-white">Feedback that turns pressure into practice.</h2>
          <p className="mt-5 text-lg font-medium leading-8 text-slate-600 dark:text-white/60">After each session, RehearseAI scores confidence, clarity, calmness, structure, and persuasiveness, then turns the moment into drills.</p>
        </div>
        <div className="rounded-[1.75rem] bg-white p-7 shadow-[0_18px_55px_rgba(35,45,75,0.06)] ring-1 ring-slate-200/75 dark:bg-white/10 dark:ring-white/10">
          <div className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white"><BarChart3 size={21} /> Sample report</div>
          {["Confidence", "Clarity", "Persuasiveness", "Calmness", "Structure"].map((score, index) => {
            const value = 88 - index * 5;
            return (
              <div key={score} className="mt-5">
                <div className="mb-2 flex justify-between text-sm font-semibold text-slate-700 dark:text-white/70"><span>{score}</span><span>{value}</span></div>
                <div className="h-2.5 rounded-full bg-slate-100 dark:bg-white/10"><div className="h-2.5 rounded-full bg-gradient-to-r from-[#8b00ff] to-[#5577ff]" style={{ width: `${value}%` }} /></div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-[2rem] bg-[#6200a8] p-8 text-white shadow-[0_24px_70px_rgba(98,0,168,0.20)] md:p-12">
          <h2 className="max-w-2xl text-4xl font-semibold tracking-[-0.04em]">Pressure, without the real-world consequences.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {useCases.map((item) => (
              <div key={item} className="rounded-[1.5rem] bg-white/12 p-5 backdrop-blur">
                <CheckCircle2 className="mb-5" />
                <div className="text-xl font-semibold">{item}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-20">
        <h2 className="text-center text-5xl font-semibold tracking-[-0.045em] text-slate-900 dark:text-white">FAQ</h2>
        <div className="mt-10 space-y-3">
          {faqs.map(([q, a]) => (
            <div key={q} className="rounded-[1.5rem] bg-white p-6 shadow-[0_14px_40px_rgba(35,45,75,0.04)] ring-1 ring-slate-200/75 dark:bg-white/10 dark:ring-white/10">
              <div className="font-semibold text-slate-900 dark:text-white">{q}</div>
              <p className="mt-2 font-medium text-slate-600 dark:text-white/60">{a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pb-20">
        <div className="mx-auto max-w-6xl rounded-[2rem] bg-white p-10 text-center shadow-[0_18px_55px_rgba(35,45,75,0.06)] ring-1 ring-slate-200/75 dark:bg-white/10 dark:ring-white/10 md:p-14">
          <h2 className="text-5xl font-semibold tracking-[-0.045em] text-slate-900 dark:text-white">Walk in better prepared.</h2>
          <p className="mx-auto mt-4 max-w-2xl font-medium text-slate-600 dark:text-white/60">Practice, rehearse, improve confidence, and get feedback before the real moment.</p>
          <div className="mt-8"><ButtonLink href="/practice">Start Rehearsing Free</ButtonLink></div>
        </div>
      </section>
    </main>
  );
}
