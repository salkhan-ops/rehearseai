"use client";

import Link from "next/link";
import { Briefcase, BookOpen, BrainCircuit, ChevronDown, CreditCard, Dumbbell, GraduationCap, LayoutDashboard, LogOut, Menu, Moon, Sparkles, Sun, X, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { track } from "@/lib/analytics";
import { NotificationBell } from "@/components/notifications/NotificationBell";

const trainLinks = [
  { href: "/practice", label: "Quick session", description: "Pick an arena, go in now", icon: Zap },
  { href: "/courses/templates", label: "Buy a course", description: "Separate 7, 14, and 21-day packages", icon: GraduationCap },
  { href: "/courses", label: "My courses", description: "Track your active programs", icon: BookOpen },
  { href: "/courses/new", label: "Create custom course", description: "Build a personalised program", icon: Dumbbell },
];

const secondaryLinks = [
  { href: "/progress", label: "My Progress" },
  { href: "/history", label: "Session History" },
  { href: "/resources", label: "Resources" },
  { href: "/blog", label: "Blog" },
  { href: "/settings", label: "Settings" },
  { href: "/pricing", label: "Pricing" },
];

export function Nav() {
  const [dark, setDark] = useState(false);
  const [trainOpen, setTrainOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const trainRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const { loading, logout, user, profile } = useAuth();

  useEffect(() => {
    const stored = window.localStorage.getItem("theme");
    const nextDark = stored === "dark";
    setDark(nextDark);
    document.documentElement.classList.toggle("dark", nextDark);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (trainRef.current && !trainRef.current.contains(e.target as Node)) setTrainOpen(false);
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  function toggleTheme() {
    const nextDark = !dark;
    setDark(nextDark);
    document.documentElement.classList.toggle("dark", nextDark);
    window.localStorage.setItem("theme", nextDark ? "dark" : "light");
  }

  function openAuth(mode: "signin" | "signup") {
    window.dispatchEvent(new CustomEvent("rehearseai:auth", { detail: mode }));
    setMobileOpen(false);
  }

  return (
    <header className="relative z-40">
      <div className="border-b border-slate-200/70 bg-gradient-to-r from-cyan-50 via-violet-50 to-blue-50 px-4 py-3 text-center text-sm font-semibold text-slate-700 dark:border-white/10 dark:from-cyan-400/10 dark:via-violet-500/10 dark:to-blue-500/10 dark:text-white/76">
        <span className="inline-flex items-center justify-center gap-2">
          <BrainCircuit size={16} className="text-violet-700 dark:text-cyan-100" />
          The AI that interviews you back.
          <span className="hidden items-center gap-2 text-slate-500 dark:text-white/42 sm:inline-flex">
            <Sparkles size={14} /> Free to start · No credit card
          </span>
        </span>
      </div>

      <nav className="mx-auto mt-6 flex w-[min(94vw,84rem)] items-center justify-between gap-3 rounded-[1.5rem] bg-white/82 px-4 py-3 shadow-[0_18px_50px_rgba(35,45,75,0.06)] ring-1 ring-slate-200/70 backdrop-blur-xl dark:bg-white/10 dark:ring-white/10">
        <Link href="/" className="flex min-w-0 items-center gap-3 text-base font-semibold tracking-[0.24em] text-slate-900 dark:text-white">
          <span className="relative grid size-9 place-items-center rounded-xl border-2 border-[#8b00ff] text-lg font-bold tracking-normal text-[#8b00ff]">R</span>
          <span className="hidden truncate sm:inline">REHEARSEAI</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-white/72 lg:flex">
          {user ? (
            <>
              <Link href="/practice/setup?type=Job%20Interview" className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 py-2 transition hover:bg-slate-100 dark:hover:bg-white/10">
                <Briefcase size={14} /> Job Interview
              </Link>
              {/* Train dropdown — only for signed-in users */}
              <div ref={trainRef} className="relative shrink-0">
                <button
                  type="button"
                  id="train-menu-button"
                  aria-label="Open training menu"
                  aria-controls="train-menu"
                  onClick={() => { setTrainOpen((open) => !open); setMoreOpen(false); }}
                  className="inline-flex items-center gap-1 whitespace-nowrap rounded-xl px-2.5 py-2 transition hover:bg-slate-100 dark:hover:bg-white/10"
                >
                  Train <ChevronDown size={14} className={`transition-transform ${trainOpen ? "rotate-180" : ""}`} />
                </button>
                {trainOpen && (
                  <div id="train-menu" className="absolute left-0 top-full z-50 mt-3 w-64 rounded-2xl bg-white p-2 shadow-[0_18px_48px_rgba(15,23,42,0.14)] ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-white/10">
                    {trainLinks.map(({ href, label, description, icon: Icon }) => (
                      <Link key={href} href={href} className="flex items-start gap-3 rounded-xl px-3 py-2.5 text-slate-700 transition hover:bg-slate-100 dark:text-white/76 dark:hover:bg-white/10">
                        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700 dark:bg-white/10 dark:text-violet-200"><Icon size={14} /></span>
                        <span>
                          <span className="block text-sm font-semibold text-slate-900 dark:text-white">{label}</span>
                          <span className="mt-0.5 block text-xs font-medium text-slate-500 dark:text-white/45">{description}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <Link href="/dashboard" className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 py-2 transition hover:bg-slate-100 dark:hover:bg-white/10">
                <LayoutDashboard size={14} /> Dashboard
              </Link>
              <Link href="/pricing" className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl bg-violet-50 px-2.5 py-2 text-violet-700 transition hover:bg-violet-100 dark:bg-violet-400/10 dark:text-violet-200 dark:hover:bg-violet-400/15">
                <CreditCard size={14} /> Plans & courses
              </Link>
            </>
          ) : (
            <>
              {/* Public nav — for logged-out visitors */}
              <Link href="/for/interview-practice" className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 py-2 transition hover:bg-slate-100 dark:hover:bg-white/10">
                <Briefcase size={14} /> Job Interview
              </Link>
              <Link href="/pricing" className="shrink-0 whitespace-nowrap rounded-xl px-2.5 py-2 transition hover:bg-slate-100 dark:hover:bg-white/10">Pricing</Link>
              <Link href="/blog" className="shrink-0 whitespace-nowrap rounded-xl px-2.5 py-2 transition hover:bg-slate-100 dark:hover:bg-white/10">Blog</Link>
            </>
          )}

          <div ref={moreRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => { setMoreOpen((open) => !open); setTrainOpen(false); }}
              className="inline-flex items-center gap-1 whitespace-nowrap rounded-xl px-2.5 py-2 transition hover:bg-slate-100 dark:hover:bg-white/10"
            >
              More <ChevronDown size={14} />
            </button>
            {moreOpen && (
              <div className="absolute right-0 top-full z-50 mt-3 w-44 rounded-2xl bg-white p-2 text-sm shadow-[0_18px_48px_rgba(15,23,42,0.14)] ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-white/10">
                {secondaryLinks.map((item) => (
                  <Link key={item.href} href={item.href} className="block rounded-xl px-3 py-2 text-slate-700 transition hover:bg-slate-100 dark:text-white/76 dark:hover:bg-white/10" role="menuitem">
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right section */}
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={toggleTheme} className="grid size-11 place-items-center rounded-2xl bg-white/80 text-[#6200a8] ring-1 ring-slate-200 transition hover:-translate-y-0.5 dark:bg-white/10 dark:text-violet-100 dark:ring-white/15" aria-label="Toggle dark mode">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {user && <NotificationBell />}
          {/* Desktop auth */}
          <div className="hidden items-center gap-1.5 lg:flex">
            {user ? (
              <div className="flex items-center gap-1.5">
                {/* User identity pill */}
                <div className="flex shrink-0 items-center gap-2 rounded-2xl bg-white/80 px-3 py-2 ring-1 ring-slate-200 dark:bg-white/10 dark:ring-white/15">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white">
                    {(profile?.displayName || user.displayName || user.email || "U").charAt(0).toUpperCase()}
                  </span>
                  <span className="max-w-[140px] truncate text-sm font-semibold text-slate-800 dark:text-white">
                    {profile?.displayName || user.displayName || user.email?.split("@")[0] || "Account"}
                  </span>
                </div>
                <button type="button" onClick={logout} className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-2xl bg-white/80 px-3.5 py-3 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 transition hover:-translate-y-0.5 dark:bg-white/10 dark:text-white dark:ring-white/15">
                  <LogOut size={16} /> Sign out
                </button>
              </div>
            ) : (
              <Link href="/?auth=signin" onClick={() => openAuth("signin")} className="shrink-0 whitespace-nowrap rounded-2xl bg-white/80 px-4 py-3 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 transition hover:-translate-y-0.5 dark:bg-white/10 dark:text-white dark:ring-white/15">
                {loading ? "..." : "Sign in"}
              </Link>
            )}
            <Link
              href={user ? "/practice" : "/try"}
              onClick={() => track.ctaClicked(user ? "nav_practice_now" : "nav_start_free")}
              className="shrink-0 whitespace-nowrap rounded-2xl bg-[#6200a8] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(98,0,168,0.25)] transition hover:-translate-y-0.5 hover:bg-[#50008b]"
            >
              {user ? "Practice now" : "Start free"}
            </Link>
          </div>
          {/* Mobile hamburger */}
          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((open) => !open)}
            className="grid size-11 place-items-center rounded-2xl bg-white/80 text-slate-700 ring-1 ring-slate-200 transition hover:-translate-y-0.5 dark:bg-white/10 dark:text-white dark:ring-white/15 lg:hidden"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setMobileOpen(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" />
          {/* Panel */}
          <div className="absolute right-0 top-0 flex h-full w-[min(88vw,360px)] flex-col bg-white shadow-[0_0_60px_rgba(15,23,42,0.2)] dark:bg-slate-950" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-white/10">
              <span className="text-sm font-bold tracking-[0.2em] text-slate-900 dark:text-white">REHEARSEAI</span>
              <button type="button" aria-label="Close menu" onClick={() => setMobileOpen(false)} className="grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-5">
              {user ? (
                <>
                  <Link href="/practice/setup?type=Job%20Interview" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-2xl bg-violet-50 px-3 py-3 text-violet-700 transition hover:bg-violet-100 dark:bg-violet-400/10 dark:text-violet-200">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white text-violet-700 dark:bg-white/10 dark:text-violet-200"><Briefcase size={15} /></span>
                    <span className="text-sm font-semibold">Job Interview</span>
                  </Link>
                  <div className="my-4 h-px bg-slate-100 dark:bg-white/10" />
                  {/* Train section — signed-in only */}
                  <p className="mb-2 px-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-white/30">Train</p>
                  {trainLinks.map(({ href, label, description, icon: Icon }) => (
                    <Link key={href} href={href} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-slate-50 dark:hover:bg-white/10">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700 dark:bg-white/10 dark:text-violet-200"><Icon size={15} /></span>
                      <span>
                        <span className="block text-sm font-semibold text-slate-900 dark:text-white">{label}</span>
                        <span className="block text-xs font-medium text-slate-500 dark:text-white/40">{description}</span>
                      </span>
                    </Link>
                  ))}
                  <div className="my-4 h-px bg-slate-100 dark:bg-white/10" />
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-slate-50 dark:hover:bg-white/10">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white"><LayoutDashboard size={15} /></span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">Dashboard</span>
                  </Link>
                  <Link href="/pricing" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-2xl bg-violet-50 px-3 py-3 text-violet-700 transition hover:bg-violet-100 dark:bg-violet-400/10 dark:text-violet-200">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white text-violet-700 dark:bg-white/10 dark:text-violet-200"><CreditCard size={15} /></span>
                    <span className="text-sm font-semibold">Plans & courses</span>
                  </Link>
                </>
              ) : (
                <>
                  {/* Public links — logged-out visitors */}
                  <Link href="/for/interview-practice" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:text-white/70 dark:hover:bg-white/10">
                    <Briefcase size={15} /> Job Interview
                  </Link>
                  <Link href="/pricing" onClick={() => setMobileOpen(false)} className="block rounded-2xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:text-white/70 dark:hover:bg-white/10">Pricing</Link>
                  <Link href="/blog" onClick={() => setMobileOpen(false)} className="block rounded-2xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:text-white/70 dark:hover:bg-white/10">Blog</Link>
                </>
              )}

              <div className="my-4 h-px bg-slate-100 dark:bg-white/10" />

              {/* More links */}
              <p className="mb-2 px-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-white/30">More</p>
              {secondaryLinks.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className="block rounded-2xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:text-white/70 dark:hover:bg-white/10">
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Auth footer */}
            <div className="border-t border-slate-100 px-4 py-4 dark:border-white/10">
              {user ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-2.5 ring-1 ring-slate-200 dark:bg-white/10 dark:ring-white/10">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
                      {(profile?.displayName || user.displayName || user.email || "U").charAt(0).toUpperCase()}
                    </span>
                    <span className="truncate text-sm font-semibold text-slate-800 dark:text-white">
                      {profile?.displayName || user.displayName || user.email?.split("@")[0] || "Account"}
                    </span>
                  </div>
                  <button type="button" onClick={() => { logout(); setMobileOpen(false); }} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 dark:bg-white/10 dark:text-white">
                    <LogOut size={16} /> Sign out
                  </button>
                </div>
              ) : (
                <div className="grid gap-2">
                  <Link href="/try" onClick={() => setMobileOpen(false)} className="block rounded-2xl bg-[#6200a8] px-5 py-3 text-center text-sm font-semibold text-white">
                    Start free
                  </Link>
                  <Link href="/?auth=signin" onClick={() => openAuth("signin")} className="block rounded-2xl bg-slate-100 px-5 py-3 text-center text-sm font-semibold text-slate-700 dark:bg-white/10 dark:text-white">
                    Sign in
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
