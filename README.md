# RehearseAI

Practice the moment before it matters.

RehearseAI is a full-stack MVP for cognitive performance training: adaptive pressure simulation, communication intelligence, reasoning analytics, and structured feedback reports.

## Stack

- Frontend: Next.js App Router, TypeScript, Tailwind CSS
- Backend: FastAPI
- Database: Google Firestore
- AI: Google Gemini API, with mock fallback
- Payments: Paddle placeholder
- Hosting target: GitHub Pages for the static frontend, Google Cloud Run for the backend API

## Architecture and standards

For a judge-facing technical overview, see `docs/architecture.md`. It explains the end-to-end architecture, runtime flows, Firestore data model, security/privacy controls, AI governance, deployment topology, and standards alignment with ISO/IEC, OWASP, GDPR-style privacy principles, WCAG, and NIST AI RMF.

## Live URLs

- GitHub repository: `https://github.com/salkhan-ops/rehearseai`
- Frontend: `https://salkhan-ops.github.io/rehearseai/`
- Backend API: deploy to Google Cloud Run and use the generated service URL as `NEXT_PUBLIC_API_URL`

## Project structure

```text
frontend/
backend/
docs/
docker-compose.yml
.env.example
```

## Local setup

Copy environment variables:

```bash
cp .env.example .env
```

Backend:

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`. The backend runs on `http://localhost:8000`.

## Docker local development

```bash
docker compose up --build
```

## GitHub setup

```bash
git init
git add .
git commit -m "Initial RehearseAI MVP"
git branch -M main
git remote add origin https://github.com/salkhan-ops/rehearseai.git
git push -u origin main
```

Use short feature branches such as `feature/session-flow`, `feature/firebase-auth`, or `fix/report-parsing`.

## GitHub Pages frontend deployment

The frontend deploys from GitHub Actions using `.github/workflows/github-pages.yml`.

Production frontend URL:

```text
https://salkhan-ops.github.io/rehearseai/
```

Required repository variables in **Settings → Secrets and variables → Actions → Variables**:

```text
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

`NEXT_PUBLIC_API_URL` must be the deployed Cloud Run backend URL. Do not use `http://localhost:8000` for the live GitHub Pages site except for temporary testing, because visitors' browsers would try to call their own machines.

To redeploy the frontend, push to `main` or run **Actions → Deploy frontend to GitHub Pages → Run workflow** in GitHub.

## What works now

- Landing page
- Practice type selection
- Setup form
- Session creation through FastAPI
- Text and live voice roleplay session
- Browser speech recognition and AI read-aloud
- Scenario-specific animated 3D personas
- Mock AI responses without Gemini credentials
- Session ending
- Structured mock report generation
- Dashboard session listing
- Pricing page with Paddle placeholder
- Firebase email/password auth, Google sign-in, password reset, and protected dashboard
- Admin console at `/admin` for plan templates, users, entitlements, user plan assignment, and billing placeholders
- Firestore user profile creation with role-based admin access
- Deepgram live speech-to-text through the FastAPI WebSocket proxy with browser fallback
- Immersive resources hub, blog, long-form articles, contact page, Terms of Service, and Privacy Policy
- Contact form submissions saved through FastAPI to `contactMessages`
- Recurring practice routines, daily cognitive challenges, browser reminder architecture, quick-start AI scenario generation, and practice adherence history
- Multilingual practice and feedback preferences for English, Arabic, Urdu, Hindi, Spanish, and French
- Natural conversation mode with hands-free automatic turn-taking
- Camera-assisted timing using MediaPipe face landmark signals
- Local ML pause-intent classifier pipeline (rule-based with ONNX/TFLite upgrade path)
- Voice calibration page at `/voice-calibration` to personalise silence thresholds
- Dynamic cross-examination engine with persona-specific attack vectors
- Adaptive pressure escalation that adjusts AI challenge level in real time
- Conversation stance selection (supportive → hostile) driven by session context
- Response breakdown detector that identifies confusion, evasion, and over-explanation
- Prosody extractor for per-chunk RMS energy and pitch sent to coaching logic

