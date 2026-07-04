import { round2 } from "./money";
import { summarizeHours, type TimeEntryInput } from "./hours";
import { computeEarnings, type PayType } from "./earnings";
import { sssEmployeeMonthly } from "./statutory/sss";
import { philhealthEmployeeMonthly } from "./statutory/philhealth";
import { pagibigEmployeeMonthly } from "./statutory/pagibig";
import { birWithholdingSemiMonthly } from "./statutory/bir";

/**
 * Computes one employee's payslip for a semi-monthly run.
 *
 * Statutory contributions are table-driven off the monthly basic salary
 * (period basic × 2 for daily/hourly workers) and split evenly across the
 * two cutoffs, per common PH payroll practice.
 */

export type BreakdownLine = { label: string; detail?: string; amount: number };

export type PayslipComputation = {
  earnings: BreakdownLine[];
  deductions: BreakdownLine[];
  gross: number;
  totalDeductions: number;
  net: number;
};

export type EmployeePayrollInput = {
  payType: PayType;
  baseRate: number;
  timeEntries: TimeEntryInput[];
};

function fmtHours(h: number): string {
  return `${(Math.round(h * 100) / 100).toLocaleString("en-PH")} hrs`;
}

export function computeSemiMonthlyPayslip(
  input: EmployeePayrollInput,
  workHoursPerDay: number,
): PayslipComputation {
  const hours = summarizeHours(input.timeEntries, workHoursPerDay);
  const earned = computeEarnings({
    payType: input.payType,
    baseRate: input.baseRate,
    workHoursPerDay,
    hours,
  });

  // Monthly basic used for contribution tables.
  const monthlyBasic =
    input.payType === "MONTHLY" ? input.baseRate : earned.basicPay * 2;

  const sss = round2(sssEmployeeMonthly(monthlyBasic) / 2);
  const philhealth = round2(philhealthEmployeeMonthly(monthlyBasic) / 2);
  const pagibig = round2(pagibigEmployeeMonthly(monthlyBasic) / 2);

  const taxable = round2(earned.gross - sss - philhealth - pagibig);
  const withholdingTax = birWithholdingSemiMonthly(taxable);

  const earnings: BreakdownLine[] = [
    {
      label: "Basic pay",
      detail:
        input.payType === "DAILY"
          ? `${hours.daysWorked} day(s)`
          : input.payType === "HOURLY"
            ? fmtHours(hours.regularHours)
            : undefined,
      amount: earned.basicPay,
    },
  ];
  if (earned.overtimePay > 0) {
    earnings.push({
      label: "Overtime (125%)",
      detail: fmtHours(hours.overtimeHours),
      amount: earned.overtimePay,
    });
  }
  if (earned.nightDiffPay > 0) {
    earnings.push({
      label: "Night differential (10%)",
      detail: fmtHours(hours.nightDiffHours),
      amount: earned.nightDiffPay,
    });
  }

  const deductions: BreakdownLine[] = [
    { label: "SSS", amount: sss },
    { label: "PhilHealth", amount: philhealth },
    { label: "Pag-IBIG", amount: pagibig },
  ];
  if (withholdingTax > 0) {
    deductions.push({ label: "Withholding tax", amount: withholdingTax });
  }

  const totalDeductions = round2(sss + philhealth + pagibig + withholdingTax);

  return {
    earnings,
    deductions,
    gross: earned.gross,
    totalDeductions,
    net: round2(earned.gross - totalDeductions),
  };
}

/** Payslip for a 13th-month run: no statutory deductions, tax-exempt to ₱90k. */
export function computeThirteenthMonthPayslip(
  thirteenthMonthPay: number,
): PayslipComputation {
  const amount = round2(thirteenthMonthPay);
  return {
    earnings: [{ label: "13th month pay", amount }],
    deductions: [],
    gross: amount,
    totalDeductions: 0,
    net: amount,
  };
}
