"use client";

import {
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  deleteUser,
  getAdditionalUserInfo,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase";
import type { LanguageCode } from "@/lib/languages";

export type AppUserProfile = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: "user" | "admin";
  planId: string;
  planName: string;
  status: "active" | "trialing" | "past_due" | "cancelled" | "disabled" | "removed";
  preferredPracticeLanguage: LanguageCode;
  preferredFeedbackLanguage: LanguageCode;
  privacySettings: {
    allowTelemetry: boolean;
    allowModelImprovement: boolean;
    allowRawAudioStorage: boolean;
    allowCameraAssistedTiming: boolean;
    allowLocalSignalTelemetry: boolean;
    allowRawVideoStorage: false;
  };
  ageConfirmed: boolean;
  minorConsentAcknowledged: boolean;
  termsAcceptedAt?: unknown;
  privacyAcceptedAt?: unknown;
  ageConfirmedAt?: unknown;
};

export type SignupCompliance = {
  ageConfirmed: boolean;
  minorConsentAcknowledged: boolean;
  termsAccepted: boolean;
  privacyAccepted: boolean;
};

type AuthContextValue = {
  user: User | null;
  profile: AppUserProfile | null;
  loading: boolean;
  userId: string;
  isAdmin: boolean;
  emailVerified: boolean;
  getToken: () => Promise<string | null>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, practiceLanguage?: LanguageCode, feedbackLanguage?: LanguageCode, compliance?: SignupCompliance) => Promise<void>;
  // Returns whether this was a genuinely new Firebase account (per Google's own
  // isNewUser signal), not whether the UI happened to be in "signup" mode -- the same
  // Google button is used for both, and the caller can't reliably know in advance which
  // one a given click will turn out to be.
  signInWithGoogle: (practiceLanguage?: LanguageCode, feedbackLanguage?: LanguageCode, compliance?: SignupCompliance) => Promise<boolean>;
  signOut: () => Promise<void>;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (email: string, password: string, practiceLanguage?: LanguageCode, feedbackLanguage?: LanguageCode, compliance?: SignupCompliance) => Promise<void>;
  signInGoogle: (practiceLanguage?: LanguageCode, feedbackLanguage?: LanguageCode, compliance?: SignupCompliance) => Promise<boolean>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerification: (email: string, password: string) => Promise<void>;
  updateLanguagePreferences: (practiceLanguage: LanguageCode, feedbackLanguage: LanguageCode) => Promise<void>;
  confirmAgeEligibility: (minorConsentAcknowledged?: boolean) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function fallbackProfile(user: User): AppUserProfile {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    role: "user",
    planId: "free",
    planName: "Free",
    status: "active",
    preferredPracticeLanguage: "en",
    preferredFeedbackLanguage: "en",
    privacySettings: {
      allowTelemetry: true,
      allowModelImprovement: true,
      allowRawAudioStorage: false,
      allowCameraAssistedTiming: true,
      allowLocalSignalTelemetry: false,
      allowRawVideoStorage: false,
    },
    // Assume confirmed in fallback — the real value is in Firestore; if the write
    // failed we don't want to block the user with the age-check wall on every load.
    ageConfirmed: true,
    minorConsentAcknowledged: true,
  };
}

function requireAuthClient() {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error("Firebase env vars are missing. Add NEXT_PUBLIC_FIREBASE_* values first.");
  }
  return auth;
}

function compliancePayload(compliance?: SignupCompliance) {
  const accepted = Boolean(compliance?.ageConfirmed && compliance.termsAccepted && compliance.privacyAccepted);
  return accepted ? {
    ageConfirmed: true,
    minorConsentAcknowledged: Boolean(compliance?.minorConsentAcknowledged),
    termsAcceptedAt: serverTimestamp(),
    privacyAcceptedAt: serverTimestamp(),
    ageConfirmedAt: serverTimestamp(),
  } : {};
}

