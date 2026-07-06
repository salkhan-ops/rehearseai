import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, CheckCircle2, Zap } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/content/Footer";

type LandingConfig = {
  slug: string;
  title: string;
  headline: string;
  subheadline: string;
  practiceType: string;
  metaTitle: string;
  metaDescription: string;
  benefits: string[];
  faqs: [string, string][];
  cta: string;
  featureStrip?: string[];
  differentiation?: { title: string; points: string[] };
  testimonial?: { quote: string; role: string; detail: string };
};

const PAGES: Record<string, LandingConfig> = {
  "interview-practice": {
    slug: "interview-practice",
    title: "AI Interview Practice",
    headline: "Practice job interviews with AI that hits as hard as a real hiring manager.",
    subheadline: "RehearseAI puts you inside a live interview simulation. Adaptive follow-ups, pressure, and scoring across 15 dimensions — so you walk in ready.",
    practiceType: "Job Interview",
    metaTitle: "AI Job Interview Practice — RehearseAI",
    metaDescription: "Practice job interviews with an AI hiring manager. Get scored on confidence, clarity, composure, and 12 more dimensions. Free to start.",
    benefits: [
      "Adaptive AI interviewer that reacts to weak answers",
      "STAR method, competency, and technical framing practice",
      "Scored on 15 metrics: confidence, clarity, composure, and more",
      "Replay and review every answer in your session report",
      "Progress tracked across every session",
    ],
    faqs: [
      ["What types of interviews does it simulate?", "Behavioural, competency, technical, and case interviews. The AI adapts its line of questioning based on your answers."],
      ["How is it different from mock interviews with humans?", "You can practice at 2am, as many times as you need, with zero social anxiety. The AI gives objective scoring, not politeness."],
      ["Will it help with senior or executive roles?", "Yes — difficulty scales from Graduate to C-suite. Brutal mode applies board-level pressure."],
      ["Is it free?", "Yes to start. Free plan gives you sessions every month. Pro and Coach plans unlock advanced modes, full history, and course programs."],
    ],
    cta: "Practice your interview now",
    featureStrip: ["Realistic AI interviewer", "Follow-up questions", "Reasoning feedback", "Confidence score"],
    differentiation: {
      title: "Why not just use ChatGPT?",
      points: [
        "ChatGPT answers your questions. RehearseAI interviews you — it interrupts, pushes back, and reacts to weak answers like a real hiring manager would.",
        "You get a scored report across 15 dimensions (confidence, clarity, composure, and more) — not a wall of generic text.",
        "No scheduling, no awkwardness with a friend or coach. Practice at 2am, as many times as you need.",
      ],
    },
    testimonial: {
      quote: "It's the only thing I've found that actually puts you under pressure. Everything else is just prompts.",
      role: "Early beta user",
      detail: "Job interview prep",
    },
  },
  "salary-negotiation-practice": {
    slug: "salary-negotiation-practice",
    title: "AI Salary Negotiation Practice",
    headline: "Practice salary negotiation before you walk into the offer conversation.",
    subheadline: "Most people accept the first number. RehearseAI trains you to anchor, counter, and hold your position under real pushback — before the stakes are real.",
    practiceType: "Salary Negotiation",
    metaTitle: "AI Salary Negotiation Practice — RehearseAI",
    metaDescription: "Practice salary negotiation with an AI that pushes back. Learn to anchor, counter lowball offers, and close at the number you want.",
    benefits: [
      "Simulates a tough recruiter or hiring manager pushing back on your number",
      "Trains anchoring, BATNA framing, and concession strategy",
      "Covers salary, equity, bonus, and contract negotiations",
      "Scored on persuasiveness, directness, and composure under pressure",
      "Practice until you stop caving — not just until it feels comfortable",
    ],
    faqs: [
      ["Can I practise a specific situation?", "Yes — describe your exact scenario before the session and the AI adapts its persona to match."],
      ["Does it work for promotions as well as job offers?", "Yes. Internal negotiation, promotion conversations, and external offers are all supported."],
      ["What if I have never negotiated before?", "Start on Beginner mode. You'll get coaching tips during the session and a full coaching breakdown afterwards."],
      ["How many sessions do I need?", "Most users feel ready after 3-5 sessions. Our 7-day Salary Negotiation Sprint is designed to get you there fast."],
    ],
    cta: "Start negotiation practice",
  },
  "public-speaking-practice": {
    slug: "public-speaking-practice",
    title: "AI Public Speaking Practice",
    headline: "Practice your presentation with an audience that asks the hard questions.",
    subheadline: "RehearseAI puts you in front of a simulated crowd that interrupts, challenges your logic, and tests your composure. Far more useful than a mirror.",
    practiceType: "Presentation / Public Speaking",
    metaTitle: "AI Public Speaking Practice — RehearseAI",
    metaDescription: "Practice public speaking and presentations with an AI audience. Get scored on clarity, structure, composure, and Q&A handling.",
    benefits: [
      "AI audience that interrupts and asks hostile follow-up questions",
      "Practice openings, closings, Q&A handling, and under time pressure",
      "Scored on structure, clarity, composure, and handling interruptions",
      "Works for keynotes, board presentations, pitches, and panel talks",
      "Track your improvement across every session",
    ],
    faqs: [
      ["Can I practise a specific presentation?", "Yes — tell the AI your topic, audience type, and context. It will simulate relevant pushback."],
      ["I'm terrified of public speaking. Will this help?", "Systematic exposure in a low-stakes environment is one of the most evidence-based approaches to reducing public speaking anxiety."],
      ["Does it work for small group presentations?", "Yes — set the difficulty to Beginner or Intermediate for smaller, less hostile audience simulations."],
      ["Can I use it for media or press training?", "Yes. Set the practice type to Presentation and describe a press or media context."],
    ],
    cta: "Start speaking practice",
  },
  "difficult-conversations-practice": {
    slug: "difficult-conversations-practice",
    title: "AI Difficult Conversations Practice",
    headline: "Practice the conversation you've been avoiding.",
    subheadline: "Feedback, conflict, boundary-setting, firing, and family confrontations. RehearseAI creates a safe environment to build the muscle before the real thing.",
    practiceType: "Difficult Conversation",
    metaTitle: "AI Difficult Conversations Practice — RehearseAI",
    metaDescription: "Practice difficult conversations — feedback, conflict, boundaries — with an AI that reacts emotionally. Build the confidence to say the hard thing.",
    benefits: [
      "AI counterpart that reacts defensively, emotionally, and unpredictably",
      "Covers performance feedback, conflict, firing, and personal confrontations",
      "Scored on empathy, clarity, directness, and maintaining composure",
      "Safe space to say the hard thing without consequences",
      "Full coaching report after every session",
    ],
    faqs: [
      ["What kind of conversations does it simulate?", "Performance feedback, conflict resolution, letting someone go, setting boundaries, and personal confrontations including family dynamics."],
      ["The other person in my situation is really emotional. Can it simulate that?", "Yes — describe the person's personality and likely reactions before the session."],
      ["Is this therapy?", "No. RehearseAI is practice and feedback software. It is not therapy, counselling, or a substitute for professional mental health support."],
      ["What if I freeze mid-conversation?", "That's what practice is for. In Beginner mode, the AI slows down and coaches you. In harder modes, it applies real pressure."],
    ],
    cta: "Practice a difficult conversation",
  },
  "sales-pitch-practice": {
    slug: "sales-pitch-practice",
    title: "AI Sales Pitch Practice",
    headline: "Practice your pitch against a buyer who has heard every excuse.",
    subheadline: "RehearseAI simulates the toughest objections — budget, timing, competition, trust — so you stop losing deals you should be winning.",
    practiceType: "Sales Pitch",
    metaTitle: "AI Sales Pitch Practice — RehearseAI",
    metaDescription: "Practice your sales pitch with an AI buyer who pushes back hard. Handle objections, build trust, and close under pressure.",
    benefits: [
      "Simulates a skeptical buyer who raises budget, timing, and trust objections",
      "Practice objection handling, discovery, demo delivery, and closing",
      "Covers B2B enterprise, SMB, and consumer sales scenarios",
      "Scored on persuasiveness, confidence, and recovery after pushback",
      "Build the muscle to close without discounting",
    ],
    faqs: [
      ["Can I practise my specific product or service?", "Yes — describe your product, deal size, and typical buyer persona before the session."],
      ["Does it cover the full sales cycle?", "Yes — from cold outreach and discovery through to negotiation and close."],
      ["I sell into enterprise. Will it simulate multi-stakeholder deals?", "Yes. Set difficulty to Advanced or Brutal for multi-decision-maker, procurement-led scenarios."],
      ["How quickly will I improve?", "Most users notice a shift in confidence after 3 sessions. Our 7-day Sales Pitch Sprint is designed for fast transformation."],
    ],
    cta: "Practice your sales pitch",
  },
};

