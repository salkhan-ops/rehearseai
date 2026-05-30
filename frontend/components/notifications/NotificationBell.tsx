"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { getNotifications } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export function NotificationBell() {
  const { getToken, user } = useAuth();
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!user) return;
    getToken().then((token) => getNotifications(token)).then((items) => setCount(items.filter((item) => !item.read).length)).catch(() => setCount(0));
  }, [getToken, user]);
  return (
    <Link href="/notifications" className="relative grid size-12 place-items-center rounded-2xl bg-white/80 text-[#6200a8] ring-1 ring-slate-200 transition hover:-translate-y-0.5 dark:bg-white/10 dark:text-violet-100 dark:ring-white/15" aria-label="Notifications">
      <Bell size={18} />
      {count > 0 && <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">{count}</span>}
    </Link>
  );
}
