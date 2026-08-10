# RehearseAI vs. ChatGPT — comparison scenarios

Three scenarios for running the same background through RehearseAI's `/try` or
`/practice/setup` flow and a parallel ChatGPT conversation, to compare how the two behave
as an interviewer/counterpart under pressure.

Two ways to run each:

- **Standard**: paste the **Context box** text into RehearseAI, and paste the **ChatGPT
  kickoff prompt** as-is into a new ChatGPT conversation — nothing to fill in, it's
  ready to send. You play the candidate/pitcher in both, side by side, and compare.
- **Flipped**: paste the **ChatGPT candidate kickoff prompt** into ChatGPT instead —
  it plays the candidate/pitcher, RehearseAI plays the interviewer. No human in the
  loop; useful for testing RehearseAI's interviewer quality directly.

---

## 1. Job Interview — Software Engineer

**Context box (paste into RehearseAI):**
> Resume: Senior Backend Engineer with 6 years of experience, currently at a mid-size fintech. Led the migration of a monolithic payments service to event-driven microservices, cutting p99 latency by 45% and reducing on-call incidents by 60%. Owns the team's core API gateway. Mentors two junior engineers. Previously built the initial version of a real-time fraud-detection pipeline processing 2M events/day. Comfortable in Go, Python, and Kafka; weaker on frontend.
>
> Job description: Hiring a Staff Backend Engineer to own reliability and scalability for our core transactions platform, which now processes 10x the volume it did two years ago. You'll set technical direction across three teams, run architecture reviews, and be the escalation point for major incidents. Looking for someone who has actually operated distributed systems at scale — not just designed them on a whiteboard.

**ChatGPT kickoff prompt:**
> Act as a skeptical, senior technical interviewer for a Staff Backend Engineer role. Here is the candidate's resume: Senior Backend Engineer with 6 years of experience, currently at a mid-size fintech. Led the migration of a monolithic payments service to event-driven microservices, cutting p99 latency by 45% and reducing on-call incidents by 60%. Owns the team's core API gateway. Mentors two junior engineers. Previously built the initial version of a real-time fraud-detection pipeline processing 2M events/day. Comfortable in Go, Python, and Kafka; weaker on frontend. Here is the job: Hiring a Staff Backend Engineer to own reliability and scalability for a core transactions platform now processing 10x the volume it did two years ago. Sets technical direction across three teams, runs architecture reviews, is the escalation point for major incidents. Needs someone who has actually operated distributed systems at scale. Interview me one question at a time — don't ask multiple questions in one message. Push back on vague answers, ask for specific numbers and decisions, and don't move on until I've actually answered. Don't coach me or give hints. Stay in character until I say "end interview."

**ChatGPT candidate kickoff prompt (flipped — RehearseAI interviews, ChatGPT answers):**
> Act as the candidate being interviewed for a Staff Backend Engineer role. Your resume: Senior Backend Engineer with 6 years of experience, currently at a mid-size fintech. Led the migration of a monolithic payments service to event-driven microservices, cutting p99 latency by 45% and reducing on-call incidents by 60%. Own the team's core API gateway. Mentor two junior engineers. Previously built the initial version of a real-time fraud-detection pipeline processing 2M events/day. Comfortable in Go, Python, and Kafka; weaker on frontend. The job: Staff Backend Engineer owning reliability and scalability for a core transactions platform now processing 10x the volume it did two years ago, setting technical direction across three teams. Answer the interviewer's questions one at a time, staying strictly consistent with the resume above — use its specific numbers rather than inventing new ones. Don't ask questions back unless clarifying. Stay in character until told the interview has ended.

---

## 2. Job Interview — Lawyer (litigation associate)

**Context box (paste into RehearseAI):**
> Resume: 5th-year litigation associate at a mid-size firm, currently billing 2,100 hours/year. First-chaired two bench trials (both won) and second-chaired one jury trial. Handles commercial contract disputes, mostly $500k–5M in controversy. No partner-track guarantee at current firm; moving for a clearer path to partnership and more trial time.
>
> Job description: Litigation associate opening at a boutique firm known for taking cases to trial rather than settling early. Wants someone who can run depositions independently within 6 months and eventually first-chair mid-size trials. Explicitly looking for someone who won't wilt under a judge's or opposing counsel's aggressive questioning.

