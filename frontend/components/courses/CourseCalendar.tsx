"use client";

import { motion } from "framer-motion";
import { CalendarPlus, Check, Clock, Flame, Play } from "lucide-react";
import { useMemo, useState } from "react";
import type { CourseSession } from "@/lib/types";

export function CourseCalendar({ sessions, onStart }: { sessions: CourseSession[]; onStart?: (session: CourseSession) => void }) {
  const [view, setView] = useState<"monthly" | "weekly" | "daily">("weekly");
  const completed = sessions.filter((session) => session.completed).length;
  const progress = sessions.length ? Math.round((completed / sessions.length) * 100) : 0;
  const visibleSessions = useMemo(() => {
    if (view === "daily") return sessions.slice(0, 1);
    if (view === "weekly") return sessions.slice(0, 7);
    return sessions;
  }, [sessions, view]);

  function exportCalendar() {
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//RehearseAI//Reasoning Course//EN",
      ...sessions.flatMap((session) => {
        const date = session.scheduledDate.replaceAll("-", "");
        return [
          "BEGIN:VEVENT",
          `UID:${session.id}@rehearseai.app`,
          `DTSTART;VALUE=DATE:${date}`,
          `SUMMARY:${session.generatedScenario.title}`,
          `DESCRIPTION:${session.reasoningFocus} · pressure ${session.pressureLevel}/100 · ${session.durationMinutes} minutes`,
          "END:VEVENT",
        ];
      }),
      "END:VCALENDAR",
    ].join("\n");
    const blob = new Blob([lines], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "rehearseai-reasoning-course.ics";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="rounded-[2rem] bg-white/75 p-5 ring-1 ring-slate-200/80 backdrop-blur-2xl dark:bg-white/[0.07] dark:ring-white/10">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-cyan-100/60">Training calendar</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-slate-950 dark:text-white">Daily missions</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["daily", "weekly", "monthly"] as const).map((item) => (
            <button key={item} onClick={() => setView(item)} className={`rounded-full px-3 py-2 text-xs font-bold capitalize transition ${view === item ? "bg-[#6200a8] text-white" : "bg-violet-50 text-violet-700 dark:bg-white/10 dark:text-cyan-100"}`}>
              {item}
            </button>
          ))}
          <button onClick={exportCalendar} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-700 ring-1 ring-slate-200 dark:bg-white/10 dark:text-white/70 dark:ring-white/10">
            <CalendarPlus size={14} /> Export
          </button>
          <div className="rounded-full bg-violet-50 px-4 py-2 text-sm font-bold text-violet-700 dark:bg-white/10 dark:text-cyan-100">{progress}% complete</div>
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {visibleSessions.map((session, index) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: index * 0.025 }}
            className="group rounded-[1.5rem] bg-white/70 p-4 ring-1 ring-slate-200/80 transition hover:-translate-y-0.5 hover:ring-violet-200 dark:bg-white/[0.06] dark:ring-white/10"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-white/42">{new Date(session.scheduledDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</div>
                <div className="mt-1 text-lg font-semibold tracking-[-0.035em] text-slate-950 dark:text-white">{session.generatedScenario.title}</div>
              </div>
              <span className={`grid size-9 place-items-center rounded-full ${session.completed ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-300/15 dark:text-emerald-200" : "bg-violet-50 text-violet-700 dark:bg-white/10 dark:text-cyan-100"}`}>
                {session.completed ? <Check size={17} /> : <Flame size={17} />}
              </span>
            </div>
            <p className="mt-3 text-sm font-medium leading-6 text-slate-600 dark:text-white/58">{session.reasoningFocus} · pressure {session.pressureLevel}/100</p>
            <div className="mt-4 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-white/42"><Clock size={14} /> {session.durationMinutes} min</span>
              <button onClick={() => onStart?.(session)} className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white transition group-hover:bg-[#6200a8] dark:bg-white/10">
                <Play size={14} /> Start
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