## Content and legal pages

The content layer is local-file based for MVP speed:

- `/resources`
- `/blog` and `/blog/[slug]`
- `/articles` and `/articles/[slug]`
- `/contact`

Contact/support system:

- `POST /api/contact` stores messages in `contactMessages/{messageId}`.
- `/admin/contact` lets admins review messages, filter by category/status, and mark requests as `new`, `in_review`, or `resolved`.
- Future TODOs: Mailtrap/SendGrid sending, auto-reply email, support ticket IDs, and file attachments.
- `/legal/terms`
- `/legal/privacy`

Blog and article content lives under `frontend/content`. The UI uses abstract AI cognition hero visuals instead of stock-human imagery.

## Admin setup

1. Sign up normally in the app.
2. In Firebase Console, open `Firestore > users/{uid}`.
3. Set `role` to `admin`.
4. Reopen the app and visit `/admin`.

The current admin protection uses frontend Firestore role checks for MVP speed. Before production, enforce `/api/admin/*` with Firebase Admin token verification and admin custom claims. See `docs/firestore-security.md`.

## Firestore design, rules, and indexes

The full Firestore collection design is documented in `docs/firestore-design.md`.
The security posture is documented in `docs/firestore-security.md`, and the architecture-level data flow is documented in `docs/architecture.md`.

Deploy Firestore security rules:

```bash
firebase deploy --only firestore:rules
```

Deploy Firestore indexes:

```bash
firebase deploy --only firestore:indexes
```

Seed default plans and optional first admin:

```bash
cd backend
source venv/bin/activate
FIRST_ADMIN_EMAIL=you@example.com FIRST_ADMIN_UID=YOUR_FIREBASE_UID python scripts/seed_firestore.py
```

Backend writes that use Firebase Admin SDK or Google service-account credentials bypass Firestore security rules. Never expose service account keys or Gemini/Paddle secrets to the frontend.

## AI cost controls

The backend is configured to keep per-user Gemini costs low:

- `GEMINI_ROLEPLAY_MODEL=gemini-2.5-flash-lite` for cheap live turns.
- `GEMINI_MODEL=gemini-2.5-flash` for more detailed final reports.
- `AI_HISTORY_MESSAGES=8` so each roleplay call sends only recent context.
- `AI_ROLEPLAY_MAX_OUTPUT_TOKENS=180` to keep spoken replies short.
- `AI_REPORT_MAX_OUTPUT_TOKENS=900` to cap report generation.
- Reports are generated once per session and reused if requested again.
- Mock fallback remains available when `GEMINI_API_KEY` is empty.

More cost strategies for production:

- Limit free plan sessions and turns per month.
- Cache/reuse generated reports.
- Summarize older conversation turns instead of sending full history.
- Use flash-lite for all live turns and reserve larger models for paid tiers.
- Add rate limits per `userId` and IP.
- Stop sessions automatically after 8 turns unless the user upgrades.
- Stream short responses rather than long coaching essays during roleplay.

## Credentials needed for production

- Firebase client config for frontend authentication
- Google Cloud service account or workload identity for Firestore
- `GEMINI_API_KEY` for real Gemini responses and reports
- `DEEPGRAM_API_KEY` in the backend only for real streaming speech-to-text
- `CARTESIA_API_KEY` in the backend only for realistic AI text-to-speech
- Paddle sandbox or production API keys and webhook secret

Do not commit secrets. Keep backend secrets in local `.env`, Cloud Run environment variables, or Google Cloud Secret Manager. GitHub repository variables should only contain `NEXT_PUBLIC_*` frontend build-time values.

## Deepgram voice mode

Set this only in backend `.env`:

```env
DEEPGRAM_API_KEY=your_deepgram_key
```

Set this in frontend `.env.local`:

```env
NEXT_PUBLIC_API_WS_URL=ws://localhost:8000
```

