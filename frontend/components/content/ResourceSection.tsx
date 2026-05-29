import type { ContentEntry } from "@/content/types";
import { BlogCard } from "./BlogCard";

export function ResourceSection({ title, description, entries }: { title: string; description: string; entries: ContentEntry[] }) {
  return (
    <section className="py-10">
      <div className="mb-6 max-w-3xl">
        <h2 className="text-4xl font-semibold tracking-[-0.05em] text-primary-token">{title}</h2>
        <p className="mt-3 font-medium leading-7 text-secondary-token">{description}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {entries.map((entry) => <BlogCard key={entry.slug} entry={entry} />)}
      </div>
    </section>
  );
}
