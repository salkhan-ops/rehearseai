import type { Metadata } from "next";
import { LegalLayout, LegalSection } from "@/components/content/LegalLayout";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Refund Policy | RehearseAI",
  description: "Refund Policy for RehearseAI subscriptions processed through Paddle.",
  alternates: { canonical: "/refund-policy" },
};

export default function RefundPolicyPage() {
  return (
    <LegalLayout title="Refund Policy" updated="June 23, 2026" badge="Billing">
      <LegalSection index={1} title="Payments & Merchant of Record">
        <p>
          RehearseAI subscriptions are processed by <strong>Paddle</strong>, who acts as Merchant of Record. Paddle handles payment processing, tax calculation, invoicing, and billing records on our behalf. When you purchase a subscription, your contract for payment is with Paddle, subject to their terms and this policy.
        </p>
      </LegalSection>

      <LegalSection index={2} title="Subscription Billing">
        <p>
          Subscriptions renew automatically on the billing interval shown at checkout — monthly or annually. The renewal amount, currency, and interval are displayed before purchase. You are responsible for reviewing these details prior to subscribing.
        </p>
      </LegalSection>

      <LegalSection index={3} title="Cancellation">
        <p>
          You may cancel your subscription at any time from your account's <Link href="/subscription" className="font-semibold text-violet-600 underline decoration-violet-200 underline-offset-2 dark:text-violet-300">Subscription page</Link>. Cancellation stops future renewal charges. Your paid access continues until the end of the current billing period — you will not be billed again after cancellation.
        </p>
      </LegalSection>

      <LegalSection index={4} title="Partial Billing Periods">
        <p>
          Partial billing periods are not refunded. If you cancel partway through a paid period, you retain access until that period ends. Downgrading a plan mid-cycle follows the same rule — no credit is issued for unused time on the higher plan unless required by applicable law.
        </p>
      </LegalSection>

      <LegalSection index={5} title="Refund Eligibility">
        <p>
          We review refund requests on a case-by-case basis. Refunds may be approved if: (a) you were charged after cancellation due to a technical error; (b) you were billed for a plan you did not use due to a service outage on our end; or (c) applicable consumer law in your jurisdiction entitles you to a refund. We do not issue refunds for change of mind, unused sessions, or forgetting to cancel before renewal.
        </p>
      </LegalSection>

      <LegalSection index={6} title="Accidental or Duplicate Charges">
        <p>
          If you believe you were charged in error — including duplicate charges or charges after cancellation — contact us within 14 days of the charge with your account email and Paddle receipt. We will investigate and resolve promptly.
        </p>
      </LegalSection>

      <LegalSection index={7} title="Free Trials">
        <p>
          Where a free trial is offered, billing begins automatically at the end of the trial period unless you cancel beforehand. The trial duration and post-trial price are shown at signup. You are responsible for cancelling before the trial ends if you do not wish to be billed.
        </p>
      </LegalSection>

      <LegalSection index={8} title="How to Request a Refund">
        <p>
          Email <a href="mailto:refund@rehearseai.dev" className="font-semibold text-violet-600 underline decoration-violet-200 underline-offset-2 dark:text-violet-300">refund@rehearseai.dev</a> with:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Your account email address</li>
          <li>Your Paddle receipt or transaction ID</li>
          <li>A brief explanation of your request</li>
        </ul>
        <p className="mt-3">We respond to all refund requests within 3 business days.</p>
      </LegalSection>

      <LegalSection index={9} title="Consumer Rights">
        <p>
          Nothing in this policy limits your statutory rights under applicable consumer protection law. Depending on your country or region, you may have additional refund rights that we are required to honour. Where those rights apply, they take precedence over this policy.
        </p>
      </LegalSection>

      <LegalSection index={10} title="Policy Updates">
        <p>
          We may update this policy as the product evolves. The date at the top of this page reflects the most recent revision. Continued use of the service after changes constitutes acceptance of the updated policy.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
