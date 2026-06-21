import Link from "next/link";
import { BrainCircuit } from "lucide-react";

const columns = [
  {
    heading: "Product",
    links: [
      ["Pricing", "/pricing"],
      ["Blog", "/blog"],
      ["Articles", "/articles"],
      ["Resources", "/resources"],
    ],
  },
  {
    heading: "Support",
    links: [
      ["Contact", "/contact"],
      ["Subscription", "/subscription"],
      ["Refund Policy", "/refund-policy"],
    ],
  },
  {
    heading: "Legal",
    links: [
      ["Terms", "/terms"],
      ["Privacy", "/privacy"],
      ["Cookies", "/cookies"],
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative z-10 px-4 py-12">
      <div className="mx-auto max-w-6xl rounded-[2rem] surface-low p-8 md:p-10">

        {/* Top row */}
        <div className="grid gap-10 md:grid-cols-[1fr_auto]">

          {/* Brand */}
          <div className="max-w-xs">
            <Link href="/" className="inline-flex items-center gap-2.5 text-lg font-semibold tracking-[0.16em] text-primary-token">
              <BrainCircuit size={22} /> REHEARSEAI
            </Link>
            <p className="mt-3 text-sm font-medium leading-6 text-secondary-token">
              A voice-first cognitive performance environment for high-stakes communication.
            </p>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-3 gap-8 sm:gap-12">
            {columns.map(({ heading, links }) => (
              <div key={heading}>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-tertiary-token">
                  {heading}
                </p>
                <ul className="space-y-2.5">
                  {links.map(([label, href]) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className="text-sm font-medium text-secondary-token transition hover:text-[var(--accent-primary)]"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Divider + copyright */}
        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-[var(--border-soft)] pt-6 sm:flex-row sm:items-center">
          <p className="text-xs font-semibold text-tertiary-token">
            © 2026 RehearseAI. All rights reserved.
          </p>
          <p className="text-xs font-medium text-tertiary-token">
            Built for pressure. Made for growth.
          </p>
        </div>

      </div>
    </footer>
  );
}