export async function generateStaticParams() {
  return Object.keys(PAGES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = PAGES[slug];
  if (!page) return {};
  return {
    title: page.metaTitle,
    description: page.metaDescription,
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      type: "website",
    },
    alternates: {
      canonical: `/for/${slug}`,
    },
  };
}

export default async function LandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = PAGES[slug];
  if (!page) notFound();

  return (
    <>
      <div className="min-h-screen bg-[#0a0012] text-white">
        <Nav />

        {/* Hero */}
        <section className="mx-auto max-w-4xl px-6 pb-16 pt-24 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-violet-500/15 px-4 py-1.5 ring-1 ring-violet-500/25">
            <Zap size={13} className="text-violet-300" />
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-violet-300">{page.practiceType}</span>
          </div>
          <h1 className="text-4xl font-semibold leading-[1.08] tracking-[-0.06em] sm:text-6xl">{page.headline}</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-medium leading-8 text-white/60">{page.subheadline}</p>
          {page.featureStrip && (
            <div className="mx-auto mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-x-2 gap-y-2 text-sm font-semibold text-white/50">
              {page.featureStrip.map((f, i) => (
                <span key={f} className="flex items-center gap-2">
                  {i > 0 && <span className="text-white/20">·</span>}
                  {f}
                </span>
              ))}
            </div>
          )}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href={`/practice/setup?type=${encodeURIComponent(page.practiceType)}`}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#6200a8] px-7 py-4 text-base font-bold text-white shadow-[0_18px_44px_rgba(98,0,168,0.30)] transition hover:-translate-y-0.5 hover:bg-[#50008b]">
              {page.cta} <ArrowRight size={16} />
            </Link>
            <Link href="/pricing"
              className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-7 py-4 text-base font-bold text-white ring-1 ring-white/15 transition hover:bg-white/15">
              See plans
            </Link>
          </div>
        </section>

        {/* Benefits */}
        <section className="mx-auto max-w-2xl px-6 pb-20">
          <div className="rounded-2xl bg-white/[0.04] p-7 ring-1 ring-white/10">
            <h2 className="mb-5 text-xl font-semibold tracking-[-0.03em]">What you get</h2>
            <ul className="space-y-3.5">
              {page.benefits.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-400" />
                  <span className="text-base font-medium text-white/80">{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Differentiation */}
        {page.differentiation && (
          <section className="mx-auto max-w-2xl px-6 pb-20">
            <h2 className="mb-5 text-xl font-semibold tracking-[-0.03em]">{page.differentiation.title}</h2>
            <ul className="space-y-3.5">
              {page.differentiation.points.map((p) => (
                <li key={p} className="flex items-start gap-3 rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/10">
                  <Zap size={16} className="mt-0.5 shrink-0 text-violet-300" />
                  <span className="text-sm font-medium leading-6 text-white/70">{p}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Testimonial */}
        {page.testimonial && (
          <section className="mx-auto max-w-2xl px-6 pb-20">
            <div className="rounded-2xl bg-white/[0.04] p-7 ring-1 ring-white/10">
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                ))}
              </div>
              <p className="text-base font-medium leading-7 text-white/80">&ldquo;{page.testimonial.quote}&rdquo;</p>
              <div className="mt-5 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-400 to-cyan-400" />
                <div>
                  <div className="text-sm font-semibold text-white">{page.testimonial.role}</div>
                  <div className="text-xs font-medium text-white/40">{page.testimonial.detail}</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* FAQ */}
        <section className="mx-auto max-w-2xl px-6 pb-24">
          <h2 className="mb-6 text-2xl font-semibold tracking-[-0.04em]">Common questions</h2>
          <div className="space-y-4">
            {page.faqs.map(([q, a]) => (
              <div key={q} className="rounded-2xl bg-white/[0.04] p-6 ring-1 ring-white/10">
                <h3 className="font-semibold text-white">{q}</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-white/60">{a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-white/8 py-20 text-center">
          <h2 className="text-3xl font-semibold tracking-[-0.04em]">Ready to prepare properly?</h2>
          <p className="mx-auto mt-4 max-w-md text-base font-medium text-white/60">Free to start. No credit card. Cancel any time.</p>
          <Link href={`/practice/setup?type=${encodeURIComponent(page.practiceType)}`}
            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-[#6200a8] px-8 py-4 text-base font-bold text-white shadow-[0_18px_44px_rgba(98,0,168,0.30)] transition hover:-translate-y-0.5 hover:bg-[#50008b]">
            {page.cta} <ArrowRight size={16} />
          </Link>
        </section>

        <Footer />
      </div>
    </>
  );
}
