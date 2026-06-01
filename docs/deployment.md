# Deployment

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
- `FIRESTORE_PROJECT_ID`
- `PADDLE_API_KEY`
- `PADDLE_WEBHOOK_SECRET`
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
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
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
