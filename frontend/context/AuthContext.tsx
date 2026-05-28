"use client";

import {
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase";

export type AppUserProfile = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: "user" | "admin";
  planId: string;
  planName: string;
  status: "active" | "trialing" | "past_due" | "cancelled";
};

type AuthContextValue = {
  user: User | null;
  profile: AppUserProfile | null;
  loading: boolean;
  userId: string;
  isAdmin: boolean;
  getToken: () => Promise<string | null>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  continueAsGuest: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function requireAuthClient() {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error("Firebase env vars are missing. Add NEXT_PUBLIC_FIREBASE_* values first.");
  }
  return auth;
}

async function upsertUserProfile(user: User) {
  if (user.isAnonymous) return null;
  const db = getFirebaseDb();
  if (!db) return null;
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
  } as AppUserProfile;
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
      setProfile(await upsertUserProfile(result.user));
    }

    async function signUpWithEmailAction(email: string, password: string) {
      const auth = requireAuthClient();
      const result = await createUserWithEmailAndPassword(auth, email, password);
      setProfile(await upsertUserProfile(result.user));
    }

    async function signInWithGoogleAction() {
      const auth = requireAuthClient();
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      setProfile(await upsertUserProfile(result.user));
    }

    async function signOutAction() {
      const auth = requireAuthClient();
      await firebaseSignOut(auth);
      setProfile(null);
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
    continueAsGuest: async () => {
      const auth = requireAuthClient();
      await signInAnonymously(auth);
    },
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
  const snapshot = await getDoc(doc(db, "users", userId));
  return snapshot.exists() && snapshot.data().role === "admin";
}
