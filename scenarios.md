# RehearseAI vs. ChatGPT — comparison scenarios

Seven scenarios for running the same background/context through RehearseAI's `/try`
or `/practice/setup` flow and a parallel ChatGPT conversation, to observe and evaluate
how the two behave as an interviewer/counterpart under pressure.

For each: paste the **Context** into RehearseAI (via `/try`'s quick-start cards for
Job Interview, Salary Negotiation, and Presentation, or via `/practice/setup` → pick
the practice type → paste into the Context/Goal boxes for the rest). Use the
**ChatGPT kickoff prompt** to prime a parallel ChatGPT conversation into the same role,
since ChatGPT won't adopt a pressuring interviewer/counterpart persona on its own.

---

## 1. Job Interview — Software Engineer

**Resume:**
> Senior Backend Engineer with 6 years of experience, currently at a mid-size fintech. Led the migration of a monolithic payments service to event-driven microservices, cutting p99 latency by 45% and reducing on-call incidents by 60%. Owns the team's core API gateway. Mentors two junior engineers. Previously built the initial version of a real-time fraud-detection pipeline processing 2M events/day. Comfortable in Go, Python, and Kafka; weaker on frontend.

**Job description:**
> Hiring a Staff Backend Engineer to own reliability and scalability for our core transactions platform, which now processes 10x the volume it did two years ago. You'll set technical direction across three teams, run architecture reviews, and be the escalation point for major incidents. Looking for someone who has actually operated distributed systems at scale — not just designed them on a whiteboard.

**ChatGPT kickoff prompt:**
> Act as a skeptical, senior technical interviewer for a Staff Backend Engineer role. Here is my resume: [paste resume]. Here is the job description: [paste job]. Interview me one question at a time — don't ask multiple questions in one message. Push back on vague answers, ask for specific numbers and decisions, and don't move to the next question until I've actually answered. Don't coach me or give hints. Stay in character as the interviewer until I say "end interview."

---

## 2. Job Interview — Professor (tenure-track academic)

**Resume:**
> PhD in Cognitive Psychology (5th year, defending in 3 months). Two first-author papers in mid-tier journals, one under review at a top-tier journal. TA'd four courses, including redesigning the intro statistics syllabus, which raised pass rates from 71% to 86%. No R01 or major grant experience yet — one internal seed grant ($8k). Has never run an independent lab.

**Job description:**
> Tenure-track Assistant Professor position in a psychology department at a mid-ranked research university. Teaching load is 2/2. Strong emphasis on grant-getting within the first three years and building an independent research program. Department is under pressure to increase external funding after two recent budget cuts.

**ChatGPT kickoff prompt:**
> Act as a skeptical search-committee chair interviewing me for a tenure-track Assistant Professor position. Here is my CV summary: [paste resume]. Here is the position: [paste job]. Ask one question at a time about my research plan, funding strategy, and teaching philosophy. Challenge weak or vague answers — especially anything about grant funding, since that's the department's biggest concern. Don't coach me. Stay in character until I say "end interview."

---

## 3. Job Interview — Lawyer (litigation associate)

**Resume:**
> 5th-year litigation associate at a mid-size firm, currently billing 2,100 hours/year. First-chaired two bench trials (both won) and second-chaired one jury trial. Handles commercial contract disputes, mostly $500k–5M in controversy. No partner-track guarantee at current firm; moving for a clearer path to partnership and more trial time.

**Job description:**
> Litigation associate opening at a boutique firm known for taking cases to trial rather than settling early. Firm wants someone who can run depositions independently within 6 months and eventually first-chair mid-size trials. Explicitly looking for someone who won't wilt under a judge's or opposing counsel's aggressive questioning.

**ChatGPT kickoff prompt:**
> Act as a demanding hiring partner interviewing me for a litigation associate role at a trial-focused boutique firm. Here is my background: [paste resume]. Here is the role: [paste job]. Ask one question at a time, and specifically probe my trial experience and how I handle being challenged mid-argument — interrupt me with a hostile follow-up at least once. Don't coach me. Stay in character until I say "end interview."

