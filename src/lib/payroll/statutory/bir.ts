import { round2 } from "../money";

/**
 * BIR withholding tax on compensation — semi-monthly table,
 * effective 1 Jan 2023 (TRAIN Law, RR 11-2018 as amended).
 *
 * Applied to taxable compensation for the semi-monthly period:
 * gross taxable pay minus the employee's mandatory contributions
 * (SSS, PhilHealth, Pag-IBIG) for the same period.
 */

type Bracket = { over: number; base: number; rate: number };

export const BIR_SEMI_MONTHLY_BRACKETS: Bracket[] = [
  { over: 0, base: 0, rate: 0 },
  { over: 10_417, base: 0, rate: 0.15 },
  { over: 16_667, base: 937.5, rate: 0.2 },
  { over: 33_333, base: 4_270.7, rate: 0.25 },
  { over: 83_333, base: 16_770.7, rate: 0.3 },
  { over: 333_333, base: 91_770.7, rate: 0.35 },
];

/** Withholding tax for one semi-monthly period. */
export function birWithholdingSemiMonthly(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0;
  let bracket = BIR_SEMI_MONTHLY_BRACKETS[0];
  for (const b of BIR_SEMI_MONTHLY_BRACKETS) {
    if (taxableIncome >= b.over) bracket = b;
  }
  return round2(bracket.base + (taxableIncome - bracket.over) * bracket.rate);
}

/** 13th-month pay and other benefits are tax-exempt up to this annual cap. */
export const THIRTEENTH_MONTH_TAX_EXEMPT_CAP = 90_000;
