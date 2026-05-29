import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import type { ContentEntry } from "@/content/types";
import { HeroImage } from "./HeroImage";

export function FeaturedArticle({ entry, label = "Featured Insight" }: { entry: ContentEntry; label?: string }) {
  const href = entry.kind === "article" ? `/articles/${entry.slug}` : `/blog/${entry.slug}`;
  return (
    <Link href={href} className="grid gap-6 rounded-[2.5rem] surface-high p-4 transition hover:-translate-y-1 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
      <HeroImage seed={entry.heroImage} className="min-h-[320px]" />
      <div className="p-2 md:p-6">
        <div className="inline-flex items-center gap-2 rounded-full surface-medium px-4 py-2 text-sm font-semibold text-secondary-token">
          <Sparkles size={16} /> {label}
        </div>
        <h2 className="mt-5 text-4xl font-semibold leading-[0.95] tracking-[-0.055em] text-primary-token md:text-6xl">{entry.title}</h2>
        <p className="mt-5 text-lg font-medium leading-8 text-secondary-token">{entry.excerpt}</p>
        <div className="mt-7 inline-flex items-center gap-2 font-semibold text-[var(--accent-primary)]">
          Read the intelligence brief <ArrowRight size={18} />
        </div>
      </div>
    </Link>
  );
}
