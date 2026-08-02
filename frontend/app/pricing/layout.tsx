import type { Metadata } from "next";

// page.tsx is a client component and can't export metadata itself -- without this,
// the route silently inherited the root layout's title/description/canonical, making
// Google treat it as a duplicate of the homepage instead of its own indexable page.
export const metadata: Metadata = {
  title: "Pricing | RehearseAI",
  description: "Simple, transparent pricing for AI-powered interview and conversation practice — free to start, upgrade for unlimited sessions and full analytics.",
  alternates: { canonical: "/pricing" },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
