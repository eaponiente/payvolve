"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const links = [
  { href: "/#calculator", label: "Calculator" },
  { href: "/#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/#contact", label: "Contact" },
  { href: "/#faq", label: "FAQ" },
];

export function MarketingNav() {
  const [open, setOpen] = useState(false);

  // Close the mobile menu on Escape for keyboard users.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/60 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight"
          onClick={() => setOpen(false)}
        >
          Pondo<span className="text-emerald-600">Flow</span>
        </Link>

        {/* Desktop links — only share the row once there's room (≥ lg). */}
        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Desktop auth cluster. */}
        <div className="hidden items-center gap-2 lg:flex">
          <Link
            href="/login"
            className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            Start free trial
          </Link>
        </div>

        {/* Mobile hamburger toggle (< lg). */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          className="inline-flex items-center justify-center rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 lg:hidden"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile dropdown panel — all links + auth, no cramming. */}
      {open && (
        <nav
          id="mobile-menu"
          className="border-t border-zinc-200/60 bg-white px-4 py-3 lg:hidden"
        >
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                {l.label}
              </Link>
            ))}
            <div className="my-2 border-t border-zinc-200/60" />
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
            >
              Start free trial
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
