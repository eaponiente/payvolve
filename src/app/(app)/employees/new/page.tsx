import { requireAdmin } from "@/lib/tenant";
import { createEmployee } from "@/lib/actions/employee-actions";
import { EmployeeForm } from "@/components/employee-form";
import { PageHeader } from "@/components/ui";

export default async function NewEmployeePage() {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Add employee" />
      <EmployeeForm action={createEmployee} />
    </div>
  );
}
