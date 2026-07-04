import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import type { BreakdownLine } from "@/lib/payroll/run";
import { toDateInputValue } from "@/lib/payroll/period";

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ runId: string }> },
) {
  const { runId } = await params;
  const session = await auth();
  const user = session?.user;
  if (!user?.companyId || user.role === "EMPLOYEE") {
    return new Response("Unauthorized", { status: 401 });
  }

  const run = await prisma.payrollRun.findFirst({
    where: { id: runId, companyId: user.companyId },
    include: {
      payslips: {
        include: { employee: true },
        orderBy: { employee: { lastName: "asc" } },
      },
    },
  });
  if (!run) return new Response("Not found", { status: 404 });

  const deductionOf = (lines: BreakdownLine[], label: string) =>
    lines.find((l) => l.label === label)?.amount ?? 0;
  const earningOf = deductionOf;

  const header = [
    "Employee",
    "TIN",
    "SSS No",
    "PhilHealth No",
    "Pag-IBIG MID",
    "Basic Pay",
    "Overtime",
    "Night Diff",
    "Gross",
    "SSS EE",
    "PhilHealth EE",
    "Pag-IBIG EE",
    "Withholding Tax",
    "Total Deductions",
    "Net Pay",
  ];

  const rows = run.payslips.map((p) => {
    const b = p.breakdown as { earnings: BreakdownLine[]; deductions: BreakdownLine[] };
    return [
      `${p.employee.lastName}, ${p.employee.firstName}`,
      p.employee.tin,
      p.employee.sssNumber,
      p.employee.philhealthNumber,
      p.employee.pagibigNumber,
      earningOf(b.earnings, run.type === "REGULAR" ? "Basic pay" : "13th month pay"),
      earningOf(b.earnings, "Overtime (125%)"),
      earningOf(b.earnings, "Night differential (10%)"),
      Number(p.gross),
      deductionOf(b.deductions, "SSS"),
      deductionOf(b.deductions, "PhilHealth"),
      deductionOf(b.deductions, "Pag-IBIG"),
      deductionOf(b.deductions, "Withholding tax"),
      Number(p.totalDeductions),
      Number(p.net),
    ]
      .map((v) => csvEscape(String(v)))
      .join(",");
  });

  const csv = [header.join(","), ...rows].join("\n");
  const filename = `payroll-register-${toDateInputValue(run.periodStart)}-to-${toDateInputValue(run.periodEnd)}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
