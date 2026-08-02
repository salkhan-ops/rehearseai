import type { Metadata } from "next";

// page.tsx is a client component and can't export metadata itself -- without this,
// the route silently inherited the root layout's title/description/canonical, making
// Google treat it as a duplicate of the homepage instead of its own indexable page.
export const metadata: Metadata = {
  title: "Try a Free Practice Session | RehearseAI",
  description: "Start a free AI-powered practice session right now — no signup required. Pick a scenario and see how RehearseAI pushes back.",
  alternates: { canonical: "/try" },
};

export default function TryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
