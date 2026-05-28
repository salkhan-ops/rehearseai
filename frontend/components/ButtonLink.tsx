import Link from "next/link";
import type { ReactNode } from "react";

export function ButtonLink({ href, children, variant = "primary" }: { href: string; children: ReactNode; variant?: "primary" | "secondary" }) {
  const classes = variant === "primary"
    ? "bg-ink text-white hover:-translate-y-0.5 hover:bg-black"
    : "bg-white text-ink ring-1 ring-black/10 hover:-translate-y-0.5 hover:ring-black/20";
  return <Link href={href} className={`inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-bold shadow-soft transition ${classes}`}>{children}</Link>;
}
