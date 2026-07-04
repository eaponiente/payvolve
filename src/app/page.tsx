import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";
import { NetPayCalculator } from "@/components/marketing/net-pay-calculator";
import { PricingCalculator } from "@/components/marketing/pricing-calculator";
import { Faq } from "@/components/marketing/faq";
import { ContactForm } from "@/components/marketing/contact-form";

const features = [
  {
    icon: "🧮",
    title: "DOLE-ready payroll",
    desc: "SSS, PhilHealth, Pag-IBIG, and BIR withholding computed automatically — plus overtime, night differential, and 13th-month pay.",
  },
  {
    icon: "📱",
    title: "Mobile time clock",
    desc: "Crew clock in and out from any phone. Overnight closing shifts roll to the next day correctly — built for F&B.",
  },
  {
    icon: "🗓️",
    title: "Shift scheduling",
    desc: "Plan the week on a drag-simple grid. Everyone sees their shifts on their phone — no more group-chat schedules.",
  },
  {
    icon: "🧾",
    title: "BIR-friendly payslips",
    desc: "Clean printable payslips with the full earnings and deductions breakdown. Employees access their own anytime.",
  },
  {
    icon: "📊",
    title: "One-click reports",
    desc: "Export the payroll register as CSV per cutoff — gross, government shares, tax, and net per employee.",
  },
  {
    icon: "🔒",
    title: "Role-based access",
    desc: "Owners run payroll and billing, managers handle schedules and timesheets, crew see only their own data.",
  },
];

