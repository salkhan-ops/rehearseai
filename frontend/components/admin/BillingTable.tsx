"use client";

export function BillingTable() {
  const rows = [
    ["Pending checkouts", "billing_checkouts", "Placeholder for Paddle checkout attempts"],
    ["Subscriptions", "billing_subscriptions", "Paddle subscription status and periods"],
    ["Customers", "billing_customers", "User to Paddle customer mapping"],
    ["Failed payments", "future", "Manual review placeholder"],
  ];
  return (
    <div className="overflow-hidden rounded-[1.25rem] bg-white shadow-[0_14px_38px_rgba(35,45,75,0.045)] ring-1 ring-slate-200/75">
      {rows.map(([name, collection, detail]) => (
        <div key={name} className="grid gap-2 border-b border-slate-100 p-4 last:border-0 md:grid-cols-[1fr_1fr_2fr]">
          <div className="font-semibold text-slate-900">{name}</div>
          <div className="text-sm font-semibold text-[#476bff]">{collection}</div>
          <div className="text-sm font-medium text-slate-500">{detail}</div>
        </div>
      ))}
    </div>
  );
}
