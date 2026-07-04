import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/tenant";
import { phpFormat } from "@/lib/payroll/money";
import { formatPeriod } from "@/lib/payroll/period";
import { Card, PageHeader, Td, Th } from "@/components/ui";

export default async function ReportsPage() {
  const user = await requireAdmin();
  const runs = await prisma.payrollRun.findMany({
    where: { companyId: user.companyId, status: "FINALIZED" },
    orderBy: { periodStart: "desc" },
    include: { payslips: { select: { gross: true, totalDeductions: true, net: true } } },
  });

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Payroll registers for finalized runs — BIR-friendly CSV exports."
      />
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="border-b border-zinc-200">
            <tr>
              <Th>Period</Th>
              <Th className="text-right">Employees</Th>
              <Th className="text-right">Gross</Th>
              <Th className="text-right">Deductions</Th>
              <Th className="text-right">Net</Th>
              <Th />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {runs.map((run) => {
              const totals = run.payslips.reduce(
                (acc, p) => ({
                  gross: acc.gross + Number(p.gross),
                  ded: acc.ded + Number(p.totalDeductions),
                  net: acc.net + Number(p.net),
                }),
                { gross: 0, ded: 0, net: 0 },
              );
              return (
                <tr key={run.id} className="hover:bg-zinc-50">
                  <Td className="font-medium">
                    {formatPeriod(run.periodStart, run.periodEnd)}
                    {run.type === "THIRTEENTH_MONTH" && " · 13th month"}
                  </Td>
                  <Td className="text-right tabular-nums">{run.payslips.length}</Td>
                  <Td className="text-right tabular-nums">{phpFormat(totals.gross)}</Td>
                  <Td className="text-right tabular-nums">{phpFormat(totals.ded)}</Td>
                  <Td className="text-right tabular-nums">{phpFormat(totals.net)}</Td>
                  <Td className="text-right">
                    <a
                      href={`/reports/${run.id}/csv`}
                      className="text-sm font-medium text-emerald-700 hover:underline"
                    >
                      Download CSV
                    </a>
                  </Td>
                </tr>
              );
            })}
            {runs.length === 0 && (
              <tr>
                <Td colSpan={6} className="py-10 text-center text-zinc-500">
                  No finalized runs yet.
                </Td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </>
  );
}
