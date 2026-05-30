import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import { CookieConsent } from "@/components/CookieConsent";
import "./globals.css";

export const metadata: Metadata = {
  title: "RehearseAI",
  description: "Practice the moment before it matters."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body suppressHydrationWarning><AuthProvider>{children}<CookieConsent /></AuthProvider></body>
    </html>
  );
}