async function upsertUserProfile(user: User, practiceLanguage?: LanguageCode, feedbackLanguage?: LanguageCode, compliance?: SignupCompliance, strict = false) {
  if (user.isAnonymous) return null;
  const db = getFirebaseDb();
  if (!db) {
    if (strict) throw new Error("Account setup is temporarily unavailable. Please try again in a moment.");
    return fallbackProfile(user);
  }
  try {
    const userRef = doc(db, "users", user.uid);
    const existing = await getDoc(userRef);
    const isNewUser = !existing.exists();
    const existingData = existing.exists() ? existing.data() : {};
    // For existing users, NEVER overwrite role/planId/planName/status — the
    // Firestore security rule blocks changes to these fields from the client.
    // Only include them in the write when creating a brand-new document.
    const protectedFields = isNewUser ? {
      role: "user",
      planId: "free",
      planName: "Free",
      status: "active",
    } : {};
    const profile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      ...protectedFields,
      createdAt: existingData.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      preferredPracticeLanguage: practiceLanguage || existingData.preferredPracticeLanguage || "en",
      preferredFeedbackLanguage: feedbackLanguage || existingData.preferredFeedbackLanguage || "en",
      privacySettings: existingData.privacySettings || {
        allowTelemetry: true,
        allowModelImprovement: true,
        allowRawAudioStorage: false,
        allowCameraAssistedTiming: true,
        allowLocalSignalTelemetry: false,
        allowRawVideoStorage: false,
      },
      ageConfirmed: existingData.ageConfirmed || Boolean(compliance?.ageConfirmed),
      minorConsentAcknowledged: existingData.minorConsentAcknowledged || Boolean(compliance?.minorConsentAcknowledged),
      ...compliancePayload(compliance),
      ...(existingData.termsAcceptedAt !== undefined && { termsAcceptedAt: existingData.termsAcceptedAt }),
      ...(existingData.privacyAcceptedAt !== undefined && { privacyAcceptedAt: existingData.privacyAcceptedAt }),
      ...(existingData.ageConfirmedAt !== undefined && { ageConfirmedAt: existingData.ageConfirmedAt }),
    };
    await setDoc(userRef, profile, { merge: true });
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      role: (existingData.role || "user") as "user" | "admin",
      planId: existingData.planId || "free",
      planName: existingData.planName || "Free",
      status: (existingData.status || "active") as AppUserProfile["status"],
      preferredPracticeLanguage: profile.preferredPracticeLanguage,
      preferredFeedbackLanguage: profile.preferredFeedbackLanguage,
      privacySettings: profile.privacySettings,
      ageConfirmed: Boolean(profile.ageConfirmed),
      minorConsentAcknowledged: Boolean(profile.minorConsentAcknowledged),
      ...(profile.termsAcceptedAt !== undefined && { termsAcceptedAt: profile.termsAcceptedAt }),
      ...(profile.privacyAcceptedAt !== undefined && { privacyAcceptedAt: profile.privacyAcceptedAt }),
      ...(profile.ageConfirmedAt !== undefined && { ageConfirmedAt: profile.ageConfirmedAt }),
    } as AppUserProfile;
  } catch (error) {
    console.warn("Firebase Auth succeeded, but Firestore profile sync failed. Deploy firestore.rules to enable profile writes.", error);
    // During signup this must not be swallowed — silently returning a fallback profile here
    // previously left the person with a real Firebase Auth account but no Firestore user
    // document, so they never showed up as a user and the app broke for them post-signup.
    if (strict) throw new Error("We couldn't finish creating your account. Please try again.");
    return fallbackProfile(user);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return undefined;
    }
    return onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setProfile(nextUser ? await upsertUserProfile(nextUser) : null);
      setLoading(false);
    });
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    async function signInWithEmailAction(email: string, password: string) {
      const auth = requireAuthClient();
      const result = await signInWithEmailAndPassword(auth, email, password);
      // Non-blocking: let unverified users in so they can reach their first session.
      // A soft banner in the app prompts them to verify. PDF download and session
      // history require verification; first-time practice does not.
      setProfile(await upsertUserProfile(result.user));
    }

    async function signUpWithEmailAction(email: string, password: string, practiceLanguage?: LanguageCode, feedbackLanguage?: LanguageCode, compliance?: SignupCompliance) {
      if (!compliance?.ageConfirmed || !compliance.termsAccepted || !compliance.privacyAccepted) {
        throw new Error("You must confirm age eligibility and accept the Terms and Privacy Policy.");
      }
      const auth = requireAuthClient();
      const result = await createUserWithEmailAndPassword(auth, email, password);
      // Force a fresh ID token before the first Firestore write — immediately after
      // createUserWithEmailAndPassword resolves, the SDK's cached token isn't always
      // propagated yet, which makes the very next Firestore request look unauthenticated
      // and get rejected even though the account was just created successfully.
      await result.user.getIdToken(true);
      await sendEmailVerification(result.user);
      try {
        // Auto-login: stay signed in and adopt the new profile immediately, same as the
        // Google signup path, instead of signing back out and forcing a manual sign-in.
        // Verification email is still sent above; unverified users are allowed in (see
        // the non-blocking comment on signInWithEmailAction) and can practice right away.
        setProfile(await upsertUserProfile(result.user, practiceLanguage, feedbackLanguage, compliance, true));
      } catch (profileError) {
        // Don't leave an orphaned Auth account with no Firestore profile — it would block
        // retrying signup with the same email while the person has no usable account.
        await deleteUser(result.user).catch(() => {});
        await firebaseSignOut(auth).catch(() => {});
        throw profileError;
      }
    }

    async function signInWithGoogleAction(practiceLanguage?: LanguageCode, feedbackLanguage?: LanguageCode, compliance?: SignupCompliance) {
      if ((practiceLanguage || feedbackLanguage) && (!compliance?.ageConfirmed || !compliance.termsAccepted || !compliance.privacyAccepted)) {
        throw new Error("You must confirm age eligibility and accept the Terms and Privacy Policy.");
      }
      const auth = requireAuthClient();
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      // The real signal, straight from Firebase -- independent of which UI mode (signup
      // vs signin) the person happened to click through, since it's the same button.
      const isNewUser = Boolean(getAdditionalUserInfo(result)?.isNewUser);
      const applyCompliance = isNewUser && Boolean(compliance);
      if (applyCompliance) {
        try {
          setProfile(await upsertUserProfile(result.user, practiceLanguage, feedbackLanguage, compliance, true));
        } catch (profileError) {
          // Brand-new Google account with no Firestore profile — clean it up rather than
          // leaving an orphaned Auth account, same as the email/password signup path.
          await deleteUser(result.user).catch(() => {});
          await firebaseSignOut(auth).catch(() => {});
          throw profileError;
        }
      } else {
        setProfile(await upsertUserProfile(result.user, practiceLanguage, feedbackLanguage, compliance));
      }
      // A new account that didn't get compliance here (e.g. came through the signin
      // form, which collects none) simply has ageConfirmed:false in its profile --
      // ProtectedRoute's existing /age-check gate catches that on the next protected
      // page load and collects consent there instead.
      return isNewUser;
    }

    async function signOutAction() {
      const auth = requireAuthClient();
      await firebaseSignOut(auth);
      setProfile(null);
    }

    async function updateLanguagePreferences(practiceLanguage: LanguageCode, feedbackLanguage: LanguageCode) {
      if (!user || user.isAnonymous) return;
      const db = getFirebaseDb();
      const nextProfile = {
        ...(profile || fallbackProfile(user)),
        preferredPracticeLanguage: practiceLanguage,
        preferredFeedbackLanguage: feedbackLanguage,
      };
      setProfile(nextProfile);
      if (db) {
        await setDoc(doc(db, "users", user.uid), {
          preferredPracticeLanguage: practiceLanguage,
          preferredFeedbackLanguage: feedbackLanguage,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }
    }

    async function confirmAgeEligibility(nextMinorConsentAcknowledged = false) {
      if (!user) return;
      const db = getFirebaseDb();
      const nextProfile = {
        ...(profile || fallbackProfile(user)),
        ageConfirmed: true,
        minorConsentAcknowledged: nextMinorConsentAcknowledged,
        termsAcceptedAt: profile?.termsAcceptedAt || new Date().toISOString(),
        privacyAcceptedAt: profile?.privacyAcceptedAt || new Date().toISOString(),
        ageConfirmedAt: new Date().toISOString(),
      };
      setProfile(nextProfile);
      if (db) {
        await setDoc(doc(db, "users", user.uid), {
          ageConfirmed: true,
          minorConsentAcknowledged: nextMinorConsentAcknowledged,
          termsAcceptedAt: serverTimestamp(),
          privacyAcceptedAt: serverTimestamp(),
          ageConfirmedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }
    }

    return {
    user,
    profile,
    loading,
    userId: user?.uid || "guest",
    emailVerified: user?.emailVerified ?? false,
    isAdmin: profile?.role === "admin",
    getToken: async () => user?.getIdToken() || null,
    signInWithEmail: signInWithEmailAction,
    signUpWithEmail: signUpWithEmailAction,
    signInWithGoogle: signInWithGoogleAction,
    signOut: signOutAction,
    signInEmail: signInWithEmailAction,
    signUpEmail: signUpWithEmailAction,
    signInGoogle: signInWithGoogleAction,
    logout: signOutAction,
    resetPassword: async (email) => {
      const auth = requireAuthClient();
      await sendPasswordResetEmail(auth, email);
    },
    resendVerification: async (email, password) => {
      const auth = requireAuthClient();
      const result = await signInWithEmailAndPassword(auth, email, password);
      if (!result.user.emailVerified) {
        await sendEmailVerification(result.user);
        await firebaseSignOut(auth);
      }
    },
    updateLanguagePreferences,
    confirmAgeEligibility,
    };
  }, [user, profile, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}

export async function isAdmin(userId: string) {
  const db = getFirebaseDb();
  if (!db || !userId || userId === "guest") return false;
  try {
    const snapshot = await getDoc(doc(db, "users", userId));
    return snapshot.exists() && snapshot.data().role === "admin";
  } catch {
    return false;
  }
}