The frontend opens `ws://localhost:8000/ws/voice/deepgram` and streams microphone chunks to FastAPI. FastAPI connects to Deepgram with the backend-only `DEEPGRAM_API_KEY` and forwards transcript JSON back to the browser. The Deepgram key is never sent to frontend code. If the proxy or Deepgram connection fails, the app falls back to browser speech recognition/mock voice mode.

## Cartesia AI voice mode

Set this only in backend `.env`:

```env
CARTESIA_API_KEY=your_cartesia_key
CARTESIA_VOICE_ID=db6b0ed5-d5d3-463d-ae85-518a07d3c2b4
CARTESIA_MODEL_ID=sonic-3
CARTESIA_VERSION=2026-03-01
```

The frontend sends AI response text and the selected voice ID to FastAPI at `/api/voice/tts`. FastAPI calls Cartesia and returns browser-playable MP3 audio. The Cartesia key is never exposed to frontend code. If Cartesia fails or is missing, the app falls back to browser `speechSynthesis`, preferring a natural female voice when available.

The session page includes:

- AI voice selector, defaulting to Skylar, a feminine Cartesia voice.
- Session duration selector for 5, 10, 15, or 30 minutes.
- Automatic report generation when the selected time limit expires.

## Scheduling and daily practice

RehearseAI includes a daily cognitive training loop:

- Dashboard routine creator for Daily, Twice Weekly, Three Times Weekly, Weekdays, and Custom schedules.
- Browser reminder permission request and tab-based reminder scheduling for MVP.
- Backend-ready reminder service for future Google Cloud Scheduler, email, and push workers.
- Daily Cognitive Challenge on the dashboard.
- `Start Random Challenge` quick start from `/practice`.
- `Generate Random Practice Scenario` from `/practice/setup`.
- Post-report routine creation to turn one session into a recurring habit.

Firestore collections:

- `practiceSchedules/{scheduleId}`
- `practiceHistory/{historyId}`

Backend endpoints:

- `POST /api/practice-schedules`
- `GET /api/users/{user_id}/practice-schedules`
- `PATCH /api/practice-schedules/{schedule_id}`
- `POST /api/scenarios/random`
- `POST /api/scenarios/quick-start`
- `GET /api/users/{user_id}/daily-challenge`

## Legal, compliance, and subscriptions

Starter compliance pages exist at:

- `/terms`
- `/privacy`
- `/refund-policy`
- `/cookies`
- `/subscription`
- `/settings`
- `/contact`

Subscription management is Paddle-ready:

- `GET /api/subscription/current`
- `POST /api/subscription/cancel`
- `POST /api/subscription/reactivate`
- `GET /api/subscription/portal-link`
- `POST /api/account/delete-request`

For MVP, Paddle customer portal links are placeholders until Paddle portal/customer sessions are configured. Cancellation writes `cancelAtPeriodEnd`, `cancelledAt`, and optional `cancellationReason` into `billing_subscriptions`. Account deletion is a soft-delete request that marks `users/{uid}.deletionRequestedAt`, `deletedAt`, and `status=disabled`.

## Multilingual practice

Users can choose separate languages for roleplay and feedback:

- English
- Arabic
- Urdu
- Hindi
- Spanish
- French

Examples:

- Practice in English and receive feedback in Urdu.
- Practice in Arabic and receive feedback in English.
- Practice in Spanish and receive feedback in Spanish.

Language preferences are stored on `users/{uid}` as:

- `preferredPracticeLanguage`
- `preferredFeedbackLanguage`

Sessions and reports also store:

- `practiceLanguage`
- `feedbackLanguage`

Gemini is instructed to conduct roleplay in the practice language and generate reports in the feedback language. Deepgram receives the selected language code through the backend WebSocket proxy and falls back to English when an unsupported language is requested. Browser speech fallback attempts to use the selected language voice. Arabic and Urdu sessions/reports use RTL direction.
