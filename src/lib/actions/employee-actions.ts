"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/tenant";
import type { FormState } from "@/lib/actions/auth-actions";

const employeeSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  position: z.string().trim().default(""),
  hireDate: z.coerce.date(),
  payType: z.enum(["MONTHLY", "DAILY", "HOURLY"]),
  baseRate: z.coerce.number().positive("Base rate must be positive"),
  tin: z.string().trim().default(""),
  sssNumber: z.string().trim().default(""),
  philhealthNumber: z.string().trim().default(""),
  pagibigNumber: z.string().trim().default(""),
  active: z.coerce.boolean().default(true),
});

/** Marks an intentional, user-facing validation failure raised inside the
 * transaction, so the catch block doesn't leak a raw Prisma error message. */
class DuplicateEmailError extends Error {}

function parseEmployeeForm(formData: FormData) {
  return employeeSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    position: formData.get("position") ?? "",
    hireDate: formData.get("hireDate"),
    payType: formData.get("payType"),
    baseRate: formData.get("baseRate"),
    tin: formData.get("tin") ?? "",
    sssNumber: formData.get("sssNumber") ?? "",
    philhealthNumber: formData.get("philhealthNumber") ?? "",
    pagibigNumber: formData.get("pagibigNumber") ?? "",
    active: formData.get("active") === "on",
  });
}

export async function createEmployee(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireAdmin();
  const parsed = parseEmployeeForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // Optional self-service account
  const email = String(formData.get("accountEmail") ?? "").trim().toLowerCase();
  const password = String(formData.get("accountPassword") ?? "");
  if (email && password.length < 8) {
    return { error: "Account password must be at least 8 characters" };
  }

  try {
    // Create the (optional) login account and the employee record together
    // so a failure partway through can't leave an orphaned user with no
    // employee, or vice versa.
    await prisma.$transaction(async (tx) => {
      let userId: string | undefined;
      if (email) {
        const existing = await tx.user.findUnique({ where: { email } });
        if (existing) {
          throw new DuplicateEmailError("An account with this email already exists");
        }
        const account = await tx.user.create({
          data: {
            email,
            passwordHash: await bcrypt.hash(password, 10),
            role: "EMPLOYEE",
            companyId: user.companyId,
          },
        });
        userId = account.id;
      }

      await tx.employee.create({
        data: { ...parsed.data, companyId: user.companyId, userId },
      });
    });
  } catch (err) {
    if (err instanceof DuplicateEmailError) return { error: err.message };
    throw err;
  }

  revalidatePath("/employees");
  redirect("/employees");
}

export async function updateEmployee(
  employeeId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireAdmin();
  const parsed = parseEmployeeForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // updateMany so companyId is part of the filter — tenant isolation
  const result = await prisma.employee.updateMany({
    where: { id: employeeId, companyId: user.companyId },
    data: parsed.data,
  });
  if (result.count === 0) return { error: "Employee not found" };

  revalidatePath("/employees");
  redirect("/employees");
}
