import type { TrendPoint } from "./types";
import { daysAgo } from "./dateUtils";

/** Tiny deterministic hash so mock trends are stable across renders/refreshes without a random seed. */
function hash(seed: string, i: number): number {
  let h = 0;
  const s = `${seed}:${i}`;
  for (let idx = 0; idx < s.length; idx++) h = (h * 31 + s.charCodeAt(idx)) >>> 0;
  return (h % 1000) / 1000; // 0..1
}

/**
 * Deterministic-but-organic-looking trend line for mock data (Meta Ads / GA4 / Pixel),
 * centered on `base` with a sine drift plus small per-day jitter, bounded by `amplitude`
 * (fraction of `base`, e.g. 0.3 = wanders +/-30%).
 */
export function buildWave(days: number, base: number, amplitude: number, seedKey: string): TrendPoint[] {
  const from = daysAgo(days - 1);
  const points: TrendPoint[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    const drift = Math.sin((i / days) * Math.PI * 2 + hash(seedKey, 0) * 10) * amplitude;
    const jitter = (hash(seedKey, i) - 0.5) * amplitude * 0.6;
    const value = Math.max(0, base * (1 + drift + jitter));
    points.push({ date: d.toISOString().slice(5, 10), value: Math.round(value * 100) / 100 });
  }
  return points;
}
