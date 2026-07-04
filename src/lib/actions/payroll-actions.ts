"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/tenant";
import { getEntitlement, LOCKED_MESSAGE } from "@/lib/billing/subscription";
import type { FormState } from "@/lib/actions/auth-actions";
import {
  computeSemiMonthlyPayslip,
  computeThirteenthMonthPayslip,
  type BreakdownLine,
} from "@/lib/payroll/run";
import { computeThirteenthMonth } from "@/lib/payroll/thirteenth";
import { round2 } from "@/lib/payroll/money";

type PayslipData = {
  employeeId: string;
  breakdown: { earnings: BreakdownLine[]; deductions: BreakdownLine[] };
  gross: number;
  totalDeductions: number;
  net: number;
};

async function buildRegularPayslips(
  companyId: string,
  periodStart: Date,
  periodEnd: Date,
): Promise<PayslipData[]> {
  const company = await prisma.company.findUniqueOrThrow({
    where: { id: companyId },
    select: { workHoursPerDay: true },
  });
  const employees = await prisma.employee.findMany({
    where: { companyId, active: true },
    include: {
      timeEntries: {
        where: {
          clockIn: { gte: periodStart, lte: periodEnd },
          clockOut: { not: null },
        },
      },
    },
  });

  return employees.map((employee) => {
    const slip = computeSemiMonthlyPayslip(
      {
        payType: employee.payType,
        baseRate: Number(employee.baseRate),
        timeEntries: employee.timeEntries.map((t) => ({
          clockIn: t.clockIn,
          clockOut: t.clockOut,
        })),
      },
      company.workHoursPerDay,
    );
    return {
      employeeId: employee.id,
      breakdown: { earnings: slip.earnings, deductions: slip.deductions },
      gross: slip.gross,
      totalDeductions: slip.totalDeductions,
      net: slip.net,
    };
  });
}

/** Basic pay earned per employee from finalized regular runs in the given year. */
async function buildThirteenthMonthPayslips(
  companyId: string,
  year: number,
): Promise<PayslipData[]> {
  const employees = await prisma.employee.findMany({
    where: { companyId, active: true },
    include: {
      payslips: {
        where: {
          payrollRun: {
            status: "FINALIZED",
            type: "REGULAR",
            periodStart: {
              gte: new Date(year, 0, 1),
              lt: new Date(year + 1, 0, 1),
            },
          },
        },
        select: { breakdown: true },
      },
    },
  });

  return employees.map((employee) => {
    const totalBasic = round2(
      employee.payslips.reduce((sum, p) => {
        const breakdown = p.breakdown as { earnings?: BreakdownLine[] };
        const basic = breakdown.earnings?.find((e) => e.label === "Basic pay");
        return sum + (basic?.amount ?? 0);
      }, 0),
    );
    const slip = computeThirteenthMonthPayslip(computeThirteenthMonth(totalBasic));
    return {
      employeeId: employee.id,
      breakdown: { earnings: slip.earnings, deductions: slip.deductions },
      gross: slip.gross,
      totalDeductions: slip.totalDeductions,
      net: slip.net,
    };
  });
}

const runSchema = z.object({
  type: z.enum(["REGULAR", "THIRTEENTH_MONTH"]),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  payoutDate: z.coerce.date(),
});

export async function createPayrollRun(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireAdmin();
  if (!(await getEntitlement(user.companyId)).entitled) {
    return { error: LOCKED_MESSAGE };
  }
  const parsed = runSchema.safeParse({
    type: formData.get("type"),
    periodStart: formData.get("periodStart"),
    periodEnd: formData.get("periodEnd"),
    payoutDate: formData.get("payoutDate"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { type, periodStart, payoutDate } = parsed.data;
  // include the whole end day
  const periodEnd = new Date(parsed.data.periodEnd);
  periodEnd.setHours(23, 59, 59, 999);
  if (periodEnd <= periodStart) return { error: "Period end must be after start" };

  const payslips =
    type === "REGULAR"
      ? await buildRegularPayslips(user.companyId, periodStart, periodEnd)
      : await buildThirteenthMonthPayslips(user.companyId, periodStart.getFullYear());

  if (payslips.length === 0) {
    return { error: "No active employees to pay" };
  }

  const run = await prisma.payrollRun.create({
    data: {
      companyId: user.companyId,
      type,
      periodStart,
      periodEnd,
      payoutDate,
      payslips: { create: payslips },
    },
  });

  revalidatePath("/payroll");
  redirect(`/payroll/${run.id}`);
}

async function draftRunOrNull(runId: string, companyId: string) {
  return prisma.payrollRun.findFirst({
    where: { id: runId, companyId, status: "DRAFT" },
  });
}

/** Recompute a draft run's payslips from current time entries and rates. */
export async function recomputeRun(runId: string): Promise<void> {
  const user = await requireAdmin();
  if (!(await getEntitlement(user.companyId)).entitled) return;
  const run = await draftRunOrNull(runId, user.companyId);
  if (!run) return;

  const payslips =
    run.type === "REGULAR"
      ? await buildRegularPayslips(user.companyId, run.periodStart, run.periodEnd)
      : await buildThirteenthMonthPayslips(
          user.companyId,
          run.periodStart.getFullYear(),
        );

  await prisma.$transaction([
    prisma.payslip.deleteMany({ where: { payrollRunId: run.id } }),
    prisma.payrollRun.update({
      where: { id: run.id },
      data: { payslips: { create: payslips } },
    }),
  ]);
  revalidatePath(`/payroll/${runId}`);
}

/** Finalize a draft run, locking its payslips. */
export async function finalizeRun(runId: string): Promise<void> {
  const user = await requireAdmin();
  if (!(await getEntitlement(user.companyId)).entitled) return;
  await prisma.payrollRun.updateMany({
    where: { id: runId, companyId: user.companyId, status: "DRAFT" },
    data: { status: "FINALIZED", finalizedAt: new Date() },
  });
  revalidatePath(`/payroll/${runId}`);
  revalidatePath("/payroll");
}

/** Delete a draft run (finalized runs are immutable). */
export async function deleteRun(runId: string): Promise<void> {
  const user = await requireAdmin();
  await prisma.payrollRun.deleteMany({
    where: { id: runId, companyId: user.companyId, status: "DRAFT" },
  });
  revalidatePath("/payroll");
  redirect("/payroll");
}
