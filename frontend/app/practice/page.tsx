import Link from "next/link";
import { AnimatedCard, AnimatedPage, StaggeredGrid } from "@/components/animations";
import { Nav } from "@/components/Nav";
import { practiceTypes } from "@/lib/types";

export default function PracticePage() {
  return (
    <main className="min-h-screen bg-[#f4f8fc] dark:bg-[#0e1020]">
      <Nav />
      <AnimatedPage className="mx-auto max-w-6xl px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-5xl font-semibold tracking-[-0.045em] text-slate-900 dark:text-white md:text-6xl">What do you want to rehearse?</h1>
          <p className="mt-5 text-lg font-medium leading-8 text-slate-600 dark:text-white/60">Pick a situation. RehearseAI shapes the persona, pressure, and feedback around it.</p>
        </div>
        <StaggeredGrid className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {practiceTypes.map((type) => (
            <AnimatedCard key={type} className="min-h-40 rounded-[1.5rem] bg-white p-6 shadow-[0_14px_40px_rgba(35,45,75,0.04)] ring-1 ring-slate-200/75 transition dark:bg-white/10 dark:ring-white/10">
              <Link href={`/practice/setup?type=${encodeURIComponent(type)}`} className="block h-full">
                <div className="text-xl font-semibold tracking-[-0.03em] text-slate-900 dark:text-white">{type}</div>
                <p className="mt-3 text-sm font-medium leading-6 text-slate-600 dark:text-white/60">Practice realistic responses, follow-ups, and pressure.</p>
              </Link>
            </AnimatedCard>
          ))}
        </StaggeredGrid>
      </AnimatedPage>
    </main>
  );
}
