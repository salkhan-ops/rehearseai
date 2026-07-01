"use client";

import { initializePaddle, type Paddle } from "@paddle/paddle-js";

let paddleInstance: Paddle | undefined;

export async function getPaddle(): Promise<Paddle | undefined> {
  if (paddleInstance) return paddleInstance;
  if (typeof window === "undefined") return undefined;
  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
  if (!token) return undefined;
  paddleInstance = await initializePaddle({
    environment: (process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT as "sandbox" | "production") || "sandbox",
    token,
    eventCallback(event) {
      if (event.name === "checkout.completed") {
        window.dispatchEvent(new CustomEvent("paddle:payment-complete", { detail: event.data }));
      }
      if (event.name === "checkout.closed") {
        window.dispatchEvent(new CustomEvent("paddle:checkout-closed"));
      }
    },
  });
  return paddleInstance;
}

export async function openCheckout(priceId: string, uid?: string, customerEmail?: string): Promise<boolean> {
  const paddle = await getPaddle();
  if (!paddle || !priceId) return false;
  console.log("[Paddle] opening checkout", { priceId, uid, customerEmail, env: process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT });
  paddle.Checkout.open({
    items: [{ priceId, quantity: 1 }],
    ...(customerEmail ? { customer: { email: customerEmail } } : {}),
    // Only pass customData when we have a real authenticated user ID
    ...(uid && uid !== "guest" ? { customData: { uid } } : {}),
    settings: { displayMode: "overlay", theme: "dark" },
  });
  return true;
}