**ChatGPT kickoff prompt:**
> Act as a demanding hiring partner interviewing a candidate for a litigation associate role at a trial-focused boutique firm. Candidate's background: 5th-year litigation associate at a mid-size firm, billing 2,100 hours/year. First-chaired two bench trials (both won), second-chaired one jury trial. Handles commercial contract disputes, mostly $500k–5M in controversy. Moving firms for a clearer path to partnership and more trial time. The role: boutique firm that takes cases to trial rather than settling early, wants someone who can run depositions independently within 6 months and eventually first-chair mid-size trials, and won't wilt under aggressive questioning. Ask one question at a time, specifically probing trial experience and how the candidate handles being challenged mid-argument — interrupt with a hostile follow-up at least once. Don't coach. Stay in character until I say "end interview."

**ChatGPT candidate kickoff prompt (flipped — RehearseAI interviews, ChatGPT answers):**
> Act as the candidate being interviewed for a litigation associate role at a trial-focused boutique firm. Your background: 5th-year litigation associate at a mid-size firm, billing 2,100 hours/year. First-chaired two bench trials (both won), second-chaired one jury trial. Handles commercial contract disputes, mostly $500k–5M in controversy. Moving for a clearer path to partnership and more trial time. Answer one question at a time, staying specific about your actual trial experience above. If the interviewer interrupts or challenges you mid-answer, stay composed and finish your point rather than folding or over-apologizing. Stay in character until told the interview has ended.

---

## 3. Sales Pitch

**Context box (paste into RehearseAI):**
> Context: Pitching an AI-based support-ticket automation tool to a VP of Customer Support at a mid-market SaaS company. They already use a competitor's tool and are skeptical about switching costs and ROI. Deal size: ~$60k ARR. Their current tool costs $45k/year. Pitch: 3x faster deflection rate, but migration takes ~6 weeks. Buyer's stated priority: not wanting to re-train their team again after switching tools 18 months ago.
>
> Goal: Handle the price and vendor-switching objections without becoming pushy or discounting immediately.

**ChatGPT kickoff prompt:**
> Act as a skeptical VP of Customer Support evaluating a sales pitch for an AI-based support-ticket automation tool. Deal size is ~$60k ARR; your current tool costs $45k/year; their pitch is 3x faster deflection rate but migration takes ~6 weeks; your stated priority is not wanting to re-train your team again after switching tools 18 months ago. Raise real objections — price, switching cost, "we already have a vendor," "we just switched tools 18 months ago." Push back hard on vague ROI claims and don't buy easily. Don't coach the pitcher. Stay in character until I say "end interview."

**ChatGPT salesperson kickoff prompt (flipped — RehearseAI plays the skeptical VP, ChatGPT pitches):**
> Act as the salesperson pitching an AI-based support-ticket automation tool to a VP of Customer Support at a mid-market SaaS company who already uses a competitor's tool. Deal size ~$60k ARR, their current tool costs $45k/year, your pitch is 3x faster deflection rate but migration takes ~6 weeks, and their stated priority is not wanting to re-train their team again after switching tools 18 months ago. Make the pitch and handle objections about price and switching costs using these specifics, without becoming pushy or discounting immediately. Stay in character until told the session has ended.

---

## What to observe/document for each pair

Applies in both directions — standard (you vs. each app, side by side) and flipped
(RehearseAI vs. ChatGPT, no human in the loop):

- **Question realism** — generic vs. grounded in the specific resume/context details
- **Pushback behavior** — does it let vague answers slide, or demand specifics?
- **Interruption** — does it actually cut in mid-answer, or wait politely?
- **Coaching leakage** — does it accidentally hand the "good answer" instead of pressure-testing?
- **Consistency** — does the persona hold for 8-10 turns, or drift back to "helpful assistant" mode?
- **Feedback at the end** — structured scoring (RehearseAI) vs. freeform commentary (ChatGPT)
- **Friction** — voice vs. typing, session setup time, whether context had to be re-explained

In the flipped setup specifically, also watch for:

- **Turn-taking artifacts** — cut-offs or overlaps caused by mismatched voice-activity
  detection between the two apps, not by either persona's actual behavior
- **Transcription drift** — a garbled STT capture of ChatGPT's spoken answer feeding a
  worse-than-real follow-up question from RehearseAI
