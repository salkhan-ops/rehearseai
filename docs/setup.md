# Local Setup

For the full system map, read `architecture.md` first. Local setup can run with mock AI and in-memory storage, which keeps demos simple while preserving the same frontend/API boundary used in production.

## Requirements

- Node.js 20+
- Python 3.11+
- Firebase project for authentication
- Google Cloud project for Firestore when moving beyond mock storage
- Optional provider keys for Gemini, Deepgram, Cartesia, and Paddle

## Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

If `FIRESTORE_PROJECT_ID` is empty, the backend stores data in memory. If `GEMINI_API_KEY` is empty, roleplay and reports use safe mock responses.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Set `NEXT_PUBLIC_API_URL=http://localhost:8000`.
Set `NEXT_PUBLIC_API_WS_URL=ws://localhost:8000` when testing Deepgram voice proxy locally.

## Firebase Auth

Create a Firebase project, enable Email/Password and Google providers, then copy the web app config into the frontend environment variables. Backend token verification is marked as a TODO for the production pass.

## Optional integrations

- Gemini: add `GEMINI_API_KEY` to backend `.env` for real roleplay and reports.
- Deepgram: add `DEEPGRAM_API_KEY` for live speech-to-text through `/ws/voice/deepgram`.
- Cartesia: add `CARTESIA_API_KEY` for backend text-to-speech through `/api/voice/tts`.
- Paddle: add sandbox price IDs and webhook secret for subscription testing.

Without these keys, the app remains demoable through mock AI, browser voice fallbacks, and placeholder subscription behavior.
