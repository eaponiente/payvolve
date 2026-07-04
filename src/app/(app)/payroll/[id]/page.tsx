import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/tenant";
import { deleteRun, finalizeRun, recomputeRun } from "@/lib/actions/payroll-actions";
import { phpFormat } from "@/lib/payroll/money";
import { formatPeriod } from "@/lib/payroll/period";
import { getEntitlement } from "@/lib/billing/subscription";
import { Badge, Button, ButtonLink, Card, PageHeader, Td, Th } from "@/components/ui";

const dateFmt = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default async function PayrollRunPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireAdmin();
  const run = await prisma.payrollRun.findFirst({
    where: { id, companyId: user.companyId },
    include: {
      payslips: {
        include: { employee: { select: { firstName: true, lastName: true } } },
        orderBy: { employee: { lastName: "asc" } },
      },
    },
  });
  if (!run) notFound();

  const { entitled } = await getEntitlement(user.companyId);
  const totals = run.payslips.reduce(
    (acc, p) => ({
      gross: acc.gross + Number(p.gross),
      deductions: acc.deductions + Number(p.totalDeductions),
      net: acc.net + Number(p.net),
    }),
    { gross: 0, deductions: 0, net: 0 },
  );
  const isDraft = run.status === "DRAFT";

  return (
    <>
      <PageHeader
        title={run.type === "REGULAR" ? "Payroll run" : "13th month run"}
        subtitle={`${formatPeriod(run.periodStart, run.periodEnd)} · payout ${dateFmt.format(run.payoutDate)}`}
        action={
          <div className="flex items-center gap-2">
            {isDraft ? (
              entitled ? (
                <>
                  <form action={deleteRun.bind(null, run.id)}>
                    <Button variant="danger">Delete draft</Button>
                  </form>
                  <form action={recomputeRun.bind(null, run.id)}>
                    <Button variant="secondary">Recompute</Button>
                  </form>
                  <form action={finalizeRun.bind(null, run.id)}>
                    <Button>Finalize run</Button>
                  </form>
                </>
              ) : (
                <ButtonLink href="/billing" variant="secondary">
                  Reactivate to finalize
                </ButtonLink>
              )
            ) : (
              <Badge tone="emerald">Finalized</Badge>
            )}
          </div>
        }
      />

      {isDraft && (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Draft — numbers update when you recompute. Finalizing locks the run and
          makes payslips visible to employees.
        </p>
      )}

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="border-b border-zinc-200">
            <tr>
              <Th>Employee</Th>
              <Th className="text-right">Gross</Th>
              <Th className="text-right">Deductions</Th>
              <Th className="text-right">Net pay</Th>
              <Th />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {run.payslips.map((p) => (
              <tr key={p.id} className="hover:bg-zinc-50">
                <Td className="font-medium">
                  {p.employee.lastName}, {p.employee.firstName}
                </Td>
                <Td className="text-right tabular-nums">{phpFormat(Number(p.gross))}</Td>
                <Td className="text-right tabular-nums text-red-600">
                  −{phpFormat(Number(p.totalDeductions))}
                </Td>
                <Td className="text-right font-semibold tabular-nums">
                  {phpFormat(Number(p.net))}
                </Td>
                <Td className="text-right">
                  <Link
                    href={`/payslips/${p.id}`}
                    className="text-sm text-emerald-700 hover:underline"
                  >
                    Payslip
                  </Link>
                </Td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-zinc-300">
            <tr>
              <Td className="font-semibold">Total · {run.payslips.length} employee(s)</Td>
              <Td className="text-right font-semibold tabular-nums">
                {phpFormat(totals.gross)}
              </Td>
              <Td className="text-right font-semibold tabular-nums text-red-600">
                −{phpFormat(totals.deductions)}
              </Td>
              <Td className="text-right font-semibold tabular-nums">
                {phpFormat(totals.net)}
              </Td>
              <Td />
            </tr>
          </tfoot>
        </table>
      </Card>
    </>
  );
}
