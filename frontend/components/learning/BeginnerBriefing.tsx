import type { Session } from "@/lib/types";

export function BeginnerBriefing({ session }: { session: Session }) {
  const sections = [
    ["Situation Overview", `You are entering a ${session.practiceType.toLowerCase()} about ${session.topic}. The other side will test clarity, judgment, and composure.`],
    ["Core Issue", session.goal || "Stay structured while pressure changes the conversation."],
    ["Stakeholder Perspectives", "They may care about risk, evidence, tradeoffs, confidence, and whether your reasoning holds under follow-up."],
    ["Success Criteria", "Answer directly, explain why, support with one example, and respond to objections without becoming defensive."],
    ["Common Mistakes", "Overexplaining, avoiding the question, weak evidence, emotional reactions, or defending the conclusion before the reasoning."],
  ];

  return (
    <section className="rounded-[1.5rem] bg-white/[0.08] p-5 text-left ring-1 ring-white/10 backdrop-blur-2xl">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/70">Beginner briefing</div>
      <div className="mt-4 grid gap-3 md:grid-cols-5">
        {sections.map(([title, body]) => (
          <div key={title} className="rounded-2xl bg-white/[0.07] p-4 ring-1 ring-white/10">
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            <p className="mt-2 text-xs font-medium leading-5 text-white/58">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
