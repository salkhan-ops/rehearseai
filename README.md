# RehearseAI

Practice the moment before it matters.

RehearseAI is a full-stack cognitive performance training platform: adaptive pressure simulation, communication intelligence, reasoning analytics, structured feedback reports, subscription billing, course programs, and an admin operations console.

## Stack

- **Frontend:** Next.js 15 App Router, TypeScript, Tailwind CSS, Framer Motion, Firebase JS SDK
- **Backend:** FastAPI (Python), Firebase Admin SDK
- **Database:** Google Firestore (native mode)
- **AI:** Google Gemini API (flash-lite for roleplay, flash for reports), with mock fallback
- **Voice STT:** Deepgram, proxied through FastAPI WebSocket
- **Voice TTS:** Cartesia Sonic, proxied through FastAPI
- **Payments:** Paddle Billing v2 (sandbox configured, production-switchable)
- **Hosting target:** Next.js frontend (local / private), FastAPI on Google Cloud Run

## Architecture and standards

For a technical overview see [`docs/architecture.md`](docs/architecture.md). It covers the end-to-end architecture, runtime flows, Firestore data model, security/privacy controls, AI governance, billing pipeline, deployment topology, and standards alignment with ISO/IEC, OWASP, GDPR-style privacy principles, WCAG, and NIST AI RMF.

## Repository

- GitHub: `https://github.com/salkhan-ops/rehearseai`
- Frontend dev: `http://localhost:3000`
- Backend API dev: `http://localhost:8000`

## Project structure

```text
frontend/          Next.js app — UI, auth, sessions, courses, billing, admin, SEO pages
backend/           FastAPI API — AI, voice, billing, courses, reports, safety, admin
docs/              Architecture, Firestore design, security, and compliance docs
firestore.rules    Client-side Firestore security rules
firestore.indexes.json
docker-compose.yml
.env.example
```

## Local setup

```bash
cp .env.example .env
```

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`. Backend at `http://localhost:8000`.

## Docker local development

```bash
docker compose up --build
```

## What's built

### Core practice loop

- Landing page, practice type selection, setup form
- Session creation through FastAPI
- Text and live voice roleplay with adaptive AI persona
- Browser speech recognition and AI read-aloud (Cartesia or browser `speechSynthesis`)
- Scenario-specific animated 3D AI personas
- Session ending, structured report generation, 15-metric analytics
- Dashboard with session listing, daily challenge, and practice routines

### Voice and conversation modes

- Deepgram live speech-to-text through FastAPI WebSocket proxy (browser fallback)
- Cartesia text-to-speech through FastAPI (browser fallback)
- Natural conversation mode — hands-free automatic turn-taking via client-side state machine
- Camera-assisted timing via MediaPipe face landmarker (in-browser, no video leaves the device)
- Local ML pause-intent classifier (rule-based, ONNX/TFLite upgrade path)
- Voice calibration page at `/voice-calibration`
- Immersive fullscreen session mode

### Adaptive pressure engine

- Response breakdown detector (filler words, confusion, avoidance, evidence markers)
- Prosody extractor (RMS energy and pitch via librosa)
- Conversation stance service (supportive → hostile continuum)
- Pressure escalation service with `AiAction` flags
- Cross-examination engine with persona-specific attack vectors

### Courses and intake

- Custom course builder (5-step wizard: Goal / Situation / Arenas + Weak Spots / Commitment / Self-Assessment)
- Pre-course intake wizard (`CourseIntakeWizard`) — 3-step animated form per practice type
- Intake answers (`IntakeAnswers`) stored on enrollment payload and feed the session AI system prompt
- Auto-suggested difficulty from confidence + frequency + pressure self-ratings
- Course detail page with sessions calendar, skill tree, progress, and streak stats
- Course completion screen — banner with share button (`navigator.share` or clipboard fallback)
- Course templates (admin-managed), enrollment via `CourseEnrollmentModal`

### Progress and longitudinal tracking

- `/progress` — cross-session sparkline charts for 5 key metrics, strengths/gaps breakdown, session timeline, trend badges
- Session history at `/history` with type and difficulty filters
- 15-metric `PerformanceAnalytics` stored per session and visualised on reports and the progress page

### Dashboard intelligence

- Pre-event countdown card — reads `intakeAnswers.eventDate` from active courses; urgency-coloured countdown (red ≤ 3 days, amber ≤ 7, violet)
- Coaching insights panel showing reasoning support usage
- Daily practice schedule management and daily cognitive challenge

### Billing — Paddle Billing v2

- `openCheckout()` passes Firebase UID as Paddle `customData`
- Backend webhook (`POST /api/payments/paddle/webhook`) handles:
  - `subscription.created/activated/updated` → assigns plan via `admin_assign_plan()`
  - `subscription.canceled` → downgrades to free, logs churn event
  - `transaction.completed` → activates course package on `userEntitlements/{uid}`
- Frontend auto-refreshes on `paddle:payment-complete` DOM event
- `BillingSection` on settings page: plan badge, session usage bar, active packages, two-phase cancel flow
- Cancel confirmation shows feature-loss list; "Keep my plan" is primary CTA

### Admin console

