"use client";

export const META_PIXEL_ID = "902065715540084";

export type MetaPixelParams = Record<string, string | number | boolean | undefined>;

type MetaPixelOptions = { eventID?: string };

interface MetaPixelFunction {
  (command: "init", pixelId: string): void;
  (command: "track", eventName: string, params?: MetaPixelParams, options?: MetaPixelOptions): void;
  (command: "trackCustom", eventName: string, params?: MetaPixelParams): void;
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[][];
  loaded?: boolean;
  version?: string;
  push?: MetaPixelFunction;
}

declare global {
  interface Window {
    fbq?: MetaPixelFunction;
    _fbq?: MetaPixelFunction;
  }
}

let lastPageKey = "";
const pendingEvents: Array<(pixel: MetaPixelFunction) => void> = [];

function fbq() {
  return typeof window === "undefined" ? undefined : window.fbq;
}

function send(event: (pixel: MetaPixelFunction) => void) {
  const pixel = fbq();
  if (pixel) event(pixel);
  else if (typeof window !== "undefined") pendingEvents.push(event);
}

export function flushMetaPixelQueue() {
  const pixel = fbq();
  if (!pixel) return;
  pendingEvents.splice(0).forEach((event) => event(pixel));
}

export function pageview(pageKey = typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : "") {
  if (typeof window === "undefined" || !window.fbq || !pageKey || pageKey === lastPageKey) return;
  lastPageKey = pageKey;
  window.fbq("track", "PageView");
}

export function trackLead() {
  send((pixel) => pixel("track", "Lead"));
}

export function trackCompleteRegistration() {
  send((pixel) => pixel("track", "CompleteRegistration"));
}

export function trackInitiateCheckout(params: MetaPixelParams = {}) {
  send((pixel) => pixel("track", "InitiateCheckout", params));
}

export function trackPurchase(value: number, currency: string, transactionId?: string) {
  send((pixel) => pixel("track", "Purchase", { value, currency }, transactionId ? { eventID: transactionId } : undefined));
}

export function trackCustom(eventName: string, params: MetaPixelParams = {}) {
  send((pixel) => pixel("trackCustom", eventName, params));
}
