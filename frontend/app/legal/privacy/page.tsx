import type { Metadata } from "next";
import { LegalLayout, LegalSection } from "@/components/content/LegalLayout";

export const metadata: Metadata = {
  title: "Privacy Policy | RehearseAI",
  description: "Privacy Policy for RehearseAI, including voice transcripts, AI processing, Firestore storage, analytics, and Paddle payments.",
  alternates: { canonical: "/privacy" },
};

const sections: [string, string][] = [
  ["Information We Collect", "We collect account information such as email, display name, authentication provider, plan, login timestamps, and signup compliance confirmations such as age confirmation and Terms/Privacy acceptance timestamps. We also collect rehearsal setup details, messages, transcripts, reports, analytics, feature usage, and contact submissions."],
  ["Voice and Transcript Data", "Voice mode may capture speech through browser or third-party speech services. Voice is converted to text for AI roleplay and feedback. We may store transcripts, messages, timing signals, and derived communication analytics so users can review sessions and track progress."],
  ["Conversation Telemetry", "With telemetry enabled, RehearseAI may collect voice timing and transcript-derived features such as pauses, word counts, filler rates, detected confusion, overexplaining, rushing, and interruption signals. Detailed telemetry is temporary by default and may expire after a retention window, while summarised speech-profile settings may remain for personalisation."],
  ["Camera-Assisted Timing", "Camera-assisted timing is optional and off by default. If enabled, Google MediaPipe runs locally in your browser to create numeric pause-timing signals. Video is not recorded, uploaded, or stored. No biometric or identity data is sent to our servers. You can disable this at any time."],
  ["Telemetry Choices", "You can opt out of conversation telemetry and model-improvement data in Settings. If you opt out, RehearseAI does not write telemetry records for improvement use and keeps only minimal operational logs needed to run the service."],
  ["Raw Audio Policy", "Raw audio storage is disabled by default. RehearseAI is designed to collect behavioural signals rather than private audio. Raw audio can only be enabled through an explicit advanced setting."],
  ["AI Processing", "Your prompts, session context, transcript text, and conversation history may be sent to AI providers such as Gemini to generate roleplay responses, reports, reasoning analysis, and coaching suggestions. Do not submit sensitive information you do not want processed by third-party AI systems."],
  ["Analytics and Reasoning Data", "RehearseAI may generate confidence, clarity, composure, reasoning, pressure, and communication efficiency analytics. These are estimates for practice and feedback purposes — not clinical, legal, employment, or psychological determinations."],
  ["Anonymised Benchmarking", "We may use aggregated and anonymised performance patterns to create benchmark comparisons, improve product quality, and understand recurring training needs. Exports remove email, display name, and direct user identifiers."],
  ["Authentication", "Authentication is handled through Firebase Authentication. Firebase may process credentials, sign-in provider data, and authentication metadata according to its own service terms."],
  ["Storage", "User profiles, sessions, reports, analytics, entitlements, contact submissions, and usage records are stored in Google Firestore or related Google Cloud infrastructure."],
  ["Payments", "Paid plan checkout and subscription handling is processed by Paddle, who acts as Merchant of Record. Paddle collects billing details, tax information, and payment method details. RehearseAI does not store full card numbers. For billing queries, contact refund@rehearseai.dev."],
  ["Cookies and Local Storage", "We may use cookies, local storage, and similar technologies for authentication state, theme preference, product functionality, analytics, and security."],
  ["How We Use Data", "We use data to provide sessions, generate AI responses, create reports, track entitlements, operate billing, improve the product, respond to support requests, prevent abuse, and develop anonymised performance insights."],
  ["Data Sharing", "We share data with service providers needed to operate RehearseAI, including cloud hosting, authentication, AI, speech, analytics, and payments. We do not sell personal rehearsal transcripts or identifiable user data."],
  ["Third-Party Providers", "Core providers include Firebase Authentication, Google Firestore, Gemini AI, Deepgram speech-to-text, Cartesia text-to-speech, Paddle payments, and Google Cloud hosting. Provider availability may change as the service evolves."],
  ["User Rights", "Depending on your location, you may request access, correction, deletion, or export of your personal data. To submit a request, email support@rehearseai.dev. Some data may be retained where required for security, billing, legal, or operational reasons."],
  ["Security", "We use technical and organisational safeguards appropriate for a cloud SaaS product, including environment variable separation, backend-only AI keys, Firestore security rules, and restricted administrative workflows. No system is completely secure."],
  ["Children's Privacy", "RehearseAI is not intended for children under 13 and does not knowingly collect personal information from them. Users must be at least 16. Users under 18 should use RehearseAI with parent or guardian permission. If you believe a child under 13 has provided personal information, contact support@rehearseai.dev."],
  ["Contact", "For privacy questions, data deletion, or data access requests, email support@rehearseai.dev."],
];

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="June 23, 2026" badge="Privacy">
      {sections.map(([title, body], i) => (
        <LegalSection key={title} index={i + 1} title={title}>
          <p>{body}</p>
        </LegalSection>
      ))}
    </LegalLayout>
  );
}
