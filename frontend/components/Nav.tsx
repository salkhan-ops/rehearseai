"use client";

import Link from "next/link";
import { BrainCircuit, ChevronDown, LogOut, Moon, Sparkles, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { NotificationBell } from "@/components/notifications/NotificationBell";

export function Nav() {
  const [dark, setDark] = useState(false);
  const { loading, logout, user } = useAuth();

  useEffect(() => {
    const stored = window.localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextDark = stored ? stored === "dark" : prefersDark;
    setDark(nextDark);
    document.documentElement.classList.toggle("dark", nextDark);
  }, []);

  function toggleTheme() {
    const nextDark = !dark;
    setDark(nextDark);
    document.documentElement.classList.toggle("dark", nextDark);
    window.localStorage.setItem("theme", nextDark ? "dark" : "light");
  }

  return (
    <header className="relative z-40">
      <div className="border-b border-slate-200/70 bg-gradient-to-r from-cyan-50 via-violet-50 to-blue-50 px-4 py-3 text-center text-sm font-semibold text-slate-700 dark:border-white/10 dark:from-cyan-400/10 dark:via-violet-500/10 dark:to-blue-500/10 dark:text-white/76">
        <span className="inline-flex items-center justify-center gap-2">
          <BrainCircuit size={16} className="text-violet-700 dark:text-cyan-100" />
          Practice the moment before it matters.
          <span className="hidden items-center gap-2 text-slate-500 dark:text-white/42 sm:inline-flex">
            <Sparkles size={14} /> Voice-first cognitive simulation
          </span>
        </span>
      </div>
      <nav className="mx-auto mt-6 flex max-w-6xl items-center justify-between rounded-[1.75rem] bg-white/80 px-5 py-4 shadow-[0_18px_50px_rgba(35,45,75,0.06)] ring-1 ring-slate-200/70 backdrop-blur-xl dark:bg-white/10 dark:ring-white/10">
        <Link href="/" className="flex items-center gap-3 text-lg font-semibold tracking-[0.28em] text-slate-900 dark:text-white">
          <span className="relative grid size-9 place-items-center rounded-xl border-2 border-[#8b00ff] text-lg font-bold tracking-normal text-[#8b00ff]">R</span>
          <span className="hidden sm:inline">REHEARSEAI</span>
        </Link>
        <div className="hidden items-center gap-9 text-[15px] font-semibold text-slate-700 dark:text-white/70 md:flex">
          <Link href="/practice" className="inline-flex items-center gap-1">Practice <ChevronDown size={14} /></Link>
          <Link href="/courses">Courses</Link>
          <Link href="/resources">Resources</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/settings">Settings</Link>
          <Link href="/pricing">Pricing</Link>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="grid size-12 place-items-center rounded-2xl bg-white/80 text-[#6200a8] ring-1 ring-slate-200 transition hover:-translate-y-0.5 dark:bg-white/10 dark:text-violet-100 dark:ring-white/15" aria-label="Toggle dark mode">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {user && <NotificationBell />}
          {user ? (
            <button onClick={logout} className="inline-flex items-center gap-2 rounded-2xl bg-white/80 px-5 py-3 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 transition hover:-translate-y-0.5 dark:bg-white/10 dark:text-white dark:ring-white/15">
              <LogOut size={16} /> Sign out
            </button>
          ) : (
            <Link href="/signin" className="rounded-2xl bg-white/80 px-5 py-3 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 transition hover:-translate-y-0.5 dark:bg-white/10 dark:text-white dark:ring-white/15">
              {loading ? "..." : "Sign in"}
            </Link>
          )}
          <Link href="/signup" className="hidden rounded-2xl bg-[#6200a8] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(98,0,168,0.25)] transition hover:-translate-y-0.5 hover:bg-[#50008b] sm:inline-flex">
            Start free
          </Link>
        </div>
      </nav>
    </header>
  );
}
