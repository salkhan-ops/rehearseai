# Deployment

## Backend

The backend is ready for Google Cloud Run using `backend/Dockerfile`.

High-level flow:

```bash
gcloud builds submit backend --tag gcr.io/YOUR_PROJECT/rehearseai-backend
gcloud run deploy rehearseai-backend \
  --image gcr.io/YOUR_PROJECT/rehearseai-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

Set environment variables in Cloud Run or Secret Manager:

- `GEMINI_API_KEY`
- `FIRESTORE_PROJECT_ID`
- `PADDLE_API_KEY`
- `PADDLE_WEBHOOK_SECRET`
- `PADDLE_ENVIRONMENT`
- `CORS_ORIGINS`

For GitHub Pages, include the final Pages URL in `CORS_ORIGINS`, for example:

```text
https://YOUR_GITHUB_USER.github.io/YOUR_REPOSITORY
```

## Frontend

The frontend can be published as a static GitHub Pages site. A workflow is included at `.github/workflows/github-pages.yml`.

1. In GitHub, open **Settings → Pages** and set the source to **GitHub Actions**.
2. In **Settings → Secrets and variables → Actions → Variables**, add:
   - `NEXT_PUBLIC_API_URL`: your Cloud Run service URL, for example `https://rehearseai-backend-xxxxx-uc.a.run.app`
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
3. Push to `main`, or run the workflow manually from the GitHub Actions tab.

For a local static export check:

```bash
cd frontend
npm run build:pages
```

This writes the static site to `frontend/out`. The regular `npm run build` still uses the standalone Next.js output for non-GitHub-Pages deployments.

## Safety

The frontend never receives the Gemini API key. All AI calls go through FastAPI.
