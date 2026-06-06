import type { Metadata } from "next";
import { LegalLayout } from "@/components/content/LegalLayout";

export const metadata: Metadata = {
  title: "Privacy Policy | RehearseAI",
  description: "Privacy Policy for RehearseAI, including voice transcripts, AI processing, Firestore storage, analytics, and Paddle payments.",
  alternates: { canonical: "/privacy" },
};

const sections = [
  ["Information We Collect", "We collect account information such as email, display name, authentication provider, plan, login timestamps, and signup compliance confirmations such as age confirmation and Terms/Privacy acceptance timestamps. We also collect rehearsal setup details, messages, transcripts, reports, analytics, feature usage, and contact submissions."],
  ["Voice and Transcript Data", "Voice mode may capture speech through browser or third-party speech services. For the MVP, voice is converted to text for AI roleplay and feedback. We may store transcripts, messages, timing signals, and derived communication analytics so users can review sessions and track progress."],
  ["Conversation Telemetry", "With telemetry enabled, RehearseAI may collect voice timing and transcript-derived features such as pauses, word counts, filler rates, detected confusion, overexplaining, rushing, interruption signals, and session outcomes. Voice timing and transcript features may be used to improve personalization and conversation timing. Detailed telemetry is temporary by default and may expire after a retention window, while summarized speech-profile settings may remain for personalization."],
  ["Camera-Assisted Timing", "Camera-assisted timing is optional and off by default. If enabled, Google MediaPipe runs locally in your browser to create numeric pause-timing signals such as mouth movement, stillness, and looking-away cues. Video is not recorded, uploaded, or stored. Images, frames, landmarks, and biometric camera data are not sent to our backend or AI providers, and frames are not stored. RehearseAI does not use this feature for facial identity recognition, emotion diagnosis, or mental-health diagnosis. Only aggregated numeric timing signals may be stored if you separately allow local-signal telemetry. You can disable camera-assisted timing anytime, and raw video storage is not supported by default."],
  ["Telemetry Choices", "Users can opt out of conversation telemetry and model-improvement data in settings. If a user opts out, RehearseAI does not write conversationTelemetry records for improvement use and keeps only minimal operational logs needed to run the service."],
  ["Raw Audio Policy", "Raw audio storage is disabled by default. RehearseAI is designed to collect behavioral signals rather than unnecessary private audio, and raw audio should only be enabled through an explicit advanced setting for future features."],
  ["AI Processing", "Your prompts, session context, transcript text, and conversation history may be sent to AI providers such as Gemini to generate roleplay responses, reports, reasoning analysis, and coaching suggestions. Do not submit sensitive information you do not want processed by AI systems."],
  ["Analytics and Reasoning Data", "RehearseAI may generate confidence, clarity, composure, reasoning, pressure, communication efficiency, decision tree, and longitudinal performance analytics. These are estimates for practice and feedback, not clinical, legal, employment, or psychological determinations."],
  ["Anonymized Benchmarking", "We may use aggregated and anonymized performance patterns to create benchmark comparisons, improve product quality, train internal timing classifiers, and understand recurring training needs. Training exports remove email, display name, and direct user identifiers."],
  ["Authentication", "Authentication is handled through Firebase Authentication. Firebase may process credentials, sign-in provider data, and authentication metadata according to its own service terms and privacy practices."],
  ["Storage", "User profiles, sessions, reports, analytics, entitlements, contact submissions, and usage records may be stored in Google Firestore or related Google Cloud infrastructure."],
  ["Payments", "Paid plan checkout and subscription handling may be processed by Paddle. Paddle may collect billing details, tax information, payment method details, and subscription records. RehearseAI does not store full card numbers."],
  ["Cookies and Local Storage", "We may use cookies, local storage, and similar technologies for authentication state, theme preference, product functionality, analytics, and security."],
  ["How We Use Data", "We use data to provide sessions, generate AI responses, create reports, track entitlements, operate billing, improve the product, respond to support requests, prevent abuse, and develop anonymized performance insights."],
  ["Data Sharing", "We share data with service providers needed to operate RehearseAI, including cloud hosting, authentication, AI, speech, analytics, and payments. We do not sell personal rehearsal transcripts."],
  ["Third-Party Providers", "Core providers may include Firebase Authentication, Google Firestore, Gemini AI, Deepgram speech-to-text, Cartesia text-to-speech, Paddle payments, and Google Cloud hosting. Provider availability may change as the service evolves."],
  ["No Selling Personal Data", "RehearseAI does not sell personal data. If this policy changes, we will update this page and provide required choices under applicable law."],
  ["User Rights", "Depending on your location, you may request access, correction, deletion, or export of your personal data. Some data may be retained where required for security, billing, legal, or operational reasons."],
  ["Deletion Requests", "To request account or data deletion, contact privacy@rehearseai.app. We will take reasonable steps to delete or anonymize eligible data while preserving records we are required or permitted to keep."],
  ["Security", "We use technical and organizational safeguards appropriate for an MVP-stage cloud product, including environment variable separation, backend-only AI keys, Firestore rules, and restricted administrative workflows. No system is completely secure."],
  ["Children’s Privacy", "RehearseAI is not intended for children under 13, and children under 13 are not allowed to create an account or use the service. Users must be at least 16. Users under 18 should use RehearseAI with parent or guardian permission. We do not intentionally collect personal information from children under 13."],
  ["Children’s Data Deletion Requests", "If you believe a child under 13 has provided personal information to RehearseAI, contact privacy@rehearseai.app with enough detail for us to identify the account or data. We will take reasonable steps to delete eligible information unless retention is required for security, legal, or operational reasons."],
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
