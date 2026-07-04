import { round2 } from "../money";

/**
 * SSS contributions, 2025 schedule (RA 11199 final tranche, effective Jan 2025):
 * - Total rate 15% of the Monthly Salary Credit (MSC): 10% employer, 5% employee.
 * - MSC brackets run from ₱5,000 to ₱35,000 in ₱500 steps; salaries round to the
 *   nearest ₱500 (bracket boundaries fall at ±₱250 around each MSC).
 * - The employee deduction is a flat 5% of MSC (regular SSS + MPF/WISP combined).
 */

export const SSS_MSC_MIN = 5_000;
export const SSS_MSC_MAX = 35_000;
export const SSS_EMPLOYEE_RATE = 0.05;
export const SSS_EMPLOYER_RATE = 0.1;

export function sssMonthlySalaryCredit(monthlySalary: number): number {
  const stepped = Math.round(monthlySalary / 500) * 500;
  return Math.min(Math.max(stepped, SSS_MSC_MIN), SSS_MSC_MAX);
}

/** Employee share of the monthly SSS contribution. */
export function sssEmployeeMonthly(monthlySalary: number): number {
  return round2(sssMonthlySalaryCredit(monthlySalary) * SSS_EMPLOYEE_RATE);
}

/** Employer share of the monthly SSS contribution (excludes EC premium). */
export function sssEmployerMonthly(monthlySalary: number): number {
  return round2(sssMonthlySalaryCredit(monthlySalary) * SSS_EMPLOYER_RATE);
}
