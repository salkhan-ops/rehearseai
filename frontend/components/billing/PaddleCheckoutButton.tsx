"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { openCheckout } from "@/lib/paddle";

interface Props {
  priceId?: string;
  fallbackHref?: string;
  className?: string;
  children: React.ReactNode;
}

export function PaddleCheckoutButton({ priceId, fallbackHref = "/contact", className, children }: Props) {
  const { user, userId } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!priceId) {
    return (
      <Link href={fallbackHref} className={className}>
        {children}
      </Link>
    );
  }

  async function handleClick() {
    setLoading(true);
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
