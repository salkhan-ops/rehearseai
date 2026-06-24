"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { AnimatedCard, AnimatedPage, StaggeredGrid } from "@/components/animations";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Nav } from "@/components/Nav";
import { generateReport, getUserSessions } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { reportHref } from "@/lib/routes";
import { practiceTypes } from "@/lib/types";
import type { Session } from "@/lib/types";

const ALL = "All";
const DIFFICULTIES = [ALL, "Beginner", "Intermediate", "Advanced", "Brutal", "Nerve"];

export default function HistoryPage() {
  const router = useRouter();
  const { getToken, userId } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>(ALL);
  const [difficultyFilter, setDifficultyFilter] = useState<string>(ALL);

  useEffect(() => {
    getToken()
      .then((token) => getUserSessions(userId, token))
      .then(setSessions)
      .catch(() => setSessions([])
      ).finally(() => setLoading(false));
  }, [getToken, userId]);

  async function openReport(session: Session) {
    setLoadingId(session.id);
    try {
      const token = await getToken();
      const report = await generateReport(session.id, token);
      router.push(reportHref(report.id));
    } finally {
      setLoadingId(null);
    }
  }

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      if (s.status === "abandoned") return false;
      if (typeFilter !== ALL && s.practiceType !== typeFilter) return false;
      if (difficultyFilter !== ALL && s.difficulty !== difficultyFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          s.practiceType.toLowerCase().includes(q) ||
          s.difficulty.toLowerCase().includes(q) ||
          (s.topic || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [sessions, typeFilter, difficultyFilter, search]);

  return (
    <main className="cog-bg min-h-screen text-primary-token">
      <Nav />
      <ProtectedRoute>
        <AnimatedPage className="mx-auto max-w-5xl px-4 py-14">
          <Link href="/dashboard" className="mb-8 inline-flex items-center gap-2 rounded-2xl surface-low px-4 py-2.5 text-sm font-semibold text-secondary-token ring-1 ring-[var(--border-soft)] transition hover:-translate-y-0.5">
            <ArrowLeft size={15} /> Dashboard
          </Link>

          <div className="mb-8">
            <h1 className="text-5xl font-semibold tracking-[-0.05em] md:text-6xl">Session history</h1>
            <p className="mt-3 text-lg font-medium text-secondary-token">
              {loading ? "Loading…" : `${sessions.length} session${sessions.length !== 1 ? "s" : ""} total`}
            </p>
          </div>

          {/* Filters */}
          <div className="mb-6 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-token" />
              <input
                type="search"
                placeholder="Search by topic or arena…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-[var(--border-soft)] bg-white/80 py-3 pl-11 pr-4 text-sm font-medium text-primary-token outline-none placeholder:text-tertiary-token focus:border-[var(--accent-primary)] focus:ring-4 focus:ring-violet-100 dark:bg-white/10 dark:focus:ring-violet-900/30"
              />
            </div>

            {/* Practice type filter */}
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-tertiary-token">Arena</p>
              <div className="flex flex-wrap gap-2">
                {[ALL, ...practiceTypes].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setTypeFilter(type)}
                    className={`rounded-2xl px-3 py-1.5 text-xs font-semibold ring-1 transition ${typeFilter === type ? "bg-[#6200a8] text-white ring-transparent" : "surface-low text-secondary-token ring-[var(--border-soft)] hover:text-primary-token"}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty filter */}
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-tertiary-token">Difficulty</p>
              <div className="flex flex-wrap gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficultyFilter(d)}
                    className={`rounded-2xl px-3 py-1.5 text-xs font-semibold ring-1 transition ${difficultyFilter === d ? "bg-slate-900 text-white ring-transparent dark:bg-white dark:text-slate-900" : "surface-low text-secondary-token ring-[var(--border-soft)] hover:text-primary-token"}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results */}
          {loading ? (
            <div className="py-20 text-center font-semibold text-secondary-token">Loading sessions…</div>
          ) : filtered.length === 0 ? (
            <div className="rounded-[2rem] surface-low p-12 text-center">
              <p className="text-xl font-semibold text-primary-token">No sessions match</p>
              <p className="mt-2 font-medium text-secondary-token">Try adjusting the filters or start a new session.</p>
              <Link href="/practice" className="mt-6 inline-flex rounded-2xl bg-[#6200a8] px-5 py-3 font-semibold text-white">Start a session</Link>
            </div>
          ) : (
            <div className="rounded-[1.75rem] surface-low p-4">
              <p className="mb-4 px-2 text-sm font-semibold text-tertiary-token">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</p>
              <StaggeredGrid className="divide-y divide-[var(--border-soft)]">
                {filtered.map((session) => (
                  <AnimatedCard key={session.id} className="grid gap-3 py-4 md:grid-cols-[1.6fr_0.9fr_0.9fr_0.7fr_auto] md:items-center">
                    <div>
                      <div className="font-semibold text-primary-token">{session.practiceType}</div>
                      {session.topic && <div className="mt-0.5 text-xs font-medium text-tertiary-token line-clamp-1">{session.topic}</div>}
                    </div>
                    <div>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${session.difficulty === "Nerve" ? "bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-200" : session.difficulty === "Brutal" ? "bg-orange-50 text-orange-700 dark:bg-orange-400/10 dark:text-orange-200" : "surface-medium text-secondary-token"}`}>
                        {session.difficulty}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-secondary-token">{new Date(session.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</div>
                    <div className="text-sm font-semibold text-primary-token">{session.turnCount} turns</div>
                    <button
                      type="button"
                      onClick={() => openReport(session)}
                      className="rounded-2xl surface-medium px-4 py-2 text-sm font-semibold text-primary-token ring-1 ring-[var(--border-soft)] transition hover:-translate-y-0.5"
                    >
                      {loadingId === session.id ? "Opening…" : "Report"}
                    </button>
                  </AnimatedCard>
                ))}
              </StaggeredGrid>
            </div>
          )}
        </AnimatedPage>
      </ProtectedRoute>
    </main>
  );
}
