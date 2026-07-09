"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { openCheckout } from "@/lib/paddle";
import { track } from "@/lib/analytics";
import { trackInitiateCheckout, trackPurchase } from "@/lib/metaPixel";

type PaddleCompletionData = {
  id?: string;
  transaction_id?: string;
  currency_code?: string;
  totals?: { total?: string | number; currency_code?: string };
};

function paddlePurchase(data?: PaddleCompletionData) {
  if (!data) return null;
  const currency = data.currency_code || data.totals?.currency_code || "USD";
  const minorAmount = Number(data.totals?.total);
  if (!Number.isFinite(minorAmount)) return null;
  const zeroDecimal = new Set(["JPY", "KRW", "VND"]);
  return {
    value: zeroDecimal.has(currency.toUpperCase()) ? minorAmount : minorAmount / 100,
    currency,
    transactionId: data.transaction_id || data.id,
  };
}

interface Props {
  priceId?: string;
  fallbackHref?: string;
  label?: string;
  className?: string;
  onCompleted?: (data?: PaddleCompletionData) => void;
  children: React.ReactNode;
}

export function PaddleCheckoutButton({ priceId, fallbackHref = "/contact", label, className, onCompleted, children }: Props) {
  const { user, userId } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const pendingEventId = useRef<string | null>(null);

  useEffect(() => {
    function resolveEvent(outcome: "completed" | "abandoned") {
      const id = pendingEventId.current;
      if (!id) return null;
      pendingEventId.current = null;
      const db = getFirebaseDb();
      if (db) updateDoc(doc(db, "checkoutEvents", id), { outcome }).catch(() => undefined);
      return id;
    }
    const onComplete = (event: Event) => {
      if (!resolveEvent("completed")) return;
      const data = (event as CustomEvent<PaddleCompletionData>).detail;
      track.checkoutCompleted(priceId ?? "");
      const purchase = paddlePurchase(data);
      track.purchaseCompleted(priceId ?? "", purchase?.value);
      if (purchase) trackPurchase(purchase.value, purchase.currency, purchase.transactionId);
      onCompleted?.(data);
    };
    const onClosed = () => resolveEvent("abandoned");
    window.addEventListener("paddle:payment-complete", onComplete);
    window.addEventListener("paddle:checkout-closed", onClosed);
    return () => {
      window.removeEventListener("paddle:payment-complete", onComplete);
      window.removeEventListener("paddle:checkout-closed", onClosed);
    };
  }, [onCompleted, priceId]);

  if (process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "false") {
    return (
      <button type="button" disabled className={className} title="Paid plans coming soon">
        Coming soon
      </button>
    );
  }

  // Not logged in — open the auth dialog in-place so the user never leaves the
  // pricing page. After signing in, they click upgrade again to open checkout.
  if (!user) {
    return (
      <button
        type="button"
        className={className}
        onClick={() => window.dispatchEvent(new CustomEvent("rehearseai:auth", { detail: "signup" }))}
      >
        {children}
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
    track.checkoutInitiated(priceId ?? "", label ?? "");
    pendingEventId.current = `local-${Date.now()}`;
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
    if (launched) trackInitiateCheckout({ content_ids: priceId!, content_name: label || "RehearseAI checkout" });
    if (!launched) {
      pendingEventId.current = null;
      router.push(fallbackHref);
    }
    setLoading(false);
  }

  return (
    <button type="button" onClick={handleClick} disabled={loading} className={className}>
      {loading ? "Loading checkout…" : children}
    </button>
  );
}
