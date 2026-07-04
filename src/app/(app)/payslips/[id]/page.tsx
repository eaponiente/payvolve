import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { isAdmin, requireUser } from "@/lib/tenant";
import { phpFormat } from "@/lib/payroll/money";
import { formatPeriod } from "@/lib/payroll/period";
import type { BreakdownLine } from "@/lib/payroll/run";
import { Badge, Card, PageHeader } from "@/components/ui";
import { PrintButton } from "@/components/print-button";

const dateFmt = new Intl.DateTimeFormat("en-PH", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

export default async function PayslipPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const payslip = await prisma.payslip.findFirst({
    where: {
      id,
      payrollRun: { companyId: user.companyId },
      // Employees only see their own, finalized payslips
      ...(isAdmin(user)
        ? {}
        : {
            employeeId: user.employeeId ?? "__none__",
            payrollRun: { companyId: user.companyId, status: "FINALIZED" },
          }),
    },
    include: {
      employee: true,
      payrollRun: { include: { company: { select: { name: true } } } },
    },
  });
  if (!payslip) notFound();

  const { earnings, deductions } = payslip.breakdown as {
    earnings: BreakdownLine[];
    deductions: BreakdownLine[];
  };
  const run = payslip.payrollRun;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="no-print">
        <PageHeader
          title="Payslip"
          action={
            <div className="flex items-center gap-3">
              {run.status === "DRAFT" && <Badge tone="amber">Draft</Badge>}
              <PrintButton />
            </div>
          }
        />
      </div>

      <Card className="print-area p-8">
        <div className="mb-6 flex items-start justify-between border-b border-zinc-200 pb-6">
          <div>
            <div className="text-lg font-bold">{run.company.name}</div>
            <div className="text-sm text-zinc-500">
              {run.type === "REGULAR" ? "Payslip" : "13th Month Pay"} ·{" "}
              {formatPeriod(run.periodStart, run.periodEnd)}
            </div>
            <div className="text-sm text-zinc-500">
              Payout date: {dateFmt.format(run.payoutDate)}
            </div>
          </div>
          <div className="text-right text-sm">
            <div className="font-semibold">
              {payslip.employee.firstName} {payslip.employee.lastName}
            </div>
            <div className="text-zinc-500">{payslip.employee.position || ""}</div>
            {payslip.employee.tin && (
              <div className="text-zinc-500">TIN: {payslip.employee.tin}</div>
            )}
            {payslip.employee.sssNumber && (
              <div className="text-zinc-500">SSS: {payslip.employee.sssNumber}</div>
            )}
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Earnings
            </h3>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-zinc-100">
                {earnings.map((line, i) => (
                  <tr key={i}>
                    <td className="py-1.5">
                      {line.label}
                      {line.detail && (
                        <span className="ml-1 text-xs text-zinc-400">({line.detail})</span>
                      )}
                    </td>
                    <td className="py-1.5 text-right tabular-nums">
                      {phpFormat(line.amount)}
                    </td>
                  </tr>
                ))}
                <tr className="border-t border-zinc-300 font-semibold">
                  <td className="py-1.5">Gross pay</td>
                  <td className="py-1.5 text-right tabular-nums">
                    {phpFormat(Number(payslip.gross))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Deductions
            </h3>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-zinc-100">
                {deductions.map((line, i) => (
                  <tr key={i}>
                    <td className="py-1.5">{line.label}</td>
                    <td className="py-1.5 text-right tabular-nums">
                      {phpFormat(line.amount)}
                    </td>
                  </tr>
                ))}
                {deductions.length === 0 && (
                  <tr>
                    <td className="py-1.5 text-zinc-400" colSpan={2}>
                      None
                    </td>
                  </tr>
                )}
                <tr className="border-t border-zinc-300 font-semibold">
                  <td className="py-1.5">Total deductions</td>
                  <td className="py-1.5 text-right tabular-nums">
                    {phpFormat(Number(payslip.totalDeductions))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between rounded-lg bg-emerald-50 px-4 py-3">
          <span className="font-semibold text-emerald-900">Net pay</span>
          <span className="text-xl font-bold tabular-nums text-emerald-900">
            {phpFormat(Number(payslip.net))}
          </span>
        </div>
      </Card>
    </div>
  );
}
