"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { FormEvent, useState } from "react";
import { Nav } from "@/components/Nav";
import { createSession } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { difficulties, Difficulty, practiceTypes, PracticeType } from "@/lib/types";

function SetupForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [practiceType, setPracticeType] = useState<PracticeType>((params.get("type") as PracticeType) || "Job Interview");
  const [difficulty, setDifficulty] = useState<Difficulty>((params.get("difficulty") as Difficulty) || "Realistic");
  const [loading, setLoading] = useState(false);
  const { getToken, userId } = useAuth();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const data = new FormData(event.currentTarget);
    const token = await getToken();
    const session = await createSession({
      userId,
      practiceType,
      difficulty,
      topic: String(data.get("topic")),
      context: String(data.get("context")),
      goal: String(data.get("goal")),
      optionalNotes: String(data.get("optionalNotes") || "")
    }, token);
    router.push(`/session/${session.id}`);
  }

  return (
    <main>
      <Nav />
      <section className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-4xl font-black md:text-5xl">Set up your rehearsal</h1>
        <form onSubmit={onSubmit} className="mt-8 space-y-5 rounded-[2rem] bg-white p-5 shadow-soft ring-1 ring-black/5 md:p-8">
          <label className="block text-sm font-bold">Practice type
            <select value={practiceType} onChange={(event) => setPracticeType(event.target.value as PracticeType)} className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3">
              {practiceTypes.map((type) => <option key={type}>{type}</option>)}
            </select>
          </label>
          <label className="block text-sm font-bold">Topic
            <input name="topic" required className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3" placeholder="Senior product manager interview" />
          </label>
          <label className="block text-sm font-bold">Context
            <textarea name="context" required rows={4} className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3" placeholder="I have a final round interview with a skeptical VP..." />
          </label>
          <label className="block text-sm font-bold">Goal
            <input name="goal" required className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3" placeholder="Sound clear, calm, and senior under pressure" />
          </label>
          <div>
            <div className="text-sm font-bold">Difficulty</div>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {difficulties.map((item) => (
                <button key={item} type="button" onClick={() => setDifficulty(item)} className={`rounded-2xl px-4 py-3 text-sm font-bold ring-1 ${difficulty === item ? "bg-ink text-white ring-ink" : "bg-mist ring-black/10"}`}>{item}</button>
              ))}
            </div>
          </div>
          <label className="block text-sm font-bold">Optional notes
            <textarea name="optionalNotes" rows={3} className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3" placeholder="Anything the AI should know?" />
          </label>
          <button disabled={loading} className="w-full rounded-full bg-ink px-5 py-4 font-black text-white transition hover:bg-black disabled:opacity-60">{loading ? "Creating..." : "Start session"}</button>
        </form>
      </section>
    </main>
  );
}

export default function SetupPage() {
  return (
    <Suspense fallback={<main><Nav /><div className="px-4 py-12 text-center font-bold">Loading setup...</div></main>}>
      <SetupForm />
    </Suspense>
  );
}
