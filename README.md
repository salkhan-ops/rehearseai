# RehearseAI

Practice the moment before it matters.

RehearseAI is a full-stack MVP for rehearsing high-stakes real-life situations with AI roleplay and structured feedback reports.

## Stack

- Frontend: Next.js App Router, TypeScript, Tailwind CSS
- Backend: FastAPI
- Database: Google Firestore
- AI: Google Gemini API, with mock fallback
- Payments: Paddle placeholder
- Hosting target: Google Cloud Run for backend, Vercel or Firebase Hosting for frontend

## Project structure

```text
rehearseai/
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
- Chat-style roleplay session
- Mock AI responses without Gemini credentials
- Session ending
- Structured mock report generation
- Dashboard session listing
- Pricing page with Paddle placeholder

## Credentials needed for production

- Firebase client config for frontend authentication
- Google Cloud service account or workload identity for Firestore
- `GEMINI_API_KEY` for real Gemini responses and reports
- Paddle sandbox or production API keys and webhook secret

Do not commit secrets. Keep them in local `.env`, Vercel/Firebase config, or Google Cloud Secret Manager.
