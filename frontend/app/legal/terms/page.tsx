import type { Metadata } from "next";
import { LegalLayout, LegalSection } from "@/components/content/LegalLayout";

export const metadata: Metadata = {
  title: "Terms & Conditions | RehearseAI",
  description: "Terms of Service for RehearseAI, including AI simulation, billing, acceptable use, and service limitations.",
  alternates: { canonical: "/terms" },
};

const sections = [
  ["Acceptance of Terms", "By using RehearseAI, you agree to these Terms of Service. If you do not agree, do not use the service. These terms apply to the website, application, voice features, reports, analytics, and all related services."],
  ["Eligibility", "You must be at least 16 years old to create an account or use RehearseAI. If you are under 18, you should use RehearseAI only with permission from a parent or guardian. Children under 13 are not permitted to create an account or use the service."],
  ["Nature of the Service", "RehearseAI provides AI-generated rehearsal simulations and feedback for communication, reasoning, and cognitive performance practice. The service is educational and coaching-oriented. It is not therapy, legal advice, medical advice, financial advice, employment advice, or a substitute for professional judgment."],
  ["Minor Safety", "RehearseAI is not child-focused and does not create child-directed practice categories. The service must not be marketed or used as therapy, emotional support, medical care, or crisis support for minors."],
  ["AI-Generated Content Disclaimer", "AI roleplay, feedback, reports, scores, reasoning maps, and recommendations may be inaccurate, incomplete, or unsuitable for your context. You are responsible for evaluating outputs before relying on them. RehearseAI does not guarantee that AI-generated content reflects what a real interviewer, employer, customer, panelist, investor, examiner, or conversation partner will do."],
  ["No Guarantee of Outcomes", "RehearseAI does not guarantee interview success, job offers, promotion, salary increases, sales outcomes, investor funding, academic success, relationship outcomes, or any other real-world result. The service is designed to help you practice, rehearse, improve confidence, and prepare better — not to guarantee results."],
  ["User Accounts", "You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. You agree to provide accurate information and to notify us promptly if you suspect unauthorised access."],
  ["Acceptable Use", "You may use RehearseAI for lawful personal or business communication practice. You must not use the service to harass others, generate abusive content, impersonate people without permission, violate privacy, attempt security attacks, or train for illegal, discriminatory, or harmful conduct."],
  ["Prohibited Conduct", "You must not reverse engineer the service, scrape or overload systems, bypass entitlements, share paid access without authorisation, upload malicious content, or use RehearseAI to create content that is unlawful, abusive, discriminatory, deceptive, or harmful."],
  ["Subscriptions and Billing", "Paid subscriptions are processed through Paddle. Prices, taxes, billing intervals, plan limits, and entitlements are shown at checkout or inside the product. Paddle acts as Merchant of Record where applicable. You are responsible for reviewing checkout details before purchase."],
  ["Paddle as Merchant of Record", "Paddle acts as Merchant of Record for paid subscriptions, meaning Paddle handles payment processing, taxes, invoices, and certain billing communications on our behalf. RehearseAI controls all product access and entitlements. For billing disputes, contact refund@rehearseai.dev."],
  ["Cancellation Policy", "You may cancel from your subscription page at any time. Cancellation stops future renewals. Access continues through the end of the current paid billing period. No partial-period refunds are issued unless required by applicable law or our Refund Policy."],
  ["Refunds", "Refunds are governed by our Refund Policy. To request a refund, email refund@rehearseai.dev with your account email and Paddle receipt. We review all requests within 3 business days."],
  ["Intellectual Property", "RehearseAI, its interface, product systems, brand, prompts, analytics formats, and software are owned by RehearseAI or its licensors. You retain rights to content you submit, subject to the limited licence needed for RehearseAI to process, analyse, store, and display it for the service."],
  ["Privacy", "Use of the service is governed by our Privacy Policy, which explains how we collect, process, store, and delete data including voice transcripts, rehearsal messages, analytics, and billing-related information."],
  ["Service Availability", "The service may be unavailable, interrupted, delayed, or modified at any time. AI providers, speech services, payment providers, hosting services, and other third parties may affect availability. We do not guarantee uptime or uninterrupted access."],
  ["Termination", "We may suspend or terminate access if you violate these terms, create risk, misuse the service, fail to pay, or if required by law. You may stop using RehearseAI at any time by deleting your account."],
  ["Limitation of Liability", "To the fullest extent permitted by applicable law, RehearseAI is not liable for indirect, incidental, consequential, special, exemplary, or lost-profit damages arising from use of the service or reliance on AI-generated outputs."],
  ["Governing Law", "These terms are governed by the laws of the jurisdiction in which RehearseAI is registered. Disputes will be resolved through the courts of that jurisdiction unless otherwise required by applicable consumer law."],
  ["Contact", "For legal questions, contact support@rehearseai.dev. For billing, contact refund@rehearseai.dev."],
  ["Modifications", "We may update these terms as the product evolves. Material changes will be communicated through the product or by email. Continued use after changes constitutes acceptance of the updated terms."],
];

export default function TermsPage() {
  return (
    <LegalLayout title="Terms & Conditions" updated="June 23, 2026" badge="Legal">
      {sections.map(([title, body], i) => (
        <LegalSection key={title} index={i + 1} title={title}>
          <p>{body}</p>
        </LegalSection>
      ))}
    </LegalLayout>
  );
}
