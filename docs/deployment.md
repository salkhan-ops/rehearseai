# Deployment

This deployment guide supports the architecture described in `architecture.md`. GitHub Pages deployment is disabled while RehearseAI remains private. The backend is Google Cloud Run-ready, and the frontend is currently tested locally.

## Backend

The backend is ready for Google Cloud Run using `backend/Dockerfile`.

Current Google Cloud project:

```text
rehearseai-prod
```

Deploy the backend:

```bash
gcloud builds submit backend --tag gcr.io/rehearseai-prod/rehearseai-backend
gcloud run deploy rehearseai-backend \
  --image gcr.io/rehearseai-prod/rehearseai-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

After deployment, Cloud Run prints the service URL. Use that full URL as `NEXT_PUBLIC_API_URL` only for private/local frontend testing or a future private hosting target.

Current expected backend URL after the service is healthy:

```text
https://rehearseai-backend-805488057071.us-central1.run.app
```

Set environment variables in Cloud Run or Secret Manager:

- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `GEMINI_ROLEPLAY_MODEL`
- `AI_HISTORY_MESSAGES`
- `AI_ROLEPLAY_MAX_OUTPUT_TOKENS`
- `AI_REPORT_MAX_OUTPUT_TOKENS`
- `FIRESTORE_PROJECT_ID`
- `DEEPGRAM_API_KEY`
- `CARTESIA_API_KEY`
- `CARTESIA_VOICE_ID`
- `CARTESIA_MODEL_ID`
- `CARTESIA_VERSION`
- `PADDLE_API_KEY`
- `PADDLE_WEBHOOK_SECRET`
- `PADDLE_PRO_PRICE_ID`
- `PADDLE_COACH_PRICE_ID`
- `PADDLE_ENVIRONMENT`
- `CORS_ORIGINS`

For local testing, include the local frontend URL in `CORS_ORIGINS`:

```text
http://localhost:3000
```

## Frontend

GitHub Pages deployment is disabled. There is no Pages workflow in this repository.

Local links:

```text
Repository: https://github.com/salkhan-ops/rehearseai
Frontend:   http://localhost:3000
Backend:    http://localhost:8000
```

Run the frontend locally:

```bash
cd frontend
npm run dev
```

The regular `npm run build` uses the standalone Next.js output for future non-GitHub-Pages deployments.

## Safety

The frontend never receives the Gemini API key. All AI calls go through FastAPI.
Deepgram, Cartesia, Paddle, and Google service-account credentials must also stay backend-only.

## Production readiness checklist

- Verify Firebase ID tokens in FastAPI before allowing user-specific or admin operations.
- Use Firebase custom claims for admin authorization before irreversible billing/access changes.
- Enable Paddle webhook signature verification before accepting live payment events.
- Store secrets in Secret Manager or Cloud Run environment variables, not repository files.
- Deploy Firestore rules and indexes after schema changes.
- Configure Cloud Run logs, alerting, budget alerts, and provider quota monitoring.
- Keep `CORS_ORIGINS` limited to approved frontend origins.
