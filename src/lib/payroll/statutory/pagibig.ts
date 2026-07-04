import { round2 } from "../money";

/**
 * Pag-IBIG (HDMF) contributions, 2024 onward:
 * - Fund salary base capped at ₱10,000.
 * - Employee: 1% if monthly compensation ≤ ₱1,500, otherwise 2% (max ₱200).
 * - Employer: 2% (max ₱200).
 */

export const PAGIBIG_SALARY_CAP = 10_000;

/** Employee share of the monthly Pag-IBIG contribution. */
export function pagibigEmployeeMonthly(monthlySalary: number): number {
  const base = Math.min(monthlySalary, PAGIBIG_SALARY_CAP);
  const rate = monthlySalary <= 1_500 ? 0.01 : 0.02;
  return round2(base * rate);
}

/** Employer share of the monthly Pag-IBIG contribution. */
export function pagibigEmployerMonthly(monthlySalary: number): number {
  return round2(Math.min(monthlySalary, PAGIBIG_SALARY_CAP) * 0.02);
}
