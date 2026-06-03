# Google Cloud

This guide describes the Google Cloud pieces used by the architecture in `architecture.md`.

## Project setup

1. Create a Google Cloud project.
2. Enable Firestore in Native mode.
3. Enable Cloud Run.
4. Enable Cloud Build.
5. Create a service account for the backend with Firestore access.
6. Store secrets in Secret Manager or Cloud Run environment variables.
7. Deploy Firestore rules and indexes from the repository.
8. Configure Cloud Run logs, budget alerts, and provider quota monitoring before a production launch.

## Firestore collections

- `users/{userId}`
- `sessions/{sessionId}`
- `sessions/{sessionId}/messages/{messageId}`
- `reports/{reportId}`
- `analytics/{analyticsId}`
- `reasoningTrees/{treeId}`
- `historicalPerformance/{uid}`
- `practiceSchedules/{scheduleId}`
- `practiceHistory/{historyId}`
- `courses/{courseId}`
- `courseModules/{moduleId}`
- `courseSessions/{sessionId}`
- `courseProgress/{progressId}`
- `plans/{planId}`
- `userEntitlements/{uid}`
- `billing_customers/{uid}`
- `billing_subscriptions/{subscriptionId}`
- `billing_checkouts/{checkoutId}`
- `contactMessages/{messageId}`
- `adminLogs/{logId}`
- `conversationTelemetry/{telemetryId}`
- `sessionOutcomes/{outcomeId}`
- `voiceProfiles/{userId}`
- `telemetryLabels/{labelId}`

## Backend deploy

```bash
gcloud builds submit backend --tag gcr.io/YOUR_PROJECT/rehearseai-backend
gcloud run deploy rehearseai-backend --image gcr.io/YOUR_PROJECT/rehearseai-backend --region us-central1 --allow-unauthenticated
```

Set `CORS_ORIGINS` to the frontend domain.

## Frontend deploy

The MVP target is GitHub Pages static hosting. Vercel or Firebase Hosting are also possible if the deployment target changes. In every case, set:

```text
NEXT_PUBLIC_API_URL=https://YOUR_CLOUD_RUN_URL
```

For WebSocket voice mode, also set:

```text
NEXT_PUBLIC_API_WS_URL=wss://YOUR_CLOUD_RUN_HOST
```

## Production controls

- Keep Gemini, Deepgram, Cartesia, Paddle, and service-account credentials out of the frontend.
- Limit Cloud Run CORS origins to trusted frontend domains.
- Prefer Secret Manager over checked-in key files.
- Use least-privilege IAM for the Cloud Run service account.
- Review Firestore rules any time a collection is added.
