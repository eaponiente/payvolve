import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/tenant";
import { phpFormat } from "@/lib/payroll/money";
import { formatPeriod } from "@/lib/payroll/period";
import { Badge, ButtonLink, Card, PageHeader, Td, Th } from "@/components/ui";

export default async function PayrollPage() {
  const user = await requireAdmin();
  const runs = await prisma.payrollRun.findMany({
    where: { companyId: user.companyId },
    orderBy: { periodStart: "desc" },
    include: { payslips: { select: { net: true } } },
  });

  return (
    <>
      <PageHeader
        title="Payroll runs"
        action={<ButtonLink href="/payroll/new">New payroll run</ButtonLink>}
      />
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="border-b border-zinc-200">
            <tr>
              <Th>Period</Th>
              <Th>Type</Th>
              <Th className="text-right">Employees</Th>
              <Th className="text-right">Total net</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {runs.map((run) => {
              const totalNet = run.payslips.reduce((s, p) => s + Number(p.net), 0);
              return (
                <tr key={run.id} className="hover:bg-zinc-50">
                  <Td>
                    <Link
                      href={`/payroll/${run.id}`}
                      className="font-medium text-emerald-700 hover:underline"
                    >
                      {formatPeriod(run.periodStart, run.periodEnd)}
                    </Link>
                  </Td>
                  <Td>{run.type === "REGULAR" ? "Regular" : "13th month"}</Td>
                  <Td className="text-right tabular-nums">{run.payslips.length}</Td>
                  <Td className="text-right tabular-nums">{phpFormat(totalNet)}</Td>
                  <Td>
                    {run.status === "FINALIZED" ? (
                      <Badge tone="emerald">Finalized</Badge>
                    ) : (
                      <Badge tone="amber">Draft</Badge>
                    )}
                  </Td>
                </tr>
              );
            })}
            {runs.length === 0 && (
              <tr>
                <Td colSpan={5} className="py-10 text-center text-zinc-500">
                  No payroll runs yet. Create your first run.
                </Td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </>
  );
}
