import type { Metadata } from "next";
import { LegalLayout } from "@/components/content/LegalLayout";

export const metadata: Metadata = {
  title: "Refund Policy | RehearseAI",
  description: "Refund Policy for RehearseAI subscriptions processed through Paddle.",
};

const sections = [
  ["Subscription Billing", "RehearseAI subscriptions renew on the billing interval shown at checkout. Paddle may act as Merchant of Record and handles payment processing, tax calculation, invoices, and billing records."],
  ["Cancellation Timing", "You may cancel a paid subscription before the next renewal. Unless stated otherwise, cancellation prevents future renewal and access remains available until the end of the current billing period."],
  ["Partial Periods", "Partial billing periods are generally non-refundable. If you cancel after renewal, your paid access normally continues through the paid period."],
  ["Accidental Charges", "If you believe you were charged accidentally, contact billing support promptly with your account email, Paddle receipt, and a short explanation."],
  ["Trials", "If a trial is offered, the trial terms shown at signup or checkout control when billing begins. You are responsible for cancelling before the trial ends if you do not want to continue."],
  ["Refund Requests", "Refunds are reviewed case by case and may depend on Paddle policies, applicable law, account activity, and timing. Contact billing@rehearseai.app for review."],
];

export default function RefundPolicyPage() {
  return (
    <LegalLayout title="Refund Policy" updated="May 29, 2026">
      {sections.map(([title, body]) => <section key={title}><h2>{title}</h2><p>{body}</p></section>)}
    </LegalLayout>
  );
}
