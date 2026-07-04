import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isAdmin, requireUser } from "@/lib/tenant";
import { phpFormat } from "@/lib/payroll/money";
import { formatPeriod } from "@/lib/payroll/period";
import { Card, PageHeader, Td, Th } from "@/components/ui";

export default async function PayslipsPage() {
  const user = await requireUser();
  if (isAdmin(user)) redirect("/payroll");
  if (!user.employeeId) {
    return <p className="text-zinc-500">No employee profile linked to your account.</p>;
  }

  const payslips = await prisma.payslip.findMany({
    where: {
      employeeId: user.employeeId,
      payrollRun: { status: "FINALIZED" },
    },
    include: { payrollRun: true },
    orderBy: { payrollRun: { periodStart: "desc" } },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="My payslips" />
      <Card className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-zinc-200">
            <tr>
              <Th>Period</Th>
              <Th>Type</Th>
              <Th className="text-right">Net pay</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {payslips.map((p) => (
              <tr key={p.id} className="hover:bg-zinc-50">
                <Td>
                  <Link
                    href={`/payslips/${p.id}`}
                    className="font-medium text-emerald-700 hover:underline"
                  >
                    {formatPeriod(p.payrollRun.periodStart, p.payrollRun.periodEnd)}
                  </Link>
                </Td>
                <Td>{p.payrollRun.type === "REGULAR" ? "Regular" : "13th month"}</Td>
                <Td className="text-right font-semibold tabular-nums">
                  {phpFormat(Number(p.net))}
                </Td>
              </tr>
            ))}
            {payslips.length === 0 && (
              <tr>
                <Td colSpan={3} className="py-10 text-center text-zinc-500">
                  No payslips yet — they appear here once payroll is finalized.
                </Td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
