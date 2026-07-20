"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BASE_FEE,
  EWA_PER_EMPLOYEE_FEE,
  PER_EMPLOYEE_FEE,
  computeBill,
} from "@/lib/billing/pricing";
import { phpFormat } from "@/lib/payroll/money";

/** Interactive plan estimator driven by the real billing engine. */
export function PricingCalculator() {
  const [count, setCount] = useState(10);
  const [ewa, setEwa] = useState(false);
  const bill = computeBill(count, ewa);

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg sm:p-8">
      <div className="flex items-baseline justify-between">
        <h3 className="text-lg font-semibold">Estimate your bill</h3>
        <span className="text-xs text-zinc-400">billed monthly</span>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between text-sm font-medium text-zinc-700">
          <span>Team size</span>
          <span className="rounded-full bg-emerald-100 px-3 py-0.5 font-semibold text-emerald-800">
            {count} employee{count === 1 ? "" : "s"}
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={100}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="mt-3 w-full accent-emerald-600"
          aria-label="Number of employees"
        />
        <div className="mt-1 flex justify-between text-xs text-zinc-400">
          <span>1</span>
          <span>100</span>
        </div>
      </div>

      <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 p-4 transition-colors hover:border-emerald-300">
        <input
          type="checkbox"
          checked={ewa}
          onChange={(e) => setEwa(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-emerald-600"
        />
        <span>
          <span className="block text-sm font-medium text-zinc-800">
            Earned Wage Access add-on
          </span>
          <span className="block text-xs text-zinc-500">
            Crew can withdraw already-earned wages before payday. +
            {phpFormat(EWA_PER_EMPLOYEE_FEE)}/employee/month.
          </span>
        </span>
      </label>

      <div className="mt-6 space-y-2 border-t border-zinc-200 pt-4 text-sm">
        <div className="flex justify-between text-zinc-600">
          <span>Platform fee</span>
          <span className="tabular-nums">{phpFormat(BASE_FEE)}</span>
        </div>
        <div className="flex justify-between text-zinc-600">
          <span>
            Employees ({phpFormat(PER_EMPLOYEE_FEE)} × {count})
          </span>
          <span className="tabular-nums">{phpFormat(bill.perEmployeeTotal)}</span>
        </div>
        {ewa && (
          <div className="flex justify-between text-zinc-600">
            <span>
              Earned Wage Access ({phpFormat(EWA_PER_EMPLOYEE_FEE)} × {count})
            </span>
            <span className="tabular-nums">{phpFormat(bill.ewaTotal)}</span>
          </div>
        )}
        <div className="flex items-baseline justify-between border-t border-zinc-300 pt-3">
          <span className="font-semibold">Your monthly total</span>
          <span className="text-2xl font-bold tabular-nums text-emerald-700">
            {phpFormat(bill.total)}
          </span>
        </div>
        <p className="text-right text-xs text-zinc-400">
          ≈ {phpFormat(Math.round((bill.total / count) * 100) / 100)} per employee
        </p>
      </div>

      <Link
        href="/signup"
        className="mt-6 block w-full rounded-xl bg-emerald-600 py-3 text-center text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
      >
        Start 30-day free trial — no credit card
      </Link>
    </div>
  );
}
