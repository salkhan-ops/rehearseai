"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { openCheckout } from "@/lib/paddle";

interface Props {
  priceId?: string;
  fallbackHref?: string;
  label?: string;
  className?: string;
  children: React.ReactNode;
}

export function PaddleCheckoutButton({ priceId, fallbackHref = "/contact", label, className, children }: Props) {
  const { user, userId } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const pendingEventId = useRef<string | null>(null);

  useEffect(() => {
    function resolveEvent(outcome: "completed" | "abandoned") {
      const id = pendingEventId.current;
      if (!id) return;
      pendingEventId.current = null;
      const db = getFirebaseDb();
      if (!db) return;
      updateDoc(doc(db, "checkoutEvents", id), { outcome }).catch(() => undefined);
    }
    const onComplete = () => resolveEvent("completed");
    const onClosed = () => resolveEvent("abandoned");
    window.addEventListener("paddle:payment-complete", onComplete);
    window.addEventListener("paddle:checkout-closed", onClosed);
    return () => {
      window.removeEventListener("paddle:payment-complete", onComplete);
      window.removeEventListener("paddle:checkout-closed", onClosed);
    };
  }, []);

  if (process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "false") {
    return (
      <button type="button" disabled className={className} title="Paid plans coming soon">
        Coming soon
      </button>
    );
  }

  if (!priceId) {
    return (
      <Link href={fallbackHref} className={className}>
        {children}
      </Link>
    );
  }

  async function handleClick() {
    setLoading(true);
    try {
      const db = getFirebaseDb();
      if (db) {
        const ref = await addDoc(collection(db, "checkoutEvents"), {
          uid: userId || "guest",
          email: user?.email ?? null,
          priceId,
          label: label ?? null,
          initiatedAt: serverTimestamp(),
          outcome: "initiated",
        });
        pendingEventId.current = ref.id;
      }
    } catch {
      // non-fatal — don't block checkout
    }
    const launched = await openCheckout(priceId!, userId ?? undefined, user?.email ?? undefined);
    if (!launched) router.push(fallbackHref);
    setLoading(false);
  }

  return (
    <button type="button" onClick={handleClick} disabled={loading} className={className}>
      {loading ? "Loading checkout…" : children}
    </button>
  );
}
