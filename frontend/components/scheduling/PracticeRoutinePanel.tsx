"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Bell, CalendarClock, CheckCircle2, Sparkles } from "lucide-react";
import { createPracticeSchedule } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { practiceTypes, type PracticeSchedule, type PracticeType } from "@/lib/types";

const frequencyOptions = [
  ["daily", "Daily"],
  ["twice_weekly", "Twice weekly"],
  ["three_times_weekly", "Three times weekly"],
  ["weekdays", "Weekdays"],
  ["custom", "Custom"],
] as const;

const dayOptions = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function PracticeRoutinePanel({ onCreated }: { onCreated?: (schedule: PracticeSchedule) => void }) {
  const { getToken, userId } = useAuth();
  const [frequencyType, setFrequencyType] = useState<PracticeSchedule["frequencyType"]>("daily");
  const [preferredTime, setPreferredTime] = useState("20:00");
  const [durationPreference, setDurationPreference] = useState(10);
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState(15);
  const [categories, setCategories] = useState<PracticeType[]>(["Job Interview", "Difficult Conversation"]);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 3, 5]);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");
  const timezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", []);

  useEffect(() => {
    if (frequencyType === "weekdays") setDaysOfWeek([1, 2, 3, 4, 5]);
    if (frequencyType === "daily") setDaysOfWeek([]);
    if (frequencyType === "twice_weekly") setDaysOfWeek([2, 4]);
    if (frequencyType === "three_times_weekly") setDaysOfWeek([1, 3, 5]);
  }, [frequencyType]);

  function toggleCategory(category: PracticeType) {
    setCategories((current) => current.includes(category) ? current.filter((item) => item !== category) : [...current, category]);
  }

  function toggleDay(index: number) {
    setDaysOfWeek((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index].sort());
  }

  async function requestNotifications() {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setError("");
    try {
      await requestNotifications();
      const token = await getToken();
      const schedule = await createPracticeSchedule({
        userId,
        frequencyType,
        daysOfWeek,
        preferredTime,
        timezone,
        enabled: true,
        categories: categories.length ? categories : ["Job Interview"],
        durationPreference,
        reminderMinutesBefore,
      }, token);
      setStatus("saved");
      onCreated?.(schedule);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Could not create routine.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-[2rem] surface-high p-5 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent-primary)]">
            <CalendarClock size={16} /> Create Practice Routine
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-primary-token">Make pressure training automatic.</h2>
          <p className="mt-2 text-sm font-medium leading-6 text-secondary-token">Set a recurring cognitive gym slot. RehearseAI will prepare a fresh challenge when it is time.</p>
        </div>
        <Sparkles className="hidden text-[var(--accent-primary)] md:block" size={28} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {frequencyOptions.map(([value, label]) => (
          <button key={value} type="button" onClick={() => setFrequencyType(value)} className={`rounded-2xl px-4 py-3 text-sm font-semibold ring-1 transition ${frequencyType === value ? "bg-[#6200a8] text-white ring-[#6200a8]" : "surface-low text-secondary-token ring-[var(--border-soft)]"}`}>
            {label}
          </button>
        ))}
      </div>

      {frequencyType === "custom" && (
        <div className="mt-4 flex flex-wrap gap-2">
          {dayOptions.map((day, index) => (
            <button key={day} type="button" onClick={() => toggleDay(index)} className={`rounded-full px-4 py-2 text-xs font-semibold ring-1 ${daysOfWeek.includes(index) ? "bg-cyan-300 text-slate-950 ring-cyan-300" : "surface-low text-secondary-token ring-[var(--border-soft)]"}`}>
              {day}
            </button>
          ))}
        </div>
      )}

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <label className="text-sm font-semibold text-secondary-token">
          Preferred time
          <input type="time" value={preferredTime} onChange={(event) => setPreferredTime(event.target.value)} className="mt-2 w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-primary)] px-4 py-3 text-primary-token outline-none" />
        </label>
        <label className="text-sm font-semibold text-secondary-token">
          Duration
          <select value={durationPreference} onChange={(event) => setDurationPreference(Number(event.target.value))} className="mt-2 w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-primary)] px-4 py-3 text-primary-token outline-none">
            {[5, 10, 15, 30].map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-secondary-token">
          Reminder
          <select value={reminderMinutesBefore} onChange={(event) => setReminderMinutesBefore(Number(event.target.value))} className="mt-2 w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-primary)] px-4 py-3 text-primary-token outline-none">
            {[0, 5, 15, 30, 60].map((minutes) => <option key={minutes} value={minutes}>{minutes === 0 ? "At start time" : `${minutes} min before`}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-5">
        <div className="text-sm font-semibold text-secondary-token">Training mix</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {practiceTypes.map((category) => (
            <button key={category} type="button" onClick={() => toggleCategory(category)} className={`rounded-full px-4 py-2 text-xs font-semibold ring-1 ${categories.includes(category) ? "bg-violet-500 text-white ring-violet-400" : "surface-low text-secondary-token ring-[var(--border-soft)]"}`}>
              {category}
            </button>
          ))}
        </div>
      </div>

      <button disabled={status === "saving"} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#6200a8] px-5 py-4 font-semibold text-white shadow-[0_18px_42px_rgba(98,0,168,0.24)] disabled:opacity-60">
        {status === "saving" ? "Creating routine..." : "Create routine"} <Bell size={18} />
      </button>
      {status === "saved" && <p className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-500"><CheckCircle2 size={16} /> Routine created. Browser reminders are enabled when this tab is open.</p>}
      {status === "error" && <p className="mt-3 rounded-2xl bg-rose-400/10 px-4 py-3 text-sm font-semibold text-rose-500">{error}</p>}
      <p className="mt-3 text-xs font-medium text-tertiary-token">Timezone: {timezone}. Email and push reminders are wired as backend-ready placeholders for Cloud Scheduler.</p>
    </form>
  );
}
