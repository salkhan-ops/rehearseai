# RehearseAI

Practice the moment before it matters.

RehearseAI is a full-stack MVP for cognitive performance training: adaptive pressure simulation, communication intelligence, reasoning analytics, and structured feedback reports.

## Stack

- Frontend: Next.js App Router, TypeScript, Tailwind CSS
- Backend: FastAPI
- Database: Google Firestore
- AI: Google Gemini API, with mock fallback
- Payments: Paddle placeholder
- Hosting target: Google Cloud Run for backend, Vercel or Firebase Hosting for frontend

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
git remote add origin git@github.com:YOUR_ORG/rehearseai.git
git push -u origin main
```

Use short feature branches such as `feature/session-flow`, `feature/firebase-auth`, or `fix/report-parsing`.

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

## Admin setup

1. Sign up normally in the app.
2. In Firebase Console, open `Firestore > users/{uid}`.
3. Set `role` to `admin`.
4. Reopen the app and visit `/admin`.

The current admin protection uses frontend Firestore role checks for MVP speed. Before production, enforce `/api/admin/*` with Firebase Admin token verification and admin custom claims. See `docs/firestore-security.md`.

## Firestore design, rules, and indexes

The full Firestore collection design is documented in `docs/firestore-design.md`.

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
- Paddle sandbox or production API keys and webhook secret

Do not commit secrets. Keep them in local `.env`, Vercel/Firebase config, or Google Cloud Secret Manager.
