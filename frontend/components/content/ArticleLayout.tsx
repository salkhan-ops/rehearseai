import type { ContentEntry } from "@/content/types";
import { Nav } from "@/components/Nav";
import { BlogCard } from "./BlogCard";
import { Footer } from "./Footer";
import { HeroImage } from "./HeroImage";
import { ReadingProgressBar } from "./ReadingProgressBar";

export function ArticleLayout({ entry, related }: { entry: ContentEntry; related: ContentEntry[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": entry.kind === "article" ? "Article" : "BlogPosting",
    headline: entry.title,
    description: entry.excerpt,
    author: { "@type": "Organization", name: entry.author },
    datePublished: entry.publishedAt,
  };

  return (
    <main className="cog-bg min-h-screen text-primary-token">
      <ReadingProgressBar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Nav />
      <article className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto inline-flex rounded-full surface-low px-4 py-2 text-sm font-semibold text-secondary-token">{entry.category} · {entry.readTime}</div>
          <h1 className="mt-6 text-5xl font-semibold leading-[0.95] tracking-[-0.055em] md:text-7xl">{entry.title}</h1>
          <p className="mt-6 text-xl font-medium leading-9 text-secondary-token">{entry.excerpt}</p>
          <div className="mt-5 text-sm font-semibold text-tertiary-token">{entry.author} · {new Date(entry.publishedAt).toLocaleDateString()}</div>
        </div>
        <HeroImage seed={entry.heroImage} className="mx-auto mt-10 max-w-6xl" />
        <div className="mx-auto mt-16 max-w-[860px]">
          {entry.content.map((block, index) => {
            if (block.type === "heading") {
              return (
                <h2 key={index} className="mt-14 text-3xl font-semibold leading-tight tracking-[-0.035em] text-primary-token first:mt-0 md:text-4xl">
                  {block.text}
                </h2>
              );
            }
            if (block.type === "quote") {
              return (
                <blockquote key={index} className="my-12 rounded-[1.5rem] surface-medium px-6 py-8 text-2xl font-semibold leading-[1.4] text-primary-token sm:-mx-8 sm:px-10 sm:py-9 md:-mx-16 md:text-3xl">
                  {block.text}
                </blockquote>
              );
            }
            if (block.type === "insight") {
              return (
                <aside key={index} className="my-14 rounded-[1.5rem] surface-high px-6 py-8 sm:-mx-8 sm:px-10 sm:py-9 md:-mx-16">
                  <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent-primary)]">{block.title}</div>
                  <p className="mt-5 text-xl font-semibold leading-8 text-primary-token md:text-2xl md:leading-9">{block.text}</p>
                </aside>
              );
            }
            return <p key={index} className="my-7 text-lg font-medium leading-8 text-secondary-token sm:text-xl sm:leading-9">{block.text}</p>;
          })}
        </div>
        {related.length > 0 && (
          <section className="mx-auto mt-24 max-w-6xl">
            <h2 className="text-3xl font-semibold tracking-[-0.04em]">Related intelligence</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {related.map((item) => <BlogCard key={item.slug} entry={item} />)}
            </div>
          </section>
        )}
      </article>
      <Footer />
    </main>
  );
}
