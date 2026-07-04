"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin, requireUser } from "@/lib/tenant";
import { getEntitlement, LOCKED_MESSAGE } from "@/lib/billing/subscription";
import type { FormState } from "@/lib/actions/auth-actions";

async function openEntryFor(employeeId: string) {
  return prisma.timeEntry.findFirst({
    where: { employeeId, clockOut: null },
    orderBy: { clockIn: "desc" },
  });
}

/** Clock in the signed-in employee. */
export async function clockIn(): Promise<void> {
  const user = await requireUser();
  if (!user.employeeId) return;
  if (!(await getEntitlement(user.companyId)).entitled) return;
  const open = await openEntryFor(user.employeeId);
  if (open) return; // already clocked in
  await prisma.timeEntry.create({
    data: { employeeId: user.employeeId, clockIn: new Date(), source: "CLOCK" },
  });
  revalidatePath("/time");
  revalidatePath("/dashboard");
}

/** Clock out the signed-in employee. */
export async function clockOut(): Promise<void> {
  const user = await requireUser();
  if (!user.employeeId) return;
  if (!(await getEntitlement(user.companyId)).entitled) return;
  const open = await openEntryFor(user.employeeId);
  if (!open) return;
  await prisma.timeEntry.update({
    where: { id: open.id },
    data: { clockOut: new Date() },
  });
  revalidatePath("/time");
  revalidatePath("/dashboard");
}

const manualEntrySchema = z.object({
  employeeId: z.string().min(1, "Pick an employee"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
  timeIn: z.string().regex(/^\d{2}:\d{2}$/, "Time in is required"),
  timeOut: z.string().regex(/^\d{2}:\d{2}$/, "Time out is required"),
});

/** Admin: add a manual time entry. Shifts past midnight roll into the next day. */
export async function addManualEntry(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireAdmin();
  if (!(await getEntitlement(user.companyId)).entitled) {
    return { error: LOCKED_MESSAGE };
  }
  const parsed = manualEntrySchema.safeParse({
    employeeId: formData.get("employeeId"),
    date: formData.get("date"),
    timeIn: formData.get("timeIn"),
    timeOut: formData.get("timeOut"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { employeeId, date, timeIn, timeOut } = parsed.data;

  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, companyId: user.companyId },
    select: { id: true },
  });
  if (!employee) return { error: "Employee not found" };

  const clockIn = new Date(`${date}T${timeIn}`);
  const clockOut = new Date(`${date}T${timeOut}`);
  if (clockOut <= clockIn) clockOut.setDate(clockOut.getDate() + 1); // overnight shift

  await prisma.timeEntry.create({
    data: { employeeId, clockIn, clockOut, source: "MANUAL" },
  });
  revalidatePath("/time");
}

/** Admin: remove a time entry. */
export async function deleteEntry(entryId: string): Promise<void> {
  const user = await requireAdmin();
  if (!(await getEntitlement(user.companyId)).entitled) return;
  await prisma.timeEntry.deleteMany({
    where: { id: entryId, employee: { companyId: user.companyId } },
  });
  revalidatePath("/time");
}
