import type { Metadata } from "next";
import Script from "next/script";
import { AuthProvider } from "@/context/AuthContext";
import { CookieConsent } from "@/components/CookieConsent";
import "reactflow/dist/style.css";
import "./globals.css";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export const metadata: Metadata = {
  title: "RehearseAI",
  description: "Practice the moment before it matters.",
  icons: {
    icon: "/icon.svg",
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
