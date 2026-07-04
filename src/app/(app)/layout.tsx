import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { requireUser, isAdmin } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { logout } from "@/lib/actions/auth-actions";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const company = await prisma.company.findUnique({
    where: { id: user.companyId },
    select: { name: true },
  });
  // Session references a company that no longer exists (e.g. after a DB reset):
  // bounce to login for a fresh session instead of throwing a 500.
  if (!company) redirect("/login");

  const nav = isAdmin(user)
    ? [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/employees", label: "Employees" },
        { href: "/schedule", label: "Schedule" },
        { href: "/time", label: "Time" },
        { href: "/payroll", label: "Payroll" },
        { href: "/reports", label: "Reports" },
        // Billing is owner-only
        ...(user.role === "OWNER" ? [{ href: "/billing", label: "Billing" }] : []),
      ]
    : [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/schedule", label: "Schedule" },
        { href: "/time", label: "Time" },
        { href: "/payslips", label: "Payslips" },
      ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="no-print sticky top-0 z-10 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-lg font-bold tracking-tight">
              Pay<span className="text-emerald-600">volve</span>
            </Link>
            <nav className="hidden items-center gap-1 sm:flex">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-zinc-500 md:inline">
              {company.name}
            </span>
            <form action={logout}>
              <button className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100">
                Sign out
              </button>
            </form>
          </div>
        </div>
        {/* Mobile nav */}
        <nav className="no-print flex items-center gap-1 overflow-x-auto border-t border-zinc-100 px-4 py-1.5 sm:hidden">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
