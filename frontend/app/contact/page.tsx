"use client";

import { BriefcaseBusiness, CreditCard, Mail, RefreshCw, ShieldCheck, type LucideIcon } from "lucide-react";
import { Nav } from "@/components/Nav";
import { ContactForm } from "@/components/content/ContactForm";
import { Footer } from "@/components/content/Footer";

const contactChannels: Array<[LucideIcon, string, string, string]> = [
  [Mail, "General Support", "support@rehearseai.dev", "Questions, feedback, and account help"],
  [CreditCard, "Sales", "sales@rehearseai.dev", "Plans, pricing, and team enquiries"],
  [RefreshCw, "Refunds & Billing", "refund@rehearseai.dev", "Billing issues and refund requests"],
  [ShieldCheck, "Privacy", "support@rehearseai.dev", "Data requests and privacy questions"],
  [BriefcaseBusiness, "Partnerships", "sales@rehearseai.dev", "Business, press, and integrations"],
];

const faqs = [
  ["Is this therapy?", "No. RehearseAI is communication practice and cognitive performance training, not therapy or medical care."],
  ["Do you guarantee outcomes?", "No. The product helps you rehearse, get feedback, and prepare better — it does not promise job, legal, financial, or personal outcomes."],
  ["Can teams use it?", "Yes. Team and coaching workflows are planned. Contact sales@rehearseai.dev to register early interest."],
  ["How fast do you respond?", "We aim to respond within 1–2 business days. Billing and account access issues are prioritised."],
];

export default function ContactPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-slate-950 dark:bg-[#07111f] dark:text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-0 h-[40rem] w-[40rem] rounded-full bg-violet-500/10 blur-3xl dark:bg-violet-500/16" />
        <div className="absolute right-0 top-[20rem] h-[32rem] w-[32rem] rounded-full bg-cyan-400/10 blur-3xl dark:bg-cyan-400/14" />
      </div>
      <Nav />

      {/* Hero */}
      <section className="relative z-10 px-4 pb-16 pt-20">
        <div className="mx-auto max-w-6xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-5 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-violet-700 ring-1 ring-violet-100 dark:bg-violet-400/10 dark:text-violet-300 dark:ring-violet-400/20">
            Contact
          </span>
          <h1 className="mt-5 max-w-3xl text-6xl font-semibold leading-[0.9] tracking-[-0.065em] text-slate-950 dark:text-white md:text-8xl">
            Talk to the team behind the room.
          </h1>
          <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-slate-600 dark:text-white/58">
            Send support questions, refund requests, partnership ideas, or product feedback. We read everything.
          </p>
        </div>
      </section>

      {/* Channels + Form */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-16">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-start">

          {/* Left — channels */}
          <div className="space-y-3">
            {contactChannels.map(([Icon, label, email, description]) => (
              <a
                key={label}
                href={`mailto:${email}`}
                className="group flex items-center gap-4 rounded-2xl bg-white/80 p-5 ring-1 ring-slate-200/80 backdrop-blur-xl transition hover:ring-violet-300 dark:bg-white/[0.055] dark:ring-white/10 dark:hover:ring-violet-400/40"
              >
                <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 shadow-[0_8px_24px_rgba(109,40,217,0.28)]">
                  <Icon size={20} className="text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-white/40">{label}</p>
                  <p className="font-semibold text-slate-950 transition group-hover:text-violet-700 dark:text-white dark:group-hover:text-violet-300">{email}</p>
                  <p className="mt-0.5 text-sm font-medium text-slate-500 dark:text-white/40">{description}</p>
                </div>
              </a>
            ))}

            <div className="rounded-2xl bg-gradient-to-br from-violet-500/10 to-cyan-500/10 p-5 ring-1 ring-violet-200/60 dark:ring-violet-400/20">
              <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">Response time</p>
              <p className="mt-1 text-sm font-medium text-slate-600 dark:text-white/58">
                We respond within 1–2 business days. Billing and account access issues are prioritised.
              </p>
            </div>
          </div>

          {/* Right — form */}
          <div className="rounded-[2rem] bg-white/80 p-6 ring-1 ring-slate-200/80 backdrop-blur-2xl dark:bg-white/[0.055] dark:ring-white/10 md:p-8">
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">Send a message</h2>
            <p className="mt-2 text-sm font-medium text-slate-500 dark:text-white/40">We'll get back to you within 1–2 business days.</p>
            <div className="mt-6">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-20">
        <div className="overflow-hidden rounded-[2rem] bg-white/80 ring-1 ring-slate-200/80 backdrop-blur-2xl dark:bg-white/[0.055] dark:ring-white/10">
          <div className="border-b border-slate-100/80 px-6 py-5 dark:border-white/[0.07]">
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">Before you write</h2>
          </div>
          <div className="divide-y divide-slate-100/80 dark:divide-white/[0.07]">
            {faqs.map(([question, answer]) => (
              <div key={question} className="px-6 py-5">
                <p className="font-semibold text-slate-950 dark:text-white">{question}</p>
                <p className="mt-1.5 text-sm font-medium leading-6 text-slate-600 dark:text-white/55">{answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
