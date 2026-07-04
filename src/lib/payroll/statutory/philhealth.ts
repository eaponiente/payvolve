import { round2 } from "../money";

/**
 * PhilHealth premium (UHC Act schedule, 2024 onward):
 * - 5% of the monthly basic salary, split equally employee/employer.
 * - Salary floor ₱10,000, ceiling ₱100,000.
 */

export const PHILHEALTH_RATE = 0.05;
export const PHILHEALTH_SALARY_FLOOR = 10_000;
export const PHILHEALTH_SALARY_CEILING = 100_000;

function premiumBase(monthlySalary: number): number {
  return Math.min(
    Math.max(monthlySalary, PHILHEALTH_SALARY_FLOOR),
    PHILHEALTH_SALARY_CEILING,
  );
}

/** Employee share of the monthly PhilHealth premium. */
export function philhealthEmployeeMonthly(monthlySalary: number): number {
  return round2((premiumBase(monthlySalary) * PHILHEALTH_RATE) / 2);
}

/** Employer share of the monthly PhilHealth premium. */
export function philhealthEmployerMonthly(monthlySalary: number): number {
  return philhealthEmployeeMonthly(monthlySalary);
}
