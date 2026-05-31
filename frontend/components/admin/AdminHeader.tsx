export function AdminHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
      <div>
        <h1 className="text-3xl font-semibold tracking-[-0.04em]">{title}</h1>
        {subtitle && <p className="mt-1 font-medium text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
