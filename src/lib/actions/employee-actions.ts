"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin, requireOwner } from "@/lib/tenant";
import { encryptGovIds } from "@/lib/crypto";
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
        data: { ...encryptGovIds(parsed.data), companyId: user.companyId, userId },
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

  // Look up first (tenant-scoped) so we have the linked account for cleanup.
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, companyId: user.companyId },
    select: { id: true, userId: true },
  });
  if (!employee) return { error: "Employee not found" };

  await prisma.$transaction(async (tx) => {
    await tx.employee.update({
      where: { id: employee.id },
      data: encryptGovIds(parsed.data),
    });

    // Deactivation cleanup: don't leave a terminated employee with an open
    // shift on the clock or future scheduled shifts, and force-log-out their
    // login so any live session is dropped at its next revalidation.
    if (!parsed.data.active) {
      await tx.timeEntry.updateMany({
        where: { employeeId: employee.id, clockOut: null },
        data: { clockOut: new Date() },
      });
      await tx.shift.deleteMany({
        where: { employeeId: employee.id, startsAt: { gt: new Date() } },
      });
      if (employee.userId) {
        await tx.user.update({
          where: { id: employee.userId },
          data: { tokenVersion: { increment: 1 } },
        });
      }
    }
  });

  revalidatePath("/employees");
  revalidatePath("/schedule");
  revalidatePath("/time");
  redirect("/employees");
}

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

/**
 * Admin: add a self-service login to an existing employee that has none.
 * Mirrors the optional account creation in createEmployee.
 */
export async function addEmployeeLogin(
  employeeId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireAdmin();
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { email, password } = parsed.data;

  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, companyId: user.companyId },
    select: { id: true, userId: true },
  });
  if (!employee) return { error: "Employee not found" };
  if (employee.userId) return { error: "This employee already has a login" };

  try {
    // Create the account and link it atomically; the email uniqueness check and
    // link happen together so a race can't orphan a user or double-link.
    await prisma.$transaction(async (tx) => {
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
      await tx.employee.update({
        where: { id: employee.id },
        data: { userId: account.id },
      });
    });
  } catch (err) {
    if (err instanceof DuplicateEmailError) return { error: err.message };
    throw err;
  }

  revalidatePath(`/employees/${employeeId}`);
  redirect(`/employees/${employeeId}`);
}

const pinCredSchema = z.object({
  loginCode: z
    .string()
    .trim()
    .toUpperCase()
    .min(3, "Login code must be at least 3 characters")
    .regex(/^[A-Z0-9-]+$/, "Use letters, numbers and dashes only"),
  pin: z.string().regex(/^\d{4,6}$/, "PIN must be 4–6 digits"),
});

/**
 * Admin: give an existing account-less employee a PIN login (login code + PIN)
 * instead of an email + password. Same guardrails as addEmployeeLogin.
 */
export async function addEmployeePinLogin(
  employeeId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireAdmin();
  const parsed = pinCredSchema.safeParse({
    loginCode: formData.get("loginCode"),
    pin: formData.get("pin"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { loginCode, pin } = parsed.data;

  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, companyId: user.companyId },
    select: { id: true, userId: true },
  });
  if (!employee) return { error: "Employee not found" };
  if (employee.userId) return { error: "This employee already has a login" };

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({ where: { loginCode } });
      if (existing) {
        throw new DuplicateEmailError("That login code is already taken");
      }
      const account = await tx.user.create({
        data: {
          loginCode,
          pinHash: await bcrypt.hash(pin, 10),
          role: "EMPLOYEE",
          companyId: user.companyId,
        },
      });
      await tx.employee.update({
        where: { id: employee.id },
        data: { userId: account.id },
      });
    });
  } catch (err) {
    if (err instanceof DuplicateEmailError) return { error: err.message };
    throw err;
  }

  revalidatePath(`/employees/${employeeId}`);
  redirect(`/employees/${employeeId}`);
}

// Capped at ADMIN on purpose — ownership is not transferable through the UI.
const roleSchema = z.enum(["ADMIN", "EMPLOYEE"]);

/**
 * Owner-only: change an employee's linked login between Admin and Employee.
 * Guardrails: only OWNER can call this, it never touches another OWNER's role,
 * and an owner can't change their own. Bumping tokenVersion forces the target's
 * session to pick up the new role (log out / back in).
 */
export async function setEmployeeRole(
  employeeId: string,
  formData: FormData,
): Promise<void> {
  const owner = await requireOwner();
  const parsedRole = roleSchema.safeParse(formData.get("role"));
  if (!parsedRole.success) return;

  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, companyId: owner.companyId },
    include: { user: { select: { id: true, role: true } } },
  });
  if (!employee?.user) return; // no linked account to change
  if (employee.user.role === "OWNER" || employee.user.id === owner.id) return;

  await prisma.user.updateMany({
    where: { id: employee.user.id, companyId: owner.companyId },
    data: { role: parsedRole.data, tokenVersion: { increment: 1 } },
  });
  revalidatePath(`/employees/${employeeId}`);
  revalidatePath("/employees");
}
