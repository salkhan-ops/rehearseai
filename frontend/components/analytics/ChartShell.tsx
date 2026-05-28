export function ChartShell({ title, insight, children }: { title: string; insight?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[1.5rem] bg-white p-5 shadow-[0_14px_40px_rgba(35,45,75,0.04)] ring-1 ring-slate-200/75 dark:bg-white/10 dark:ring-white/10">
      <div className="mb-4">
        <h3 className="text-lg font-semibold tracking-[-0.03em] text-slate-900 dark:text-white">{title}</h3>
        {insight && <p className="mt-1 text-sm font-medium text-slate-500 dark:text-white/55">{insight}</p>}
      </div>
      {children}
    </div>
  );
}
