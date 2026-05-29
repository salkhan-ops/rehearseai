import type { Metadata } from "next";
import { LegalLayout } from "@/components/content/LegalLayout";

export const metadata: Metadata = {
  title: "Privacy Policy | RehearseAI",
  description: "Privacy Policy for RehearseAI, including voice transcripts, AI processing, Firestore storage, analytics, and Paddle payments.",
  alternates: { canonical: "/legal/privacy" },
};

const sections = [
  ["Information We Collect", "We collect account information such as email, display name, authentication provider, plan, and login timestamps. We also collect rehearsal setup details, messages, transcripts, reports, analytics, feature usage, and contact submissions."],
  ["Voice and Transcript Data", "Voice mode may capture speech through browser or third-party speech services. For the MVP, voice is converted to text for AI roleplay and feedback. We may store transcripts, messages, timing signals, and derived communication analytics so users can review sessions and track progress."],
  ["AI Processing", "Your prompts, session context, transcript text, and conversation history may be sent to AI providers such as Gemini to generate roleplay responses, reports, reasoning analysis, and coaching suggestions. Do not submit sensitive information you do not want processed by AI systems."],
  ["Analytics and Reasoning Data", "RehearseAI may generate confidence, clarity, composure, reasoning, pressure, communication efficiency, decision tree, and longitudinal performance analytics. These are estimates for practice and feedback, not clinical, legal, employment, or psychological determinations."],
  ["Anonymized Benchmarking", "We may use aggregated and anonymized performance patterns to create benchmark comparisons, improve product quality, and understand recurring training needs. We do not expose private user sessions in benchmarking outputs."],
  ["Authentication", "Authentication is handled through Firebase Authentication. Firebase may process credentials, sign-in provider data, and authentication metadata according to its own service terms and privacy practices."],
  ["Storage", "User profiles, sessions, reports, analytics, entitlements, contact submissions, and usage records may be stored in Google Firestore or related Google Cloud infrastructure."],
  ["Payments", "Paid plan checkout and subscription handling may be processed by Paddle. Paddle may collect billing details, tax information, payment method details, and subscription records. RehearseAI does not store full card numbers."],
  ["Cookies and Local Storage", "We may use cookies, local storage, and similar technologies for authentication state, theme preference, product functionality, analytics, and security."],
  ["How We Use Data", "We use data to provide sessions, generate AI responses, create reports, track entitlements, operate billing, improve the product, respond to support requests, prevent abuse, and develop anonymized performance insights."],
  ["Data Sharing", "We share data with service providers needed to operate RehearseAI, including cloud hosting, authentication, AI, speech, analytics, and payments. We do not sell personal rehearsal transcripts."],
  ["User Rights", "Depending on your location, you may request access, correction, deletion, or export of your personal data. Some data may be retained where required for security, billing, legal, or operational reasons."],
  ["Deletion Requests", "To request account or data deletion, contact privacy@rehearseai.app. We will take reasonable steps to delete or anonymize eligible data while preserving records we are required or permitted to keep."],
  ["Security", "We use technical and organizational safeguards appropriate for an MVP-stage cloud product, including environment variable separation, backend-only AI keys, Firestore rules, and restricted administrative workflows. No system is completely secure."],
  ["Children", "RehearseAI is not intended for children under 13 or the minimum age required in your jurisdiction."],
  ["Contact", "For privacy questions, contact privacy@rehearseai.app."],
];

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="May 29, 2026">
      {sections.map(([title, body]) => (
        <section key={title}>
          <h2>{title}</h2>
          <p>{body}</p>
        </section>
      ))}
    </LegalLayout>
  );
}
