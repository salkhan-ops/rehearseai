import { Footer } from "./Footer";
import { Nav } from "@/components/Nav";
import type { ReactNode } from "react";

export function LegalLayout({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <main className="cog-bg min-h-screen text-primary-token">
      <Nav />
      <section className="mx-auto max-w-4xl px-4 py-14">
        <div className="rounded-[2rem] surface-high p-6 md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent-primary)]">Legal</p>
          <h1 className="mt-3 text-5xl font-semibold tracking-[-0.055em] md:text-6xl">{title}</h1>
          <p className="mt-3 font-medium text-secondary-token">Last updated: {updated}</p>
          <div className="prose prose-lg mt-10 max-w-none prose-headings:text-[var(--text-primary)] prose-p:text-[var(--text-secondary)] prose-li:text-[var(--text-secondary)] dark:prose-invert">
            {children}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
