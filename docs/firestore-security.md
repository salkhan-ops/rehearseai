# Firestore Security Rules

These rules document the intended production posture for RehearseAI. They keep local development simple while showing the target access model.
The full architecture and standards mapping is in `architecture.md`.

Core goals:
- Users can read and update only their own profile.
- Users can read only their own entitlements.
- Users cannot directly modify their plan assignment.
- Admin users can manage plans, user entitlements, billing mappings, and overrides.
- Users can read only their own sessions, reports, courses, practice routines, telemetry summaries, and billing metadata.
- Backend service credentials perform privileged writes for AI messages, reports, analytics, billing events, and admin workflows.
- Admin checks should eventually move to Firebase Admin custom claims for stronger server-side enforcement.

Sample rules:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() {
      return request.auth != null;
    }

    function isOwner(uid) {
      return signedIn() && request.auth.uid == uid;
    }

    function isAdmin() {
      return signedIn()
        && exists(/databases/$(database)/documents/users/$(request.auth.uid))
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin";
    }

    function isOwnSession(sessionId) {
      return signedIn()
        && exists(/databases/$(database)/documents/sessions/$(sessionId))
        && get(/databases/$(database)/documents/sessions/$(sessionId)).data.userId == request.auth.uid;
    }

    function safeUserProfileUpdate() {
      return !request.resource.data.diff(resource.data).affectedKeys().hasAny([
        "role",
        "planId",
        "planName",
        "status"
      ]);
    }

    match /users/{uid} {
      allow read: if isOwner(uid) || isAdmin();
      allow create: if isOwner(uid)
        && request.resource.data.uid == uid
        && request.resource.data.role == "user";
      allow update: if (isOwner(uid) && safeUserProfileUpdate()) || isAdmin();
      allow delete: if isAdmin();
    }

    match /plans/{planId} {
      allow read: if (signedIn() && resource.data.isActive == true) || isAdmin();
      allow create, update, delete: if isAdmin();
    }

    match /userEntitlements/{uid} {
      allow read: if isOwner(uid) || isAdmin();
      allow write: if isAdmin();
    }

    match /billing_customers/{uid} {
      allow read: if isOwner(uid) || isAdmin();
      allow write: if isAdmin();
    }

    match /billing_subscriptions/{subscriptionId} {
      allow read: if (signedIn() && resource.data.uid == request.auth.uid) || isAdmin();
      allow create, update, delete: if isAdmin();
    }

    match /billing_checkouts/{checkoutId} {
      allow read: if (signedIn() && resource.data.uid == request.auth.uid) || isAdmin();
      allow create, update, delete: if isAdmin();
    }

    match /sessions/{sessionId} {
      allow create: if signedIn()
        && request.resource.data.userId == request.auth.uid;
      allow read: if isOwnSession(sessionId) || isAdmin();
      allow update: if (isOwnSession(sessionId)
        && request.resource.data.userId == resource.data.userId) || isAdmin();
      allow delete: if isAdmin();

      match /messages/{messageId} {
        allow read: if isOwnSession(sessionId) || isAdmin();
        allow create: if isOwnSession(sessionId)
          && request.resource.data.userId == request.auth.uid
          && request.resource.data.role == "user";
        allow update, delete: if false;
      }
    }

    match /reports/{reportId} {
      allow read: if (signedIn() && resource.data.userId == request.auth.uid) || isAdmin();
      allow create, update, delete: if isAdmin();
    }

    match /analytics/{analyticsId} {
      allow read: if (signedIn() && resource.data.userId == request.auth.uid) || isAdmin();
      allow create, update, delete: if isAdmin();
    }

    match /courses/{courseId} {
      allow read: if (signedIn() && resource.data.userId == request.auth.uid) || isAdmin();
      allow create, update, delete: if isAdmin();
    }

    match /practiceSchedules/{scheduleId} {
      allow create: if signedIn() && request.resource.data.userId == request.auth.uid;
      allow read, update, delete: if (signedIn() && resource.data.userId == request.auth.uid) || isAdmin();
    }

    match /conversationTelemetry/{telemetryId} {
      allow read, write: if isAdmin();
    }

    match /voiceProfiles/{uid} {
      allow read: if isOwner(uid) || isAdmin();
      allow create, update, delete: if isAdmin();
    }
  }
}
```

Production TODO:
- Use Firebase Admin SDK on FastAPI to verify ID tokens.
- Add `admin: true` custom claims for admins.
- Require server-side admin verification on every `/api/admin/*` endpoint.
- Do not rely only on frontend Firestore role checks for irreversible billing or access changes.
- Add explicit rule coverage for any new collection before exposing it to frontend code.
- Add rate limits and abuse monitoring at the FastAPI boundary.
