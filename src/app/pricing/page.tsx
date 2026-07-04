import Link from "next/link";
import type { Metadata } from "next";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";
import { PricingCalculator } from "@/components/marketing/pricing-calculator";
import { Faq } from "@/components/marketing/faq";

export const metadata: Metadata = {
  title: "Pricing — PondoFlow",
  description:
    "One simple plan: ₱999/company + ₱100/employee per month. 14-day free trial, no credit card.",
};

const included = [
  "Automated semi-monthly payroll runs",
  "SSS, PhilHealth, Pag-IBIG & BIR withholding",
  "Overtime & night differential computation",
  "13th-month pay runs (PD 851)",
  "Shift scheduling with weekly grid",
  "Mobile clock in/out for crew",
  "BIR-friendly printable payslips",
  "Payroll register CSV exports",
  "Employee self-service accounts",
  "Unlimited payroll runs & reports",
];

const addOns = [
  {
    name: "Earned Wage Access",
    price: "₱100 / active employee / month",
    desc: "Let crew withdraw a portion of wages they've already earned before payday. Usage-based, no impact on payroll accuracy or cut-offs.",
    available: true,
  },
  {
    name: "Dedicated onboarding",
    price: "One-time fee",
    desc: "We migrate your employee records and historical data, and train your managers.",
    available: false,
  },
  {
    name: "Custom integrations",
    price: "Contact us",
    desc: "POS, accounting, or bank disbursement integrations tailored to your stack.",
    available: false,
  },
];

export default function PricingPage() {
  return (
    <div className="bg-white text-zinc-900">
      <MarketingNav />

      <section className="relative overflow-hidden px-4 py-16 md:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_40%_at_50%_0%,rgba(16,185,129,0.10),transparent)]"
        />
        <div className="relative mx-auto max-w-6xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            One simple fee.{" "}
            <span className="text-emerald-600">Everything included.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-600">
            No tiers to decode, no per-module upsells. Pay for your team size —
            that&apos;s it.
          </p>
        </div>

        <div className="relative mx-auto mt-12 grid max-w-5xl items-start gap-8 md:grid-cols-2">
          {/* Plan card */}
          <div className="rounded-2xl border-2 border-emerald-600 bg-white p-8 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">PondoFlow Complete</h2>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                14-DAY FREE TRIAL
              </span>
            </div>
            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-5xl font-bold tracking-tight">₱999</span>
              <span className="text-zinc-500">/company/month</span>
            </div>
            <div className="mt-1 text-lg font-medium text-zinc-700">
              + ₱100 <span className="text-sm font-normal text-zinc-500">/active employee/month</span>
            </div>
            <ul className="mt-8 space-y-2.5">
              {included.map((t) => (
                <li key={t} className="flex items-start gap-2 text-sm text-zinc-700">
                  <span className="mt-0.5 text-emerald-600">✓</span> {t}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="mt-8 block rounded-xl bg-emerald-600 py-3.5 text-center text-sm font-bold text-white shadow-md transition-colors hover:bg-emerald-700"
            >
              Start your free trial
            </Link>
            <p className="mt-3 text-center text-xs text-zinc-400">
              No credit card required · Cancel anytime
            </p>
          </div>

          <div className="md:sticky md:top-24">
            <PricingCalculator />
          </div>
        </div>
      </section>

      {/* Add-ons */}
      <section className="bg-zinc-50 px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold tracking-tight">Optional add-ons</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {addOns.map((a) => (
              <div key={a.name} className="rounded-2xl border border-zinc-200 bg-white p-6">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold">{a.name}</h3>
                  {!a.available && (
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-zinc-500">
                      Coming soon
                    </span>
                  )}
                </div>
                <div className="mt-1 text-sm font-medium text-emerald-700">{a.price}</div>
                <p className="mt-3 text-sm text-zinc-500">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ + CTA */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-bold tracking-tight">
            Pricing questions, answered
          </h2>
          <div className="mt-8">
            <Faq />
          </div>
          <div className="mt-16 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-600 px-6 py-12 text-center text-white">
            <h2 className="text-2xl font-bold">Run your first cutoff free.</h2>
            <p className="mt-2 text-emerald-50">
              14 days is enough to onboard your crew and run a real payroll.
            </p>
            <Link
              href="/signup"
              className="mt-6 inline-block rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-emerald-700 shadow-lg transition-transform hover:-translate-y-0.5"
            >
              Create your free account
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
