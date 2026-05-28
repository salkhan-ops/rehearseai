import Link from "next/link";
import { Nav } from "@/components/Nav";
import { practiceTypes } from "@/lib/types";

export default function PracticePage() {
  return (
    <main>
      <Nav />
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-4xl font-black tracking-tight md:text-6xl">What do you want to rehearse?</h1>
        <p className="mt-4 max-w-2xl text-lg text-black/60">Pick a situation. RehearseAI will shape the persona, pressure, and feedback around it.</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {practiceTypes.map((type) => (
            <Link key={type} href={`/practice/setup?type=${encodeURIComponent(type)}`} className="min-h-40 rounded-3xl bg-white p-6 shadow-soft ring-1 ring-black/5 transition hover:-translate-y-1 hover:ring-black/15">
              <div className="text-xl font-black">{type}</div>
              <p className="mt-3 text-sm leading-6 text-black/55">Practice realistic responses, follow-ups, and pressure.</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
