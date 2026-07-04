"use client";

import { useState } from "react";
import { sssEmployeeMonthly } from "@/lib/payroll/statutory/sss";
import { philhealthEmployeeMonthly } from "@/lib/payroll/statutory/philhealth";
import { pagibigEmployeeMonthly } from "@/lib/payroll/statutory/pagibig";
import { birWithholdingSemiMonthly } from "@/lib/payroll/statutory/bir";
import { phpFormat, round2 } from "@/lib/payroll/money";

/**
 * Live take-home pay calculator powered by the same statutory engine that
 * runs Payvolve payroll — SSS 2025, PhilHealth 5%, Pag-IBIG, BIR TRAIN table.
 */
export function NetPayCalculator() {
  const [salary, setSalary] = useState(25_000);

  const sss = sssEmployeeMonthly(salary);
  const philhealth = philhealthEmployeeMonthly(salary);
  const pagibig = pagibigEmployeeMonthly(salary);
  const contributions = round2(sss + philhealth + pagibig);
  const tax = round2(birWithholdingSemiMonthly((salary - contributions) / 2) * 2);
  const totalDeductions = round2(contributions + tax);
  const net = round2(salary - totalDeductions);
  const netPct = salary > 0 ? Math.max(0, Math.min(100, (net / salary) * 100)) : 0;

  const rows = [
    { label: "SSS", amount: sss, color: "bg-sky-400" },
    { label: "PhilHealth", amount: philhealth, color: "bg-violet-400" },
    { label: "Pag-IBIG", amount: pagibig, color: "bg-amber-400" },
    { label: "Withholding tax (BIR)", amount: tax, color: "bg-rose-400" },
  ];

  return (
    <div className="mx-auto grid max-w-4xl gap-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg sm:p-8 md:grid-cols-2">
      <div>
        <label htmlFor="salary" className="block text-sm font-medium text-zinc-700">
          Monthly basic salary
        </label>
        <div className="mt-2 flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-3 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
          <span className="text-lg font-semibold text-zinc-400">₱</span>
          <input
            id="salary"
            type="number"
            min={0}
            step={500}
            value={salary}
            onChange={(e) => setSalary(Math.max(0, Number(e.target.value)))}
            className="w-full bg-transparent text-lg font-semibold outline-none"
          />
        </div>
        <input
          type="range"
          min={5_000}
          max={150_000}
          step={500}
          value={Math.min(salary, 150_000)}
          onChange={(e) => setSalary(Number(e.target.value))}
          className="mt-4 w-full accent-emerald-600"
          aria-label="Salary slider"
        />
        <div className="mt-1 flex justify-between text-xs text-zinc-400">
          <span>₱5,000</span>
          <span>₱150,000</span>
        </div>

        <div className="mt-6 space-y-2">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-zinc-600">
                <span className={`h-2.5 w-2.5 rounded-full ${r.color}`} />
                {r.label}
              </span>
              <span className="tabular-nums text-zinc-800">−{phpFormat(r.amount)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-zinc-200 pt-2 text-sm font-semibold">
            <span>Total deductions</span>
            <span className="tabular-nums text-red-600">−{phpFormat(totalDeductions)}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-between rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 text-white">
        <div>
          <div className="text-sm font-medium text-emerald-100">
            Estimated monthly take-home
          </div>
          <div className="mt-1 text-4xl font-bold tabular-nums tracking-tight">
            {phpFormat(net)}
          </div>
          <div className="mt-1 text-sm text-emerald-100">
            {phpFormat(round2(net / 2))} per semi-monthly cutoff
          </div>

          <div className="mt-6 h-3 w-full overflow-hidden rounded-full bg-emerald-900/40">
            <div
              className="h-full rounded-full bg-white/90 transition-all duration-300"
              style={{ width: `${netPct}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-emerald-100">
            You keep {netPct.toFixed(1)}% of your gross pay
          </div>
        </div>
        <p className="mt-6 text-xs leading-relaxed text-emerald-100/80">
          Computed with the exact same engine Payvolve uses for real payroll: SSS
          2025 table, PhilHealth 5%, Pag-IBIG, and the BIR TRAIN withholding
          table. Estimates exclude overtime, night differential, and 13th month.
        </p>
      </div>
    </div>
  );
}
