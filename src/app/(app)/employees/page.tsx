import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/tenant";
import { EmployeeList } from "@/components/employee-list";
import { ButtonLink, PageHeader } from "@/components/ui";

export default async function EmployeesPage() {
  const user = await requireAdmin();
  const employees = await prisma.employee.findMany({
    where: { companyId: user.companyId },
    orderBy: [{ active: "desc" }, { lastName: "asc" }],
  });

  const rows = employees.map((e) => ({
    id: e.id,
    firstName: e.firstName,
    lastName: e.lastName,
    position: e.position,
    payType: e.payType,
    baseRate: Number(e.baseRate),
    active: e.active,
  }));

  return (
    <>
      <PageHeader
        title="Employees"
        subtitle={`${rows.filter((e) => e.active).length} active`}
        action={<ButtonLink href="/employees/new">Add employee</ButtonLink>}
      />
      <EmployeeList employees={rows} />
    </>
  );
}
