import type { Metadata } from "next";
import { LegalLayout } from "@/components/content/LegalLayout";

export const metadata: Metadata = {
  title: "Terms & Conditions | RehearseAI",
  description: "Terms of Service for RehearseAI, including AI simulation, billing, acceptable use, and service limitations.",
  alternates: { canonical: "/terms" },
};

const sections = [
  ["Acceptance of Terms", "By using RehearseAI, you agree to these Terms of Service. If you do not agree, do not use the service. These terms apply to the website, application, voice features, reports, analytics, and related services."],
  ["Eligibility", "You must be at least 16 years old to create an account or use RehearseAI. If you are under 18, you should use RehearseAI only with permission from a parent or guardian. Children under 13 are not allowed to create an account or use the service."],
  ["Nature of the Service", "RehearseAI provides AI-generated rehearsal simulations and feedback for communication, reasoning, and cognitive performance practice. The service is educational and coaching-oriented. It is not therapy, legal advice, medical advice, financial advice, employment advice, or a substitute for professional judgment."],
  ["Minor Safety", "RehearseAI is not child-focused and does not create child-directed practice categories. The service must not be marketed or used as therapy, emotional support, medical care, or crisis support for minors."],
  ["AI-Generated Content Disclaimer", "AI roleplay, feedback, reports, scores, reasoning maps, and recommendations may be inaccurate, incomplete, or unsuitable for your context. You are responsible for evaluating outputs before relying on them. RehearseAI does not guarantee that AI-generated content reflects what a real interviewer, employer, customer, panelist, investor, examiner, or conversation partner will do."],
  ["No Guarantee of Outcomes", "RehearseAI does not guarantee interview success, job offers, promotion, salary increases, sales outcomes, investor funding, academic success, relationship outcomes, legal outcomes, or any other real-world result. The service is designed to help you practice, rehearse, improve confidence, and prepare better."],
  ["User Accounts", "You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. You agree to provide accurate information and to keep your account secure."],
  ["Acceptable Use", "You may use RehearseAI for lawful personal or business communication practice. You must not use the service to harass others, generate abusive content, impersonate people without permission, violate privacy, attempt security attacks, or train for illegal, discriminatory, or harmful conduct."],
  ["Prohibited Conduct", "You must not reverse engineer the service, scrape or overload systems, bypass entitlements, share paid access without authorization, upload malicious content, or use RehearseAI to create content that is unlawful, abusive, discriminatory, deceptive, or harmful."],
  ["Subscriptions and Billing", "Paid subscriptions may be processed through Paddle. Prices, taxes, billing intervals, plan limits, and entitlements are shown at checkout or inside the product. Paddle may act as merchant of record where applicable. You are responsible for reviewing checkout details before purchase."],
  ["Paddle as Merchant of Record", "Paddle may act as Merchant of Record for paid subscriptions, meaning Paddle handles payment processing, taxes, invoices, and certain billing communications. RehearseAI controls product access and entitlements."],
  ["Cancellation Policy", "You may cancel from the subscription page or Paddle-supported billing flow when available. Cancellation generally stops future renewals while preserving access through the current paid billing period."],
  ["Refunds", "Refund handling may depend on your location, Paddle policies, and RehearseAI's published refund terms at the time of purchase. A full refund policy will be maintained as the product exits MVP."],
  ["Intellectual Property", "RehearseAI, its interface, product systems, brand, prompts, analytics formats, and software are owned by RehearseAI or its licensors. You retain rights to content you submit, subject to the license needed for RehearseAI to process, analyze, store, and display it for the service."],
  ["Privacy", "Use of the service is also governed by our Privacy Policy. It explains how we collect, process, store, and delete data, including voice transcripts, rehearsal messages, analytics, and billing-related information."],
  ["Service Availability", "The service may be unavailable, interrupted, delayed, or modified. AI providers, speech services, payment providers, hosting services, and other third parties may affect availability."],
  ["Termination", "We may suspend or terminate access if you violate these terms, create risk, misuse the service, fail to pay, or if required by law. You may stop using RehearseAI at any time."],
  ["Limitation of Liability", "To the fullest extent allowed by law, RehearseAI is not liable for indirect, incidental, consequential, special, exemplary, or lost-profit damages arising from use of the service or reliance on AI-generated outputs."],
  ["Governing Law", "Governing law and venue will be specified before production launch. This placeholder should be reviewed by qualified counsel."],
  ["Contact Information", "For legal questions, contact legal@rehearseai.app."],
  ["Modifications", "We may update these terms as the product evolves. Material changes will be communicated through reasonable channels. Continued use after changes means you accept the updated terms."],
];

export default function TermsPage() {
  return (
    <LegalLayout title="Terms & Conditions" updated="May 29, 2026">
      {sections.map(([title, body]) => (
        <section key={title}>
          <h2>{title}</h2>
          <p>{body}</p>
        </section>
      ))}
    </LegalLayout>
  );
}
