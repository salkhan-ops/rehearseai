import type { Metadata } from "next";
import { Suspense } from "react";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { MetaPixel } from "@/components/analytics/MetaPixel";
import { Clarity } from "@/components/analytics/Clarity";
import { EngagementTracker } from "@/components/analytics/EngagementTracker";
import { AuthProvider } from "@/context/AuthContext";
import { CookieConsent } from "@/components/CookieConsent";
import "reactflow/dist/style.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://rehearseai.dev"),
  title: "RehearseAI — The AI that interviews you back.",
  description: "Practice your job interview, salary negotiation, presentation, or pitch out loud. The AI challenges, interrupts, and scores how you think under pressure — free to start, no card needed.",
  icons: { icon: "/icon.svg" },
  // The homepage renders for any query string (e.g. /?auth=signin, used to deep-link the
  // signin/signup dialog) -- without an explicit canonical, Google indexes each variant as
  // its own duplicate page. This is a client component so it can't export its own metadata;
  // the root layout's canonical is what actually applies to "/".
  alternates: { canonical: "/" },
  openGraph: {
    title: "RehearseAI — The AI that interviews you back.",
    description: "Practice your job interview, salary negotiation, presentation, or pitch out loud. The AI challenges, interrupts, and scores how you think under pressure.",
    url: "https://rehearseai.dev",
    siteName: "RehearseAI",
    images: [{ url: "https://rehearseai.dev/og-image.png", width: 1200, height: 630, alt: "RehearseAI — AI practice for high-stakes conversations" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RehearseAI — The AI that interviews you back.",
    description: "Practice your job interview, salary negotiation, or pitch out loud. The AI pushes back. Free to start.",
    images: ["https://rehearseai.dev/og-image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Suspense fallback={null}><MetaPixel /></Suspense>
        <GoogleAnalytics />
        <Clarity />
        <Suspense fallback={null}><EngagementTracker /></Suspense>
        <AuthProvider>{children}<CookieConsent /></AuthProvider>
      </body>
    </html>
  );
}
