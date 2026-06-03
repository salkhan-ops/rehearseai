# RehearseAI Backend

FastAPI backend for sessions, Gemini roleplay, structured reports, Firestore storage, and Paddle placeholders.
For the complete system view, see `../docs/architecture.md`.

## Main modules

- Routes: `app/routes` exposes health, auth, sessions, reports, practice, courses, subscriptions, payments, contact, admin, telemetry, conversation coordination, and voice endpoints.
- Services: `app/services` contains Firestore, Gemini, Deepgram, Cartesia, Paddle, reports, analytics, courses, safety scope, telemetry, and coaching logic.
- Prompts: `app/prompts` stores roleplay and report prompt templates.
- Models: `app/models` defines request and response shapes.

## Local development

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Without `FIRESTORE_PROJECT_ID` and Google credentials, the app uses in-memory storage. Without `GEMINI_API_KEY`, it uses mock AI responses.
Provider credentials for Gemini, Deepgram, Cartesia, Paddle, and Google Cloud must stay backend-only.
