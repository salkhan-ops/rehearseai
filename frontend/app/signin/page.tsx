"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Nav } from "@/components/Nav";
import { useAuth } from "@/lib/auth";

export default function SignInPage() {
  const router = useRouter();
  const { continueAsGuest, signInEmail, signInGoogle, signUpEmail, user, logout } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email"));
    const password = String(data.get("password"));
    try {
      if (mode === "signin") {
        await signInEmail(email, password);
      } else {
        await signUpEmail(email, password);
      }
      router.push("/practice");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  async function run(action: () => Promise<void>) {
    setError("");
    setLoading(true);
    try {
      await action();
      router.push("/practice");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <Nav />
      <section className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-[2rem] bg-white p-6 shadow-soft ring-1 ring-black/5">
          <h1 className="text-3xl font-black">Sign in</h1>
          <p className="mt-3 text-black/60">Use Firebase Auth to save sessions to your account. Guest mode signs in anonymously.</p>
          {user && (
            <div className="mt-4 rounded-2xl bg-mist p-4 text-sm">
              Signed in as <span className="font-bold">{user.email || user.uid}</span>
              <button onClick={() => run(logout)} className="mt-3 w-full rounded-full bg-white px-4 py-2 font-bold">Sign out</button>
            </div>
          )}
          <form onSubmit={handleEmail} className="mt-6 space-y-3">
            <input name="email" type="email" required placeholder="Email" className="w-full rounded-2xl border border-black/10 px-4 py-3" />
            <input name="password" type="password" required minLength={6} placeholder="Password" className="w-full rounded-2xl border border-black/10 px-4 py-3" />
            <button disabled={loading} className="w-full rounded-full bg-ink px-5 py-3 font-bold text-white disabled:opacity-60">
              {loading ? "Working..." : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
          <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="mt-3 w-full rounded-full bg-mist px-5 py-3 font-bold">
            {mode === "signin" ? "Create a new account" : "I already have an account"}
          </button>
          <button onClick={() => run(signInGoogle)} disabled={loading} className="mt-3 w-full rounded-full bg-mist px-5 py-3 font-bold">Continue with Google</button>
          <button onClick={() => run(continueAsGuest)} disabled={loading} className="mt-3 w-full rounded-full bg-white px-5 py-3 font-bold ring-1 ring-black/10">Continue as guest</button>
          {error && <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
        </div>
      </section>
    </main>
  );
}
