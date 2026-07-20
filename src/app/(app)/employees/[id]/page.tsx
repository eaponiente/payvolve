import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/tenant";
import { decryptField } from "@/lib/crypto";
import {
  addEmployeeLogin,
  addEmployeePinLogin,
  setEmployeeRole,
  updateEmployee,
} from "@/lib/actions/employee-actions";
import { EmployeeForm } from "@/components/employee-form";
import { AddLoginForm } from "@/components/add-login-form";
import { Badge, Button, Card, PageHeader } from "@/components/ui";

export default async function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireAdmin();
  const employee = await prisma.employee.findFirst({
    where: { id, companyId: user.companyId },
    include: {
      user: { select: { id: true, email: true, loginCode: true, role: true } },
    },
  });
  if (!employee) notFound();

  const updateWithId = updateEmployee.bind(null, employee.id);

  // Only an owner can change roles, only for a linked account that isn't itself
  // an owner, and never their own.
  const canChangeRole =
    user.role === "OWNER" &&
    employee.user != null &&
    employee.user.role !== "OWNER" &&
    employee.user.id !== user.id;
  const isAdmin = employee.user?.role === "ADMIN";

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={`${employee.firstName} ${employee.lastName}`}
        subtitle={
          employee.user?.email
            ? `Self-service account: ${employee.user.email}`
            : employee.user?.loginCode
              ? `PIN login: ${employee.user.loginCode}`
              : "No self-service account"
        }
      />
      {!employee.user && (
        <AddLoginForm
          passwordAction={addEmployeeLogin.bind(null, employee.id)}
          pinAction={addEmployeePinLogin.bind(null, employee.id)}
        />
      )}
      {canChangeRole && (
        <Card className="mb-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                  Access role
                </h2>
                <Badge tone={isAdmin ? "emerald" : "zinc"}>
                  {isAdmin ? "Admin" : "Employee"}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-zinc-500">
                {isAdmin
                  ? "Can manage employees, schedules, time and payroll."
                  : "Can only see their own dashboard, schedule, time and payslips."}
              </p>
            </div>
            <form action={setEmployeeRole.bind(null, employee.id)}>
              <input type="hidden" name="role" value={isAdmin ? "EMPLOYEE" : "ADMIN"} />
              <Button variant={isAdmin ? "secondary" : "primary"}>
                {isAdmin ? "Change to Employee" : "Promote to Admin"}
              </Button>
            </form>
          </div>
        </Card>
      )}
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