const steps = [
  {
    n: "1",
    title: "Add your crew",
    desc: "Names, rates (monthly, daily, or hourly), and government IDs. Give crew a login in one tap.",
  },
  {
    n: "2",
    title: "Let time tracking run",
    desc: "Crew clock in/out on their phones. Managers fix entries and plan next week's shifts.",
  },
  {
    n: "3",
    title: "Run payroll in minutes",
    desc: "Pick the cutoff, review the computed draft, finalize. Payslips go to your crew instantly.",
  },
];

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="bg-white text-zinc-900">
      <MarketingNav />

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_70%_10%,rgba(16,185,129,0.14),transparent),radial-gradient(40%_40%_at_10%_80%,rgba(16,185,129,0.08),transparent)]"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 md:grid-cols-2 md:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              🇵🇭 Built for Philippine businesses
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Payroll day,{" "}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                minus the all-nighter
              </span>
              .
            </h1>
            <p className="mt-5 max-w-md text-lg text-zinc-600">
              Schedules, time tracking, and DOLE-compliant payroll in one app.
              SSS, PhilHealth, Pag-IBIG, and BIR tax — computed for you, every
              cutoff.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/signup"
                className="rounded-xl bg-emerald-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-700"
              >
                Start free — 14 days
              </Link>
              <Link
                href="/#calculator"
                className="rounded-xl border border-zinc-300 px-6 py-3.5 text-base font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                Try the calculator ↓
              </Link>
            </div>
            <p className="mt-4 text-sm text-zinc-400">
              No credit card · Cancel anytime · Set up in minutes
            </p>
          </div>

          {/* Payslip mock */}
          <div className="relative mx-auto w-full max-w-sm">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-emerald-200/60 to-teal-100/40 blur-2xl" />
            <div className="relative rotate-1 rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl transition-transform duration-300 hover:rotate-0">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                <div>
                  <div className="text-sm font-bold">Kanto Kitchen Inc.</div>
                  <div className="text-xs text-zinc-400">Payslip · Jun 16–30</div>
                </div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                  Paid ✓
                </span>
              </div>
              <div className="space-y-2 py-4 text-sm">
                {[
                  ["Basic pay", "₱12,500.00"],
                  ["Overtime (125%)", "₱1,250.00"],
                  ["Night diff (10%)", "₱200.00"],
                  ["SSS · PhilHealth · Pag-IBIG", "−₱1,037.50"],
                  ["Withholding tax", "−₱182.33"],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between">
                    <span className="text-zinc-500">{l}</span>
                    <span
                      className={`tabular-nums ${v.startsWith("−") ? "text-red-500" : ""}`}
                    >
                      {v}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between rounded-xl bg-emerald-600 px-4 py-3 text-white">
                <span className="text-sm font-semibold">Net pay</span>
                <span className="text-lg font-bold tabular-nums">₱12,730.17</span>
              </div>
            </div>
          </div>
        </div>

        {/* Compliance strip */}
        <div className="relative border-y border-zinc-100 bg-zinc-50/60">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 py-4 text-sm font-medium text-zinc-400">
            <span>Computes for:</span>
            {["SSS 2025", "PhilHealth 5%", "Pag-IBIG", "BIR TRAIN", "13th Month · PD 851", "OT & Night Diff"].map(
              (t) => (
                <span key={t} className="text-zinc-600">
                  {t}
                </span>
              ),
            )}
          </div>
        </div>
      </section>

      {/* ── Interactive calculator ───────────────────── */}
      <section id="calculator" className="scroll-mt-20 px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              See a real PH payslip — right now
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-zinc-600">
              Drag the slider. This is the exact engine that runs PondoFlow
              payroll — not a marketing estimate.
            </p>
          </div>
          <div className="mt-10">
            <NetPayCalculator />
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────── */}
      <section id="features" className="scroll-mt-20 bg-zinc-50 px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            Everything between “hired” and “paid”
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-zinc-200 bg-white p-6 transition-all hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg"
              >
                <div className="text-2xl">{f.icon}</div>
                <h3 className="mt-3 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────── */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            Live in an afternoon
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="relative rounded-2xl border border-zinc-200 p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 font-bold text-white">
                  {s.n}
                </div>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-zinc-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing preview ──────────────────────────── */}
      <section className="bg-zinc-50 px-4 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              One plan. No tiers, no surprises.
            </h2>
            <p className="mt-4 text-lg text-zinc-600">
              <span className="font-bold text-zinc-900">₱999</span>/company +{" "}
              <span className="font-bold text-zinc-900">₱100</span>/employee per
              month. Everything included — payroll, scheduling, time tracking,
              payslips, and reports.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-zinc-600">
              {[
                "14-day free trial, no credit card",
                "Unlimited payroll runs & reports",
                "All government tables kept current",
                "Cancel anytime",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="text-emerald-600">✓</span> {t}
                </li>
              ))}
            </ul>
            <Link
              href="/pricing"
              className="mt-6 inline-block text-sm font-semibold text-emerald-700 hover:underline"
            >
              See full pricing details →
            </Link>
          </div>
          <PricingCalculator />
        </div>
      </section>

      {/* ── Big CTA ──────────────────────────────────── */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-600 px-6 py-16 text-center text-white shadow-xl">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Your next cutoff could compute itself.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-emerald-50">
            Join Philippine teams running payroll in minutes, not weekends.
            Free for 14 days — long enough to run a real cutoff.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-block rounded-xl bg-white px-8 py-4 text-base font-bold text-emerald-700 shadow-lg transition-transform hover:-translate-y-0.5"
          >
            Create your free account
          </Link>
          <p className="mt-3 text-xs text-emerald-100/80">
            Takes about 60 seconds. Seriously.
          </p>
        </div>
      </section>

      {/* ── Contact ──────────────────────────────────── */}
      <section id="contact" className="scroll-mt-20 bg-zinc-50 px-4 py-20">
        <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Contact us</h2>
            <p className="mt-3 max-w-md text-zinc-600">
              Questions about migrating from spreadsheets, multiple branches, or
              a demo for your team? We reply within one business day.
            </p>
            <div className="mt-8 space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-lg">
                  ✉️
                </span>
                <div>
                  <div className="font-medium">Email</div>
                  <a
                    href="mailto:pondoflow@gmail.com"
                    className="text-zinc-500 hover:text-emerald-700"
                  >
                    pondoflow@gmail.com
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-lg">
                  📍
                </span>
                <div>
                  <div className="font-medium">Office</div>
                  <div className="text-zinc-500">Davao City</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-lg">
                  🕐
                </span>
                <div>
                  <div className="font-medium">Hours</div>
                  <div className="text-zinc-500">Mon–Fri, 9 AM–6 PM PHT</div>
                </div>
              </div>
            </div>
          </div>
          <ContactForm />
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────── */}
      <section id="faq" className="scroll-mt-20 px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            Frequently asked questions
          </h2>
          <p className="mt-3 text-center text-zinc-600">
            Can&apos;t find your answer?{" "}
            <a href="#contact" className="font-medium text-emerald-700 hover:underline">
              Talk to us
            </a>
            .
          </p>
          <div className="mt-10">
            <Faq />
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
