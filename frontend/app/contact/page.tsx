import type { Metadata } from "next";
import { Mail, MessageCircle, ShieldCheck, type LucideIcon } from "lucide-react";
import { Nav } from "@/components/Nav";
import { ContactForm } from "@/components/content/ContactForm";
import { Footer } from "@/components/content/Footer";
import { HeroImage } from "@/components/content/HeroImage";

export const metadata: Metadata = {
  title: "Contact | RehearseAI",
  description: "Contact RehearseAI for support, sales, partnerships, and product feedback.",
  alternates: { canonical: "/contact" },
};

const contactChannels: Array<[LucideIcon, string, string]> = [
  [Mail, "Support", "support@rehearseai.app"],
  [MessageCircle, "Sales", "sales@rehearseai.app"],
  [ShieldCheck, "Privacy", "privacy@rehearseai.app"],
];

export default function ContactPage() {
  return (
    <main className="cog-bg min-h-screen text-primary-token">
      <Nav />
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent-primary)]">Contact</p>
          <h1 className="mt-4 text-6xl font-semibold leading-[0.9] tracking-[-0.065em] md:text-8xl">Talk to the people building the room.</h1>
          <p className="mt-6 max-w-xl text-lg font-medium leading-8 text-secondary-token">
            RehearseAI is built for real pressure, real conversations, and real cognitive growth. Send support questions, partnership ideas, or product feedback.
          </p>
          <div className="mt-8 grid gap-3">
            {contactChannels.map(([Icon, label, value]) => (
              <div key={label} className="flex items-center gap-4 rounded-2xl surface-low p-4">
                <Icon className="text-[var(--accent-primary)]" size={22} />
                <div>
                  <p className="text-sm font-semibold text-tertiary-token">{label}</p>
                  <p className="font-semibold text-secondary-token">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-5">
          <HeroImage seed="contact-cognition" className="min-h-[260px]" />
          <ContactForm />
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="rounded-[2rem] surface-low p-6 md:p-8">
          <h2 className="text-3xl font-semibold tracking-[-0.04em]">Before you ask</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              ["Is this therapy?", "No. RehearseAI is communication practice and cognitive performance training, not therapy or medical care."],
              ["Do you guarantee outcomes?", "No. The product helps you rehearse, get feedback, and prepare better without promising job, legal, financial, or personal outcomes."],
              ["Can teams use it?", "Yes. Team and coaching workflows are planned, and we are collecting early design partner feedback."],
            ].map(([question, answer]) => (
              <div key={question} className="rounded-[1.5rem] surface-medium p-5">
                <h3 className="font-semibold text-primary-token">{question}</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-secondary-token">{answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
