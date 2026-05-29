export function ChartShell({ title, insight, children }: { title: string; insight?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[1.5rem] surface-low p-5">
      <div className="mb-4">
        <h3 className="text-lg font-semibold tracking-[-0.03em] text-primary-token">{title}</h3>
        {insight && <p className="mt-1 text-sm font-medium text-secondary-token">{insight}</p>}
      </div>
      {children}
    </div>
  );
}
