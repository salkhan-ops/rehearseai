"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { CalendarClock, Target } from "lucide-react";
import { getFirebaseDb } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";

type EventCourse = {
  id: string;
  title: string;
  eventDate: string;
  practiceType?: string;
};

function daysUntil(iso: string): number {
  const target = new Date(iso);
  target.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / 86_400_000);
}

function urgencyColor(days: number) {
  if (days <= 3) return { ring: "ring-rose-500/40", bg: "bg-rose-950/40", text: "text-rose-400", badge: "bg-rose-500/20 text-rose-300" };
  if (days <= 7) return { ring: "ring-amber-500/40", bg: "bg-amber-950/40", text: "text-amber-400", badge: "bg-amber-500/20 text-amber-200" };
  return { ring: "ring-violet-500/40", bg: "bg-violet-950/30", text: "text-violet-400", badge: "bg-violet-500/20 text-violet-200" };
}

export function EventCountdownCard() {
  const { userId } = useAuth();
  const [events, setEvents] = useState<EventCourse[]>([]);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const db = getFirebaseDb();
        if (!db) return;
        const snap = await getDocs(query(
          collection(db, "courses"),
          where("userId", "==", userId),
          where("status", "in", ["active", "paused"]),
          orderBy("createdAt", "desc"),
        ));
        const found: EventCourse[] = [];
        snap.docs.forEach((d) => {
          const data = d.data();
          const eventDate = data?.intakeAnswers?.eventDate || data?.eventDate;
          if (eventDate && daysUntil(eventDate) >= 0) {
            found.push({ id: d.id, title: data.title || "Upcoming event", eventDate, practiceType: data.practiceCategories?.[0] });
          }
        });
        found.sort((a, b) => daysUntil(a.eventDate) - daysUntil(b.eventDate));
        setEvents(found.slice(0, 3));
      } catch { /* ignore */ }
    })();
  }, [userId]);

  if (events.length === 0) return null;

  return (
    <div className="space-y-3">
      {events.map((ev) => {
        const days = daysUntil(ev.eventDate);
        const c = urgencyColor(days);
        return (
          <Link key={ev.id} href={`/course/${ev.id}`}
            className={`block rounded-2xl p-4 ring-1 ${c.ring} ${c.bg} transition hover:brightness-110`}>
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${c.badge}`}>
                <CalendarClock size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${c.badge}`}>
                    {days === 0 ? "Today!" : days === 1 ? "Tomorrow!" : `${days} days`}
                  </span>
                  {ev.practiceType && (
                    <span className="text-xs text-white/40">{ev.practiceType}</span>
                  )}
                </div>
                <p className="mt-1.5 truncate font-semibold text-white">{ev.title}</p>
                <p className={`mt-0.5 text-xs ${c.text}`}>
                  {days === 0 ? "Your event is today — you're ready." : days <= 3 ? "Final prep window — push hard." : `${new Date(ev.eventDate).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}`}
                </p>
              </div>
              <Target size={16} className={`shrink-0 ${c.text}`} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
