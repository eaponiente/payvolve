import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/tenant";
import { phpFormat } from "@/lib/payroll/money";
import { Badge, ButtonLink, Card, PageHeader, Td, Th } from "@/components/ui";

const PAY_TYPE_LABEL = {
  MONTHLY: "Monthly",
  DAILY: "Daily",
  HOURLY: "Hourly",
} as const;

export default async function EmployeesPage() {
  const user = await requireAdmin();
  const employees = await prisma.employee.findMany({
    where: { companyId: user.companyId },
    orderBy: [{ active: "desc" }, { lastName: "asc" }],
  });

  return (
    <>
      <PageHeader
        title="Employees"
        subtitle={`${employees.filter((e) => e.active).length} active`}
        action={<ButtonLink href="/employees/new">Add employee</ButtonLink>}
      />
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="border-b border-zinc-200">
            <tr>
              <Th>Name</Th>
              <Th>Position</Th>
              <Th>Pay</Th>
              <Th className="text-right">Rate</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {employees.map((e) => (
              <tr key={e.id} className="hover:bg-zinc-50">
                <Td>
                  <Link
                    href={`/employees/${e.id}`}
                    className="font-medium text-emerald-700 hover:underline"
                  >
                    {e.lastName}, {e.firstName}
                  </Link>
                </Td>
                <Td className="text-zinc-500">{e.position || "—"}</Td>
                <Td>{PAY_TYPE_LABEL[e.payType]}</Td>
                <Td className="text-right tabular-nums">
                  {phpFormat(Number(e.baseRate))}
                </Td>
                <Td>
                  {e.active ? (
                    <Badge tone="emerald">Active</Badge>
                  ) : (
                    <Badge>Inactive</Badge>
                  )}
                </Td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr>
                <Td colSpan={5} className="py-10 text-center text-zinc-500">
                  No employees yet. Add your first crew member.
                </Td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </>
  );
}
