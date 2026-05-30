"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";
import { AnimatedPage } from "@/components/animations";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Nav } from "@/components/Nav";
import { getNotifications, markNotificationRead } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { NotificationItem } from "@/lib/types";

export default function NotificationsPage() {
  const { getToken } = useAuth();
  const [items, setItems] = useState<NotificationItem[]>([]);
  useEffect(() => {
    getToken().then((token) => getNotifications(token)).then(setItems).catch(() => setItems([]));
  }, [getToken]);

  async function markRead(id: string) {
    const token = await getToken();
    const updated = await markNotificationRead(id, token);
    setItems((current) => current.map((item) => item.id === id ? updated : item));
  }

  return (
    <main className="min-h-screen bg-white dark:bg-[#07111f]">
      <Nav />
      <ProtectedRoute>
        <AnimatedPage className="mx-auto max-w-4xl px-4 py-14">
          <div className="mb-8">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-violet-700 dark:text-cyan-100/60">Notification center</p>
            <h1 className="mt-3 text-5xl font-semibold tracking-[-0.06em] text-slate-950 dark:text-white">Training signals.</h1>
          </div>
          <div className="space-y-3">
            {items.length === 0 ? <div className="rounded-[2rem] bg-white/75 p-8 text-center font-semibold text-slate-600 ring-1 ring-slate-200 dark:bg-white/[0.07] dark:text-white/58 dark:ring-white/12">No notifications yet.</div> : items.map((item) => (
              <div key={item.id} className="rounded-[1.5rem] bg-white/75 p-5 ring-1 ring-slate-200 dark:bg-white/[0.07] dark:ring-white/12">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-violet-700 dark:text-cyan-100/60"><Bell size={14} /> {item.type.replaceAll("_", " ")}</div>
                    <h2 className="mt-2 text-xl font-semibold tracking-[-0.035em] text-slate-950 dark:text-white">{item.title}</h2>
                    <p className="mt-2 font-medium leading-7 text-slate-600 dark:text-white/58">{item.message}</p>
                  </div>
                  {!item.read && <button onClick={() => markRead(item.id)} className="rounded-full bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700 dark:bg-white/10 dark:text-cyan-100"><Check size={14} /></button>}
                </div>
                {item.actionUrl && <Link href={item.actionUrl} className="mt-4 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white dark:bg-white/12">Open</Link>}
              </div>
            ))}
          </div>
        </AnimatedPage>
      </ProtectedRoute>
    </main>
  );
}
