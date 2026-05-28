import Link from "next/link";
import type { ReactNode } from "react";

export function ButtonLink({ href, children, variant = "primary" }: { href: string; children: ReactNode; variant?: "primary" | "secondary" }) {
  const classes = variant === "primary"
    ? "bg-[#6200a8] text-white shadow-[0_14px_30px_rgba(98,0,168,0.24)] hover:-translate-y-0.5 hover:bg-[#50008b]"
    : "bg-white/70 text-slate-700 ring-1 ring-slate-200 hover:-translate-y-0.5 hover:bg-white dark:bg-white/10 dark:text-white/80 dark:ring-white/15 dark:hover:bg-white/15";
  return <Link href={href} className={`inline-flex items-center justify-center rounded-2xl px-6 py-4 text-base font-semibold transition ${classes}`}>{children}</Link>;
}
