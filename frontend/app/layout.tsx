import type { Metadata } from "next";
import Script from "next/script";
import { AuthProvider } from "@/context/AuthContext";
import { CookieConsent } from "@/components/CookieConsent";
import "reactflow/dist/style.css";
import "./globals.css";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export const metadata: Metadata = {
  title: "RehearseAI — The AI that interviews you back.",
  description: "Practice your job interview, salary negotiation, presentation, or pitch out loud. The AI challenges, interrupts, and scores how you think under pressure — free to start, no card needed.",
  icons: { icon: "/icon.svg" },
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
        {GA_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script id="ga-init" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { page_path: window.location.pathname });
            `}</Script>
          </>
        )}
        <AuthProvider>{children}<CookieConsent /></AuthProvider>
      </body>
    </html>
  );
}
