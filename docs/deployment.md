# Deployment

This deployment guide supports the architecture described in `architecture.md`. The current production target is a static GitHub Pages frontend with a Google Cloud Run FastAPI backend.

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

After deployment, Cloud Run prints the service URL. Use that full URL as `NEXT_PUBLIC_API_URL` in the GitHub repository variables.

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

For GitHub Pages, include the production frontend URL in `CORS_ORIGINS`:

```text
https://salkhan-ops.github.io
```

## Frontend

The frontend can be published as a static GitHub Pages site. A workflow is included at `.github/workflows/github-pages.yml`.

Production links:

```text
Repository: https://github.com/salkhan-ops/rehearseai
Frontend:   https://salkhan-ops.github.io/rehearseai/
Actions:    https://github.com/salkhan-ops/rehearseai/actions
```

1. In GitHub, open **Settings → Pages** and set the source to **GitHub Actions**.
2. In **Settings → Secrets and variables → Actions → Variables**, add:
   - `NEXT_PUBLIC_API_URL`: your deployed Cloud Run backend URL
   - `NEXT_PUBLIC_API_WS_URL`: the backend WebSocket origin, usually the Cloud Run URL with `https` replaced by `wss`
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `NEXT_PUBLIC_PADDLE_PRO_CHECKOUT_URL`
   - `NEXT_PUBLIC_PADDLE_COACH_CHECKOUT_URL`
3. Push to `main`, or run the workflow manually from the GitHub Actions tab.

Do not use `http://localhost:8000` as `NEXT_PUBLIC_API_URL` for production. It only works for local development and temporary testing.

For a local static export check:

```bash
cd frontend
npm run build:pages
```

This writes the static site to `frontend/out`. The regular `npm run build` still uses the standalone Next.js output for non-GitHub-Pages deployments.

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
