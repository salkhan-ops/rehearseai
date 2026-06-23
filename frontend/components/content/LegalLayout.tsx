import { Footer } from "./Footer";
import { Nav } from "@/components/Nav";
import type { ReactNode } from "react";

export function LegalLayout({ title, updated, badge, children }: { title: string; updated: string; badge?: string; children: ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-slate-950 dark:bg-[#07111f] dark:text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-violet-500/12 blur-3xl dark:bg-violet-500/18" />
        <div className="absolute right-[-8rem] top-[16rem] h-[28rem] w-[28rem] rounded-full bg-cyan-400/10 blur-3xl dark:bg-cyan-400/14" />
      </div>
      <Nav />
      <section className="relative z-10 px-4 pb-12 pt-20 text-center">
        <div className="mx-auto max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-5 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-violet-700 ring-1 ring-violet-100 dark:bg-violet-400/10 dark:text-violet-300 dark:ring-violet-400/20">
            {badge ?? "Legal"}
          </span>
          <h1 className="mt-5 text-5xl font-semibold leading-[0.92] tracking-[-0.06em] text-slate-950 dark:text-white md:text-7xl">
            {title}
          </h1>
          <p className="mt-4 text-sm font-semibold text-slate-400 dark:text-white/40">
            Last updated: {updated}
          </p>
        </div>
      </section>
      <section className="relative z-10 mx-auto max-w-4xl px-4 pb-20">
        <div className="overflow-hidden rounded-[2rem] bg-white/80 ring-1 ring-slate-200/80 backdrop-blur-2xl dark:bg-white/[0.055] dark:ring-white/10">
          <div className="divide-y divide-slate-100/80 dark:divide-white/[0.07]">
            {children}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

export function LegalSection({ index, title, children }: { index: number; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-5 p-6 transition hover:bg-slate-50/60 dark:hover:bg-white/[0.03] md:gap-8 md:p-8">
      <div className="flex-shrink-0">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 text-sm font-bold text-white shadow-[0_8px_24px_rgba(109,40,217,0.28)]">
          {String(index).padStart(2, "0")}
        </div>
      </div>
      <div className="min-w-0">
        <h2 className="text-lg font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">{title}</h2>
        <div className="mt-2 text-base font-medium leading-7 text-slate-600 dark:text-white/58">
          {children}
        </div>
      </div>
    </div>
  );
}
