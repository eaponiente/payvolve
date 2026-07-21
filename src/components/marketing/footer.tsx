import Link from "next/link";

const columns: { heading: string; links: { href: string; label: string }[] }[] = [
  {
    heading: "Product",
    links: [
      { href: "/#features", label: "Features" },
      { href: "/pricing", label: "Pricing" },
      { href: "/#calculator", label: "Net pay calculator" },
      { href: "/signup", label: "Start free trial" },
      { href: "/login", label: "Sign in" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About us" },
      { href: "/#contact", label: "Contact us" },
      { href: "/#faq", label: "FAQ" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { href: "/privacy-policy", label: "Privacy policy" },
      { href: "/privacy-notice", label: "Privacy notice" },
      { href: "/terms", label: "Terms of service" },
    ],
  },
  {
    heading: "Compliance",
    links: [
      { href: "https://www.sss.gov.ph", label: "SSS" },
      { href: "https://www.philhealth.gov.ph", label: "PhilHealth" },
      { href: "https://www.pagibigfund.gov.ph", label: "Pag-IBIG Fund" },
      { href: "https://www.bir.gov.ph", label: "BIR" },
      { href: "https://www.dole.gov.ph", label: "DOLE" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <div className="text-lg font-bold tracking-tight">
              Pondo<span className="text-emerald-600">Flow</span>
            </div>
            <p className="mt-2 text-sm text-zinc-500">
              Payroll, attendance, and scheduling built for Philippine teams.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.heading}>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                {col.heading}
              </h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    {l.href.startsWith("http") ? (
                      <a
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-zinc-600 hover:text-emerald-700 hover:underline"
                      >
                        {l.label} ↗
                      </a>
                    ) : (
                      <Link
                        href={l.href}
                        className="text-sm text-zinc-600 hover:text-emerald-700 hover:underline"
                      >
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-start justify-between gap-2 border-t border-zinc-200 pt-6 text-xs text-zinc-400 sm:flex-row">
          <p>© {new Date().getFullYear()} PondoFlow. All rights reserved.</p>
          <p>🔒 Government IDs encrypted at rest · Made for Philippine businesses 🇵🇭</p>
        </div>
      </div>
    </footer>
  );
}
