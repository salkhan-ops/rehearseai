"use client";

export function AdminSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-3 px-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{title}</h2>
      <div className="grid gap-3">{children}</div>
    </section>
  );
}
