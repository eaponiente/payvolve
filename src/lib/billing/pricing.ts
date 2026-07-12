import { round2 } from "@/lib/payroll/money";

/**
 * PondoFlow subscription pricing:
 * - Base platform fee: ₱800 / company / month
 * - Per active employee: ₱100 / month
 * - Earned Wage Access add-on (optional): ₱100 / active employee / month
 *
 * Billing is usage-based on the company's active headcount for the period.
 */
export const BASE_FEE = 800;
export const PER_EMPLOYEE_FEE = 100;
export const EWA_PER_EMPLOYEE_FEE = 100;
export const TRIAL_DAYS = 14;

export type BillLine = { label: string; detail?: string; amount: number };

export type BillBreakdown = {
  base: number;
  perEmployeeTotal: number;
  ewaTotal: number;
  total: number;
  lines: BillLine[];
};

/** Compute the monthly charge for a given headcount and add-on selection. */
export function computeBill(
  employeeCount: number,
  includeEwa: boolean,
): BillBreakdown {
  const count = Math.max(0, Math.floor(employeeCount));
  const base = BASE_FEE;
  const perEmployeeTotal = round2(count * PER_EMPLOYEE_FEE);
  const ewaTotal = includeEwa ? round2(count * EWA_PER_EMPLOYEE_FEE) : 0;
  const total = round2(base + perEmployeeTotal + ewaTotal);

  const lines: BillLine[] = [
    { label: "Platform fee", detail: "base", amount: base },
    {
      label: "Employees",
      detail: `₱${PER_EMPLOYEE_FEE} × ${count}`,
      amount: perEmployeeTotal,
    },
  ];
  if (includeEwa) {
    lines.push({
      label: "Earned Wage Access",
      detail: `₱${EWA_PER_EMPLOYEE_FEE} × ${count}`,
      amount: ewaTotal,
    });
  }

  return { base, perEmployeeTotal, ewaTotal, total, lines };
}
