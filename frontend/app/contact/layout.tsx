import type { Metadata } from "next";

// page.tsx is a client component and can't export metadata itself -- without this,
// the route silently inherited the root layout's title/description/canonical, making
// Google treat it as a duplicate of the homepage instead of its own indexable page.
export const metadata: Metadata = {
  title: "Contact | RehearseAI",
  description: "Get in touch with RehearseAI for support, sales, billing, refunds, privacy questions, or partnerships.",
  alternates: { canonical: "/contact" },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
