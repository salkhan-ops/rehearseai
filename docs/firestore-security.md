# Firestore Security Rules

These rules document the intended production posture for RehearseAI. They keep local development simple while showing the target access model.

Core goals:
- Users can read and update only their own profile.
- Users can read only their own entitlements.
- Users cannot directly modify their plan assignment.
- Admin users can manage plans, user entitlements, billing mappings, and overrides.
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

    match /users/{uid} {
      allow read: if isOwner(uid) || isAdmin();
      allow create: if isOwner(uid);
      allow update: if isOwner(uid)
        && !("role" in request.resource.data.diff(resource.data).changedKeys())
        && !("planId" in request.resource.data.diff(resource.data).changedKeys())
        && !("planName" in request.resource.data.diff(resource.data).changedKeys())
        || isAdmin();
    }

    match /plans/{planId} {
      allow read: if signedIn();
      allow write: if isAdmin();
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
      allow read, write: if isAdmin();
    }

    match /billing_checkouts/{checkoutId} {
      allow read: if signedIn() && resource.data.uid == request.auth.uid || isAdmin();
      allow write: if isAdmin();
    }

    match /sessions/{sessionId} {
      allow read, write: if signedIn() && resource.data.userId == request.auth.uid || isAdmin();
      match /messages/{messageId} {
        allow read, write: if signedIn() || isAdmin();
      }
    }

    match /reports/{reportId} {
      allow read: if signedIn() && resource.data.userId == request.auth.uid || isAdmin();
      allow write: if isAdmin();
    }

    match /analytics/{analyticsId} {
      allow read: if signedIn() && resource.data.userId == request.auth.uid || isAdmin();
      allow write: if isAdmin();
    }
  }
}
```

Production TODO:
- Use Firebase Admin SDK on FastAPI to verify ID tokens.
- Add `admin: true` custom claims for admins.
- Require server-side admin verification on every `/api/admin/*` endpoint.
- Do not rely only on frontend Firestore role checks for irreversible billing or access changes.
