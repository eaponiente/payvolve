import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "Guide · PondoFlow",
};

type Section = {
  title: string;
  intro: string;
  items: { q: string; a: string }[];
};

const sections: Section[] = [
  {
    title: "Getting started",
    intro: "The basics of setting up your company on PondoFlow.",
    items: [
      {
        q: "How do I add my employees?",
        a: "Go to Employees → Add employee. Enter their name, position, hire date, pay type (Monthly, Daily, or Hourly) and base rate. You can optionally give them a login (email + password) so they can clock in and view their own payslips. Government IDs (TIN, SSS, PhilHealth, Pag-IBIG) are stored encrypted.",
      },
      {
        q: "What are the different roles?",
        a: "Owner has full access including Billing. Admin can manage employees, schedules, time entries and payroll. Employee can only see their own dashboard, schedule, time clock and payslips.",
      },
      {
        q: "How do I deactivate someone who left?",
        a: "Open the employee and untick Active, then save. Deactivating blocks their login, closes any open time entry, and removes their future scheduled shifts. Their past payslips and records are kept for your history.",
      },
    ],
  },
  {
    title: "Scheduling & time",
    intro: "Plan shifts and track worked hours.",
    items: [
      {
        q: "How does scheduling work?",
        a: "Under Schedule you assign shifts to employees for a Monday–Sunday week. Employees see their upcoming shifts on their own Schedule page.",
      },
      {
        q: "How do employees clock in and out?",
        a: "Employees open Time on their phone browser and tap Clock in / Clock out. Each person can only have one open (clocked-in) entry at a time. Admins can also add or correct entries manually from the Time page.",
      },
      {
        q: "What about overtime and night differential?",
        a: "Overtime (125%) and night differential (+10% for hours between 10 PM and 6 AM) are computed automatically from the clock in/out times when you run payroll — you don't enter them by hand.",
      },
    ],
  },
  {
    title: "Payroll",
    intro: "Turn time entries into payslips.",
    items: [
      {
        q: "How do I run payroll?",
        a: "Go to Payroll → New run, pick the run type and cutoff dates (semi-monthly by default), and PondoFlow computes every active employee's pay — basic pay, overtime, night differential, SSS/PhilHealth/Pag-IBIG deductions, and withholding tax. You get a draft you can review.",
      },
      {
        q: "What does Recompute do?",
        a: "While a run is still a draft, Recompute rebuilds the payslips from the latest time entries and rates — use it after correcting a time entry or changing a rate.",
      },
      {
        q: "What happens when I Finalize?",
        a: "Finalizing locks the run and makes payslips visible to employees. It cannot be undone, so you'll be asked to confirm. Only one run can cover a given period per run type.",
      },
      {
        q: "Does it handle 13th-month pay?",
        a: "Yes. Create a 13th-month run and PondoFlow computes 1/12 of each employee's basic salary earned within the calendar year from your finalized regular runs, tax-exempt up to the ₱90,000 cap.",
      },
      {
        q: "Can I export for my accountant or the BIR?",
        a: "Every finalized run has a downloadable payroll register (CSV) under Reports, with per-employee gross pay, government shares, withholding tax and net pay.",
      },
    ],
  },
  {
    title: "Billing",
    intro: "Your subscription and how to keep the product unlocked.",
    items: [
      {
        q: "How much does it cost?",
        a: "₱800 per company per month plus ₱100 per active employee, with an optional Earned Wage Access add-on. Every company starts with a 30-day free trial — no card required.",
      },
      {
        q: "What happens if my subscription lapses?",
        a: "Scheduling and payroll lock, and time tracking becomes read-only. Your data is safe. An owner can reactivate from the Billing page to unlock everything again.",
      },
    ],
  },
];

export default function GuidePage() {
  return (
    <>
      <PageHeader
        title="Guide"
        subtitle="How to get the most out of PondoFlow"
      />
      <div className="space-y-8">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-semibold tracking-tight">{section.title}</h2>
            <p className="mt-1 text-sm text-zinc-500">{section.intro}</p>
            <div className="mt-3 space-y-3">
              {section.items.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-xl border border-zinc-200 bg-white open:border-emerald-300 open:shadow-sm"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-zinc-800 [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <span className="text-lg text-emerald-600 transition-transform duration-200 group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="px-5 pb-5 text-sm leading-relaxed text-zinc-600">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
