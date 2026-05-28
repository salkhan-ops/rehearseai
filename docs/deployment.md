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

## Frontend

Deploy the Next.js app to Vercel, Firebase Hosting, or a Google Cloud container. Set `NEXT_PUBLIC_API_URL` to the Cloud Run backend URL.

## Safety

The frontend never receives the Gemini API key. All AI calls go through FastAPI.
