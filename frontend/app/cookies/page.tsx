import type { Metadata } from "next";
import { LegalLayout } from "@/components/content/LegalLayout";

export const metadata: Metadata = {
  title: "Cookie Policy | RehearseAI",
  description: "Cookie and local storage policy for RehearseAI.",
};

const sections = [
  ["Overview", "RehearseAI uses cookies, local storage, and similar browser technologies to operate the product, preserve preferences, and support future analytics and performance measurement."],
  ["Essential Storage", "Essential storage supports authentication state, security, theme preferences, language preferences, and cookie consent. The service may not work correctly without these."],
  ["Analytics Placeholder", "Analytics cookies are not required for core use. They may later help us understand usage patterns and improve onboarding, training loops, and product reliability."],
  ["Performance Placeholder", "Performance technologies may later help measure page speed, errors, and feature reliability."],
  ["Managing Consent", "The MVP cookie banner stores your choice in localStorage. You can clear site data in your browser to reset consent."],
  ["Contact", "For cookie questions, contact privacy@rehearseai.app."],
];

export default function CookiePolicyPage() {
  return (
    <LegalLayout title="Cookie Policy" updated="May 29, 2026">
      {sections.map(([title, body]) => <section key={title}><h2>{title}</h2><p>{body}</p></section>)}
    </LegalLayout>
  );
}
