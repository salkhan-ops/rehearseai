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
      <article className="mx-auto max-w-5xl px-4 py-12">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto inline-flex rounded-full surface-low px-4 py-2 text-sm font-semibold text-secondary-token">{entry.category} · {entry.readTime}</div>
          <h1 className="mt-6 text-5xl font-semibold leading-[0.95] tracking-[-0.055em] md:text-7xl">{entry.title}</h1>
          <p className="mt-6 text-xl font-medium leading-9 text-secondary-token">{entry.excerpt}</p>
          <div className="mt-5 text-sm font-semibold text-tertiary-token">{entry.author} · {new Date(entry.publishedAt).toLocaleDateString()}</div>
        </div>
        <HeroImage seed={entry.heroImage} className="mt-10" />
        <div className="prose prose-lg mx-auto mt-12 max-w-3xl prose-headings:tracking-[-0.04em] prose-p:font-medium prose-p:leading-8 prose-p:text-[var(--text-secondary)] prose-headings:text-[var(--text-primary)] dark:prose-invert">
          {entry.content.map((block, index) => {
            if (block.type === "heading") return <h2 key={index}>{block.text}</h2>;
            if (block.type === "quote") return <blockquote key={index} className="rounded-[1.5rem] surface-medium p-6 text-2xl font-semibold leading-9 not-italic text-primary-token">{block.text}</blockquote>;
            if (block.type === "insight") {
              return (
                <div key={index} className="my-8 rounded-[1.5rem] surface-high p-6">
                  <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent-primary)]">{block.title}</div>
                  <p className="mt-3 !mb-0">{block.text}</p>
                </div>
              );
            }
            return <p key={index}>{block.text}</p>;
          })}
        </div>
        {related.length > 0 && (
          <section className="mt-16">
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
