import type { Metadata } from "next";
import { BrainCircuit, Orbit, RadioTower, Sparkles, type LucideIcon } from "lucide-react";
import { blogs } from "@/content/blogs";
import { articles } from "@/content/articles";
import { Nav } from "@/components/Nav";
import { FeaturedArticle } from "@/components/content/FeaturedArticle";
import { Footer } from "@/components/content/Footer";
import { ResourceSection } from "@/components/content/ResourceSection";

export const metadata: Metadata = {
  title: "Resources | RehearseAI",
  description: "Cognitive performance resources on pressure training, reasoning, interviews, speaking, and difficult conversations.",
  alternates: { canonical: "/resources" },
  openGraph: {
    title: "RehearseAI Resources",
    description: "A premium intelligence library for high-stakes communication and cognitive performance.",
    type: "website",
  },
};

const pillars: Array<[string, string, LucideIcon]> = [
  ["Pressure simulation", "Practice the moments where calm thinking usually disappears.", RadioTower],
  ["Reasoning systems", "Build answers that survive follow-up questions and friction.", Orbit],
  ["Communication psychology", "Understand the emotional mechanics beneath live performance.", Sparkles],
];

export default function ResourcesPage() {
  const all = [...blogs, ...articles];
  const featured = articles[0];

  return (
    <main className="cog-bg min-h-screen overflow-hidden text-primary-token">
      <Nav />
      <section className="relative mx-auto max-w-6xl px-4 py-16">
        <div className="absolute left-1/2 top-8 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full surface-low px-4 py-2 text-sm font-semibold text-secondary-token">
            <BrainCircuit size={16} /> RehearseAI intelligence library
          </div>
          <h1 className="mt-6 text-6xl font-semibold leading-[0.9] tracking-[-0.065em] md:text-8xl">
            Train how you think under pressure.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-medium leading-8 text-secondary-token">
            Editorial guides, deep analysis, and practical frameworks for communication psychology, adaptive pressure, and reasoning under fire.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4">
        <FeaturedArticle entry={featured} />
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-12 md:grid-cols-3">
        {pillars.map(([title, copy, Icon]) => (
          <div key={title} className="rounded-[2rem] surface-low p-6">
            <Icon className="text-[var(--accent-primary)]" size={26} />
            <h2 className="mt-5 text-2xl font-semibold tracking-[-0.04em]">{title}</h2>
            <p className="mt-3 text-sm font-medium leading-6 text-secondary-token">{copy}</p>
          </div>
        ))}
      </section>

      <div className="mx-auto max-w-6xl px-4 pb-16">
        <ResourceSection
          title="Latest Articles"
          description="Deeper research-backed perspectives on adaptive AI, cognitive rehearsal, and performance training."
          entries={articles}
        />
        <ResourceSection
          title="Communication Psychology"
          description="Why smart people freeze, ramble, over-explain, or lose structure when the room gets real."
          entries={blogs.filter((item) => ["Pressure Psychology", "Communication Psychology", "Cognitive Performance"].includes(item.category))}
        />
        <ResourceSection
          title="Pressure Training"
          description="Guides for interviews, panels, presentations, and conversations where pressure changes your thinking."
          entries={all.filter((item) => item.tags.some((tag) => ["pressure", "interviews", "public speaking", "coaching"].includes(tag))).slice(0, 6)}
        />
        <ResourceSection
          title="Difficult Conversations"
          description="Practical cognitive tools for staying clear, calm, and human when emotion enters the room."
          entries={blogs.filter((item) => item.category === "Difficult Conversations" || item.tags.includes("conversation"))}
        />
      </div>
      <Footer />
    </main>
  );
}