- Plans, entitlements, user management, assign-plan, overrides
- Products, course packages, course templates, practice templates
- Billing, telemetry labels, local signals, safety events, logs
- **Revenue Register** (`/admin/revenue`) — real Paddle transaction log; KPI cards; filter by product type
- **Churn Register** (`/admin/churn`) — all cancellations with Paddle reason + comment; breakdowns by plan and reason
- **Webhook Errors** (`/admin/webhook-errors`) — failed webhook events with payload snapshot and open/resolved status
- Finance page (estimates), contact message review

### First-session onboarding

`FirstSessionGuide` modal appears once on a user's first session (localStorage flag). Explains the 15 metrics, scoring model, and how to get the best out of practice.

### SEO landing pages

Static pages at `/for/[slug]` with unique titles, meta descriptions, Open Graph tags, benefits, FAQs, and CTAs linked to the matching practice setup flow.

| Slug | Target keyword |
| --- | --- |
| `interview-practice` | AI job interview practice |
| `salary-negotiation-practice` | Salary negotiation simulator |
| `public-speaking-practice` | Public speaking AI practice |
| `difficult-conversations-practice` | Difficult conversations practice |
| `sales-pitch-practice` | AI sales pitch practice |

### Content and legal

- Resources hub, blog (`/blog/[slug]`), articles (`/articles/[slug]`), contact page
- `/terms`, `/privacy`, `/refund-policy`, `/cookies`, `/subscription`, `/settings`
- Three-column footer: Product / Support / Legal
- Contact form → `POST /api/contact` → `contactMessages`; admin review at `/admin/contact`

## Admin setup

1. Sign up normally in the app.
2. In Firebase Console open `Firestore > users/{uid}`.
3. Set `role` to `"admin"`.
4. Reload the app and visit `/admin`.

Before production, enforce `/api/admin/*` routes with Firebase Admin token verification and custom claims.

## Firestore collections

| Group | Collections |
| --- | --- |
| Identity | `users`, `userEntitlements`, `userSessionCounters`, `plans`, `featureUsage` |
| Practice | `sessions`, `sessions/{id}/messages`, `reports`, `analytics`, `reasoningTrees`, `historicalPerformance` |
| Habits | `practiceSchedules`, `practiceHistory`, `notifications`, `achievements`, `userProgress` |
| Courses | `courses`, `courseModules`, `courseSessions`, `courseProgress`, `courseTemplates`, `coursePackages` |
| Billing | `billing_customers`, `billing_subscriptions`, `billing_checkouts` |
| Revenue ops | `revenueTransactions`, `churnEvents`, `webhookErrors` |
| Operations | `adminLogs`, `contactMessages`, `safetyEvents` |
| Telemetry | `conversationTelemetry`, `sessionOutcomes`, `voiceProfiles`, `privacySettings`, `telemetryLabels` |

Deploy rules and indexes:

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

## Seeding

```bash
cd backend
source venv/bin/activate
FIRST_ADMIN_EMAIL=you@example.com FIRST_ADMIN_UID=YOUR_UID python scripts/seed_firestore.py
```

## Paddle billing setup

```env
# backend/.env
PADDLE_API_KEY=your_sandbox_key
PADDLE_WEBHOOK_SECRET=your_webhook_secret
```

Configure the Paddle sandbox webhook to point at `POST /api/payments/paddle/webhook`. The Firebase UID is passed automatically via `customData`.

## AI cost controls

- `GEMINI_ROLEPLAY_MODEL=gemini-2.5-flash-lite` — cheap live turns
- `GEMINI_MODEL=gemini-2.5-flash` — detailed final reports
- `AI_HISTORY_MESSAGES=8` — only recent context per call
- `AI_ROLEPLAY_MAX_OUTPUT_TOKENS=180` — short spoken replies
- `AI_REPORT_MAX_OUTPUT_TOKENS=900` — capped report generation
- Reports generated once and reused on repeat requests
- Mock fallback active when `GEMINI_API_KEY` is empty

## Voice setup

### Deepgram (STT)

```env
# backend/.env
DEEPGRAM_API_KEY=your_key
```

```env
# frontend/.env.local
NEXT_PUBLIC_API_WS_URL=ws://localhost:8000
```

### Cartesia (TTS)

```env
# backend/.env
CARTESIA_API_KEY=your_key
CARTESIA_VOICE_ID=db6b0ed5-d5d3-463d-ae85-518a07d3c2b4
CARTESIA_MODEL_ID=sonic-3
CARTESIA_VERSION=2026-03-01
```

Both keys stay backend-only and are never sent to the browser.

## Multilingual practice

Separate language preferences for roleplay and feedback: English, Arabic, Urdu, Hindi, Spanish, French. Arabic and Urdu sessions use RTL layout. Stored as `preferredPracticeLanguage` and `preferredFeedbackLanguage` on `users/{uid}`.

## Credentials needed for production

- Firebase client config (frontend auth)
- Google Cloud service account / workload identity (Firestore + backend)
- `GEMINI_API_KEY`
- `DEEPGRAM_API_KEY` (backend only)
- `CARTESIA_API_KEY` (backend only)
- Paddle production API key and webhook secret

Keep secrets in backend `.env`, Cloud Run environment variables, or Google Cloud Secret Manager. Frontend variables must be `NEXT_PUBLIC_*` only.

## GitHub branch conventions

Use short feature branches:

- `feature/session-flow`
- `feature/firebase-auth`
- `fix/report-parsing`
