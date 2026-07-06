import type { TrendPoint } from "./types";

export function parseIso(value: unknown): Date | null {
  if (typeof value !== "string" || !value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function daysAgo(n: number): Date {
  const d = startOfDay(new Date());
  d.setDate(d.getDate() - n);
  return d;
}

export function startOfWeek(): Date {
  const d = startOfDay(new Date());
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1; // week starts Monday
  d.setDate(d.getDate() - diff);
  return d;
}

export function startOfMonth(): Date {
  const d = startOfDay(new Date());
  d.setDate(1);
  return d;
}

/** Buckets a list of ISO date strings into a daily trend line for the last `days` days. */
export function buildDailyTrend(isoDates: (string | undefined | null)[], days: number): TrendPoint[] {
  const buckets = new Map<string, number>();
  const from = daysAgo(days - 1);
  for (let i = 0; i < days; i++) {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const iso of isoDates) {
    const parsed = parseIso(iso);
    if (!parsed || parsed < from) continue;
    const key = startOfDay(parsed).toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) || 0) + 1);
  }
  return Array.from(buckets.entries()).map(([date, value]) => ({ date: date.slice(5), value }));
}

export function buildDailySumTrend(entries: { date: string | undefined | null; amount: number }[], days: number): TrendPoint[] {
  const buckets = new Map<string, number>();
  const from = daysAgo(days - 1);
  for (let i = 0; i < days; i++) {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const entry of entries) {
    const parsed = parseIso(entry.date);
    if (!parsed || parsed < from) continue;
    const key = startOfDay(parsed).toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) || 0) + entry.amount);
  }
  return Array.from(buckets.entries()).map(([date, value]) => ({ date: date.slice(5), value: Math.round(value * 100) / 100 }));
}
