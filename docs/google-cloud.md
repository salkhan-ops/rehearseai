# Google Cloud

## Project setup

1. Create a Google Cloud project.
2. Enable Firestore in Native mode.
3. Enable Cloud Run.
4. Enable Cloud Build.
5. Create a service account for the backend with Firestore access.
6. Store secrets in Secret Manager or Cloud Run environment variables.

## Firestore collections

- `users/{userId}`
- `sessions/{sessionId}`
- `sessions/{sessionId}/messages/{messageId}`
- `reports/{reportId}`

## Backend deploy

```bash
gcloud builds submit backend --tag gcr.io/YOUR_PROJECT/rehearseai-backend
gcloud run deploy rehearseai-backend --image gcr.io/YOUR_PROJECT/rehearseai-backend --region us-central1 --allow-unauthenticated
```

Set `CORS_ORIGINS` to the frontend domain.

## Frontend deploy

Vercel is simplest for Next.js. Firebase Hosting is also possible. In either case, set:

```text
NEXT_PUBLIC_API_URL=https://YOUR_CLOUD_RUN_URL
```
