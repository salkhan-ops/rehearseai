"use client";

export function AdminTable({ headers, rows, empty = "No records found." }: { headers: string[]; rows: React.ReactNode[][]; empty?: string }) {
  return (
    <div className="overflow-hidden rounded-[1.25rem] bg-white shadow-[0_14px_38px_rgba(35,45,75,0.045)] ring-1 ring-slate-200/75">
      <div className="hidden grid-cols-[repeat(var(--cols),minmax(0,1fr))] bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-500 md:grid" style={{ "--cols": headers.length } as React.CSSProperties}>
        {headers.map((header) => <div key={header}>{header}</div>)}
      </div>
      {rows.length ? rows.map((row, index) => (
        <div key={index} className="grid gap-3 border-t border-slate-100 p-4 md:items-center" style={{ gridTemplateColumns: `repeat(${headers.length}, minmax(0, 1fr))` }}>
          {row.map((cell, cellIndex) => <div key={cellIndex}>{cell}</div>)}
        </div>
      )) : <div className="p-8 text-center font-semibold text-slate-500">{empty}</div>}
    </div>
  );
}
