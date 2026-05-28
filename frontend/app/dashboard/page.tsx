"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatedCard, AnimatedPage, StaggeredGrid } from "@/components/animations";
import { Nav } from "@/components/Nav";
import { generateReport, getUserSessions } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Session } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const { getToken, userId } = useAuth();

  useEffect(() => {
    getToken().then((token) => getUserSessions(userId, token)).then(setSessions).catch(() => setSessions([]));
  }, [getToken, userId]);

  async function openReport(session: Session) {
    setLoadingId(session.id);
    const token = await getToken();
    const report = await generateReport(session.id, token);
    router.push(`/report/${report.id}`);
  }

  return (
    <main className="min-h-screen bg-[#f4f8fc] dark:bg-[#0e1020]">
      <Nav />
      <AnimatedPage className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-5xl font-semibold tracking-[-0.045em] text-slate-900 dark:text-white md:text-6xl">Dashboard</h1>
            <p className="mt-4 text-lg font-medium text-slate-600 dark:text-white/60">Track rehearsal history and progress over time.</p>
          </div>
          <Link href="/pricing" className="rounded-2xl bg-[#6200a8] px-5 py-3 text-center font-semibold text-white shadow-[0_14px_30px_rgba(98,0,168,0.24)]">Upgrade</Link>
        </div>
        <div className="mt-8 rounded-[1.75rem] bg-white p-4 shadow-[0_18px_55px_rgba(35,45,75,0.06)] ring-1 ring-slate-200/75 dark:bg-white/10 dark:ring-white/10">
          {sessions.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-2xl font-semibold tracking-[-0.03em] text-slate-900 dark:text-white">No sessions yet</div>
              <Link href="/practice" className="mt-5 inline-flex rounded-2xl bg-[#6200a8] px-5 py-3 font-semibold text-white">Start your first rehearsal</Link>
            </div>
          ) : (
            <StaggeredGrid className="divide-y divide-slate-100 dark:divide-white/10">
              {sessions.map((session) => (
                <AnimatedCard key={session.id} className="grid gap-3 py-4 md:grid-cols-[1.5fr_1fr_1fr_1fr_auto] md:items-center">
                  <div className="font-semibold text-slate-900 dark:text-white">{session.practiceType}</div>
                  <div className="text-sm font-medium text-slate-500 dark:text-white/55">{session.difficulty}</div>
                  <div className="text-sm font-medium text-slate-500 dark:text-white/55">{new Date(session.createdAt).toLocaleDateString()}</div>
                  <div className="text-sm font-semibold text-slate-700 dark:text-white/70">Turns: {session.turnCount}</div>
                  <button onClick={() => openReport(session)} className="rounded-2xl bg-slate-50 px-4 py-2 text-center text-sm font-semibold text-slate-700 ring-1 ring-slate-200 dark:bg-white/10 dark:text-white/70 dark:ring-white/10">
                    {loadingId === session.id ? "Opening..." : "Report"}
                  </button>
                </AnimatedCard>
              ))}
            </StaggeredGrid>
          )}
        </div>
      </AnimatedPage>
    </main>
  );
}
