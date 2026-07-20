const faqs = [
  {
    q: "Is PondoFlow compliant with Philippine payroll regulations?",
    a: "Yes. Payroll runs use the current SSS 2025 contribution table, PhilHealth 5% premium, Pag-IBIG contributions, and the BIR TRAIN withholding tax table. Overtime (125%), night differential (+10%, 10 PM–6 AM), and 13th-month pay under PD 851 are computed automatically, and payslips are BIR-friendly.",
  },
  {
    q: "How much does PondoFlow cost?",
    a: "One simple plan: ₱800 per company per month plus ₱100 per active employee. The optional Earned Wage Access add-on is ₱100 per employee. Every company starts with a 30-day free trial — no credit card required.",
  },
  {
    q: "How do I pay for my subscription?",
    a: "For now, payment is by bank transfer or GCash only — card and automatic billing are coming later. Start your 30-day free trial with no payment up front; when it ends, we'll send you the payment details and activate your plan as soon as we receive it.",
  },
  {
    q: "Can my employees clock in and out from their phones?",
    a: "Yes. PondoFlow is mobile-first — crew log in on any phone browser to clock in/out, view their weekly schedule, and open their payslips. You can even install it to the home screen like an app, no app store needed.",
  },
  {
    q: "How does a payroll run work?",
    a: "Pick a cutoff (semi-monthly by default) and PondoFlow computes every active employee's pay from their time entries — basic pay, overtime, night differential, government deductions, and withholding tax. Review the draft, recompute if needed, then finalize. Finalized runs are locked and payslips become visible to employees.",
  },
  {
    q: "Does it handle 13th-month pay?",
    a: "Yes. Run a dedicated 13th-month payroll and PondoFlow computes 1/12 of each employee's basic salary earned within the calendar year, tax-exempt up to the ₱90,000 cap.",
  },
  {
    q: "Can I export reports for my accountant or the BIR?",
    a: "Every finalized run has a downloadable payroll register (CSV) with per-employee gross pay, SSS/PhilHealth/Pag-IBIG shares, withholding tax, and net pay — ready to hand to your accountant or use for government filings.",
  },
];

export function Faq() {
  return (
    <div className="mx-auto max-w-3xl space-y-3">
      {faqs.map((f, i) => (
        <details
          key={i}
          className="group rounded-xl border border-zinc-200 bg-white open:border-emerald-300 open:shadow-sm"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-zinc-800 [&::-webkit-details-marker]:hidden">
            {f.q}
            <span className="text-lg text-emerald-600 transition-transform duration-200 group-open:rotate-45">
              +
            </span>
          </summary>
          <p className="px-5 pb-5 text-sm leading-relaxed text-zinc-600">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