---

## 4. Pressure Talk (Presentation / Public Speaking)

**Context:**
> I'm presenting a plan to sunset our SMB product tier — it generates $2M ARR but has been losing money for six quarters. I'm presenting to the exec team, including the VP who originally championed the SMB launch three years ago.

**Goal:**
> Stay clear and hold my position when execs attack the numbers or take it personally.

**Background doc (optional, paste as extra context):**
> Key facts: SMB tier costs $2.6M/year to run (support + infra), generates $2M ARR, churn is 4%/month. Sunsetting affects 1,400 active customers. Migration path exists to the mid-market tier for ~30% of them.

**ChatGPT kickoff prompt:**
> Act as a panel of skeptical executives listening to my presentation, including one who championed the original launch and will take this personally. Interrupt with tough questions about my assumptions and numbers, one at a time. Don't let vague justifications slide. Don't coach me. Stay in character until I say "end interview."

---

## 5. Sales Pitch

**Context:**
> I'm pitching an AI-based support-ticket automation tool to a VP of Customer Support at a mid-market SaaS company. They already use a competitor's tool and are skeptical about switching costs and ROI.

**Goal:**
> Handle the price and vendor-switching objections without becoming pushy or discounting immediately.

**Background doc:**
> Deal size: ~$60k ARR. Their current tool costs $45k/year. My pitch: 3x faster deflection rate, but migration takes ~6 weeks. Buyer's stated priority: not wanting to re-train their team again after switching tools 18 months ago.

**ChatGPT kickoff prompt:**
> Act as a skeptical VP of Customer Support evaluating my pitch. Raise real objections — price, switching cost, "we already have a vendor," "we just switched tools 18 months ago." Push back hard on vague ROI claims and don't buy easily. Don't coach me. Stay in character until I say "end interview."

---

## 6. Difficult Conversation

**Context:**
> I need to tell an 8-year employee on my team, well-liked and previously a strong performer, that their performance has declined seriously this quarter and their role is now at risk. This is the second formal conversation about it.

**Goal:**
> Be honest and specific without softening the message into confusion, and without letting the conversation get derailed by emotion.

**Background doc:**
> Specifics: missed 3 major deadlines this quarter, two client escalations traced to their work, team morale visibly affected. First conversation (informal, 6 weeks ago) didn't change behavior.

**ChatGPT kickoff prompt:**
> Act as the employee in this difficult conversation. Get defensive, push back emotionally, and deflect blame onto workload or team changes at least once. Don't make it easy for me. Don't coach me. Stay in character until I say "end interview."

---

## 7. Salary Negotiation

**Context:**
> I've received an initial offer of $95k for a Senior Marketing Manager role at a new company. My market research puts the role at $110-115k for my experience level. I want to negotiate up without risking the offer being pulled.

**Goal:**
> Hold my target number and handle pushback like "that's outside our band" without caving on the first try.

**Background doc:**
> 7 years experience, led a rebrand that grew signups 25%, currently earning $88k at current job (no competing offer in hand — negotiating on market value alone).

**ChatGPT kickoff prompt:**
> Act as a hiring manager negotiating salary with me. Push back on my ask citing "budget constraints" and "that's outside our band." Don't concede on the first try — make me justify the number twice before you move — but don't be abusive or unreasonable. Don't coach me. Stay in character until I say "end interview."

---

## What to observe/document for each pair

- **Question realism** — generic vs. grounded in the specific resume/context details
- **Pushback behavior** — does it let vague answers slide, or demand specifics?
- **Interruption** — does it actually cut in mid-answer, or wait politely?
- **Coaching leakage** — does it accidentally hand you the "good answer" instead of pressure-testing you?
- **Consistency** — does the persona hold for 8-10 turns, or drift back to "helpful assistant" mode?
- **Feedback at the end** — structured scoring (RehearseAI) vs. freeform commentary (ChatGPT)
- **Friction** — voice vs. typing, session setup time, whether you had to re-explain context
