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
        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-[var(--border-soft)] pt-6 sm:flex-row sm:items-center">
          <p className="text-xs font-semibold text-tertiary-token">
            © 2026 RehearseAI. All rights reserved.
          </p>
          {/* Social links */}
          <div className="flex items-center gap-3">
            <a href="https://x.com/rehearseai" target="_blank" rel="noopener noreferrer" aria-label="RehearseAI on X" className="text-tertiary-token transition hover:text-primary-token">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.629 5.905-5.629Zm-1.161 17.52h1.833L7.084 4.126H5.117Z" /></svg>
            </a>
            <a href="https://linkedin.com/company/rehearseai" target="_blank" rel="noopener noreferrer" aria-label="RehearseAI on LinkedIn" className="text-tertiary-token transition hover:text-primary-token">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
            </a>
            <a href="https://instagram.com/rehearseai" target="_blank" rel="noopener noreferrer" aria-label="RehearseAI on Instagram" className="text-tertiary-token transition hover:text-primary-token">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" /></svg>
            </a>
          </div>
          <p className="text-xs font-medium text-tertiary-token">
            Built for pressure. Made for growth.
          </p>
        </div>

      </div>
    </footer>
  );
}
