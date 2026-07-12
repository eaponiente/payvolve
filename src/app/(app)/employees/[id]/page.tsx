import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/tenant";
import { decryptField } from "@/lib/crypto";
import { updateEmployee } from "@/lib/actions/employee-actions";
import { EmployeeForm } from "@/components/employee-form";
import { PageHeader } from "@/components/ui";

export default async function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireAdmin();
  const employee = await prisma.employee.findFirst({
    where: { id, companyId: user.companyId },
    include: { user: { select: { email: true } } },
  });
  if (!employee) notFound();

  const updateWithId = updateEmployee.bind(null, employee.id);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={`${employee.firstName} ${employee.lastName}`}
        subtitle={
          employee.user?.email
            ? `Self-service account: ${employee.user.email}`
            : "No self-service account"
        }
      />
      <EmployeeForm
        action={updateWithId}
        defaults={{
          firstName: employee.firstName,
          lastName: employee.lastName,
          position: employee.position,
          hireDate: employee.hireDate.toISOString().slice(0, 10),
          payType: employee.payType,
          baseRate: Number(employee.baseRate),
          tin: decryptField(employee.tin),
          sssNumber: decryptField(employee.sssNumber),
          philhealthNumber: decryptField(employee.philhealthNumber),
          pagibigNumber: decryptField(employee.pagibigNumber),
          active: employee.active,
          hasAccount: Boolean(employee.user),
        }}
      />
    </div>
  );
}
