"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
    <main>
      <Nav />
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-4xl font-black md:text-6xl">Dashboard</h1>
            <p className="mt-3 text-black/60">Track rehearsal history and progress over time.</p>
          </div>
          <Link href="/pricing" className="rounded-full bg-ink px-5 py-3 text-center font-bold text-white">Upgrade</Link>
        </div>
        <div className="mt-8 rounded-[2rem] bg-white p-4 shadow-soft ring-1 ring-black/5">
          {sessions.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-2xl font-black">No sessions yet</div>
              <Link href="/practice" className="mt-5 inline-flex rounded-full bg-iris px-5 py-3 font-bold text-white">Start your first rehearsal</Link>
            </div>
          ) : (
            <div className="divide-y divide-black/10">
              {sessions.map((session) => (
                <div key={session.id} className="grid gap-3 py-4 md:grid-cols-[1.5fr_1fr_1fr_1fr_auto] md:items-center">
                  <div className="font-black">{session.practiceType}</div>
                  <div className="text-sm text-black/55">{session.difficulty}</div>
                  <div className="text-sm text-black/55">{new Date(session.createdAt).toLocaleDateString()}</div>
                  <div className="text-sm font-bold">Turns: {session.turnCount}</div>
                  <button onClick={() => openReport(session)} className="rounded-full bg-mist px-4 py-2 text-center text-sm font-bold">
                    {loadingId === session.id ? "Opening..." : "Report"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
