"use client";

import {
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInAnonymously,
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
  status: "active" | "trialing" | "past_due" | "cancelled";
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
  getToken: () => Promise<string | null>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, practiceLanguage?: LanguageCode, feedbackLanguage?: LanguageCode, compliance?: SignupCompliance) => Promise<void>;
  signInWithGoogle: (practiceLanguage?: LanguageCode, feedbackLanguage?: LanguageCode, compliance?: SignupCompliance) => Promise<void>;
  signOut: () => Promise<void>;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (email: string, password: string, practiceLanguage?: LanguageCode, feedbackLanguage?: LanguageCode, compliance?: SignupCompliance) => Promise<void>;
  signInGoogle: (practiceLanguage?: LanguageCode, feedbackLanguage?: LanguageCode, compliance?: SignupCompliance) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerification: (email: string, password: string) => Promise<void>;
  continueAsGuest: () => Promise<void>;
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
      allowCameraAssistedTiming: false,
      allowLocalSignalTelemetry: false,
      allowRawVideoStorage: false,
    },
    ageConfirmed: false,
    minorConsentAcknowledged: false,
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

async function upsertUserProfile(user: User, practiceLanguage?: LanguageCode, feedbackLanguage?: LanguageCode, compliance?: SignupCompliance) {
  if (user.isAnonymous) return null;
  const db = getFirebaseDb();
  if (!db) return fallbackProfile(user);
  try {
    const userRef = doc(db, "users", user.uid);
    const existing = await getDoc(userRef);
    const existingData = existing.exists() ? existing.data() : {};
    const profile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      role: existingData.role || "user",
      planId: existingData.planId || "free",
      planName: existingData.planName || "Free",
      status: existingData.status || "active",
      createdAt: existingData.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      preferredPracticeLanguage: practiceLanguage || existingData.preferredPracticeLanguage || "en",
      preferredFeedbackLanguage: feedbackLanguage || existingData.preferredFeedbackLanguage || "en",
      privacySettings: existingData.privacySettings || {
        allowTelemetry: true,
        allowModelImprovement: true,
        allowRawAudioStorage: false,
        allowCameraAssistedTiming: false,
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
      role: profile.role,
      planId: profile.planId,
      planName: profile.planName,
      status: profile.status,
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
      if (!result.user.emailVerified) {
        await firebaseSignOut(auth);
        throw new Error("EMAIL_NOT_VERIFIED");
      }
      setProfile(await upsertUserProfile(result.user));
    }

    async function signUpWithEmailAction(email: string, password: string, practiceLanguage?: LanguageCode, feedbackLanguage?: LanguageCode, compliance?: SignupCompliance) {
      if (!compliance?.ageConfirmed || !compliance.termsAccepted || !compliance.privacyAccepted) {
        throw new Error("You must confirm age eligibility and accept the Terms and Privacy Policy.");
      }
      const auth = requireAuthClient();
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(result.user);
      await upsertUserProfile(result.user, practiceLanguage, feedbackLanguage, compliance);
      await firebaseSignOut(auth);
    }

    async function signInWithGoogleAction(practiceLanguage?: LanguageCode, feedbackLanguage?: LanguageCode, compliance?: SignupCompliance) {
      if ((practiceLanguage || feedbackLanguage) && (!compliance?.ageConfirmed || !compliance.termsAccepted || !compliance.privacyAccepted)) {
        throw new Error("You must confirm age eligibility and accept the Terms and Privacy Policy.");
      }
      const auth = requireAuthClient();
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      setProfile(await upsertUserProfile(result.user, practiceLanguage, feedbackLanguage, compliance));
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
    continueAsGuest: async () => {
      const auth = requireAuthClient();
      await signInAnonymously(auth);
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
