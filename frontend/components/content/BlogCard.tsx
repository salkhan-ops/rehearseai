import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ContentEntry } from "@/content/types";

export function BlogCard({ entry }: { entry: ContentEntry }) {
  const href = entry.kind === "article" ? `/articles/${entry.slug}` : `/blog/${entry.slug}`;
  return (
    <Link href={href} className="group block rounded-[2rem] surface-low p-5 transition hover:-translate-y-1">
      <div className="mb-7 flex items-center justify-between">
        <span className="rounded-full surface-medium px-3 py-1 text-xs font-semibold text-secondary-token">{entry.category}</span>
        <ArrowUpRight className="text-tertiary-token transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--accent-primary)]" size={18} />
      </div>
      <h3 className="text-2xl font-semibold leading-tight tracking-[-0.04em] text-primary-token">{entry.title}</h3>
      <p className="mt-3 line-clamp-3 text-sm font-medium leading-6 text-secondary-token">{entry.excerpt}</p>
      <div className="mt-6 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.14em] text-tertiary-token">
        <span>{entry.readTime}</span>
        <span>{new Date(entry.publishedAt).toLocaleDateString("en", { month: "short", day: "numeric" })}</span>
      </div>
    </Link>
  );
}
