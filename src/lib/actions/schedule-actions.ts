"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/tenant";
import type { FormState } from "@/lib/actions/auth-actions";

const shiftSchema = z.object({
  employeeId: z.string().min(1, "Pick an employee"),
  dates: z
    .array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"))
    .min(1, "Pick at least one day"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Start time is required"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "End time is required"),
  role: z.string().trim().default(""),
  notes: z.string().trim().default(""),
});

/**
 * Admin: schedule the same shift across one or more days.
 * End time before start rolls each shift to the next day (overnight).
 */
export async function createShift(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireAdmin();
  const parsed = shiftSchema.safeParse({
    employeeId: formData.get("employeeId"),
    dates: formData.getAll("dates"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    role: formData.get("role") ?? "",
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { employeeId, dates, startTime, endTime, role, notes } = parsed.data;

  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, companyId: user.companyId },
    select: { id: true },
  });
  if (!employee) return { error: "Employee not found" };

  // De-dupe in case the same day is submitted twice.
  const uniqueDates = [...new Set(dates)];
  const data = uniqueDates.map((date) => {
    const startsAt = new Date(`${date}T${startTime}`);
    const endsAt = new Date(`${date}T${endTime}`);
    if (endsAt <= startsAt) endsAt.setDate(endsAt.getDate() + 1);
    return { companyId: user.companyId, employeeId, startsAt, endsAt, role, notes };
  });

  await prisma.shift.createMany({ data });
  revalidatePath("/schedule");
  return { success: true };
}

/** Admin: remove a scheduled shift. */
export async function deleteShift(shiftId: string): Promise<void> {
  const user = await requireAdmin();
  await prisma.shift.deleteMany({
    where: { id: shiftId, companyId: user.companyId },
  });
  revalidatePath("/schedule");
}
