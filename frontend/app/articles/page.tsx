import type { Metadata } from "next";
import { articles } from "@/content/articles";
import { Nav } from "@/components/Nav";
import { BlogCard } from "@/components/content/BlogCard";
import { FeaturedArticle } from "@/components/content/FeaturedArticle";
import { Footer } from "@/components/content/Footer";

export const metadata: Metadata = {
  title: "Articles | RehearseAI",
  description: "Long-form intelligence on cognitive performance, adaptive AI rehearsal, and communication under pressure.",
  alternates: { canonical: "/articles" },
};

export default function ArticlesPage() {
  const [featured, ...rest] = articles;

  return (
    <main className="cog-bg min-h-screen text-primary-token">
      <Nav />
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent-primary)]">Long-form intelligence</p>
          <h1 className="mt-4 text-6xl font-semibold leading-[0.9] tracking-[-0.065em] md:text-8xl">Reasoning under fire.</h1>
          <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-secondary-token">
            Deep analytical pieces on the cognitive systems behind speech, pressure, adaptive simulation, and future performance training.
          </p>
        </div>
        <div className="mt-10">
          <FeaturedArticle entry={featured} label="Featured article" />
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {rest.map((entry) => <BlogCard key={entry.slug} entry={entry} />)}
        </div>
      </section>
      <Footer />
    </main>
  );
}
