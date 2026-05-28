"use client";

import {
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut
} from "firebase/auth";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getFirebaseAuth } from "./firebase";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  userId: string;
  getToken: () => Promise<string | null>;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return undefined;
    }
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
  }, []);

  function requireAuthClient() {
    const auth = getFirebaseAuth();
    if (!auth) {
      throw new Error("Firebase env vars are missing. Add NEXT_PUBLIC_FIREBASE_* values first.");
    }
    return auth;
  }

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    userId: user?.uid || "guest",
    getToken: async () => user?.getIdToken() || null,
    signInEmail: async (email, password) => {
      const auth = requireAuthClient();
      await signInWithEmailAndPassword(auth, email, password);
    },
    signUpEmail: async (email, password) => {
      const auth = requireAuthClient();
      await createUserWithEmailAndPassword(auth, email, password);
    },
    signInGoogle: async () => {
      const auth = requireAuthClient();
      await signInWithPopup(auth, new GoogleAuthProvider());
    },
    continueAsGuest: async () => {
      const auth = requireAuthClient();
      await signInAnonymously(auth);
    },
    logout: async () => {
      const auth = requireAuthClient();
      await signOut(auth);
    }
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
