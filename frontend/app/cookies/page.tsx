import type { Metadata } from "next";
import { LegalLayout, LegalSection } from "@/components/content/LegalLayout";

export const metadata: Metadata = {
  title: "Cookie Policy | RehearseAI",
  description: "Cookie and local storage policy for RehearseAI.",
};

const sections: [string, string][] = [
  ["Overview", "RehearseAI uses cookies, local storage, and similar browser technologies to operate the product, preserve preferences, and support analytics and performance measurement."],
  ["Essential Storage", "Essential storage supports authentication state, security, theme preferences, language preferences, and cookie consent. The service may not work correctly without these."],
  ["Analytics", "Analytics cookies help us understand usage patterns and improve onboarding, training loops, and product reliability. These are not required for core product use."],
  ["Performance", "Performance technologies help measure page speed, errors, and feature reliability to improve the product experience."],
  ["Managing Consent", "Your cookie preference is stored in localStorage. You can clear site data in your browser to reset consent at any time."],
  ["Contact", "For cookie questions, email support@rehearseai.dev."],
];

export default function CookiePolicyPage() {
  return (
    <LegalLayout title="Cookie Policy" updated="June 23, 2026" badge="Privacy">
      {sections.map(([title, body], i) => (
        <LegalSection key={title} index={i + 1} title={title}>
          <p>{body}</p>
        </LegalSection>
      ))}
    </LegalLayout>
  );
}
