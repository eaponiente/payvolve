"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireDev } from "@/lib/dev";
import { computeBill } from "@/lib/billing/pricing";
import { getOrCreateSubscription } from "@/lib/billing/subscription";

/**
 * Platform-dev subscription controls. Payments are currently collected manually
 * (bank transfer / GCash), so a dev flips a company to ACTIVE here once payment
 * is confirmed — no self-serve charge. Every action re-asserts `requireDev`.
 */

/**
 * Activate a company's subscription for a number of prepaid months and record a
 * matching PAID invoice. Access stays entitled until the paid-through date
 * (`currentPeriodEnd`), then auto-lapses (see `isEntitled`).
 */
export async function activateSubscriptionAsDev(formData: FormData): Promise<void> {
  await requireDev();
  const companyId = String(formData.get("companyId") ?? "").trim();
  const months = Math.min(12, Math.max(1, Math.floor(Number(formData.get("months")) || 1)));

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true },
  });
  if (!company) return;

  const sub = await getOrCreateSubscription(company.id);
  const count = await prisma.employee.count({
    where: { companyId: company.id, active: true },
  });
  const bill = computeBill(count, sub.includeEwa);

  // Paid window: from now through N months out.
  const start = new Date();
  const paidThrough = new Date(start);
  paidThrough.setMonth(paidThrough.getMonth() + months);

  await prisma.$transaction([
    prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: "ACTIVE",
        currentPeriodStart: start,
        currentPeriodEnd: paidThrough,
        canceledAt: null,
      },
    }),
    prisma.invoice.create({
      data: {
        companyId: company.id,
        periodStart: start,
        periodEnd: paidThrough,
        employeeCount: count,
        // Prepaid N months, so each line is the monthly amount × months.
        baseAmount: bill.base * months,
        perEmployeeTotal: bill.perEmployeeTotal * months,
        ewaTotal: bill.ewaTotal * months,
        total: bill.total * months,
        status: "PAID",
        paidAt: new Date(),
      },
    }),
  ]);
  revalidatePath("/dev/subscriptions");
}

/** Mark a company's subscription CANCELED — e.g. to undo an activation. */
export async function deactivateSubscriptionAsDev(formData: FormData): Promise<void> {
  await requireDev();
  const companyId = String(formData.get("companyId") ?? "").trim();
  if (!companyId) return;
  await prisma.subscription.updateMany({
    where: { companyId },
    data: { status: "CANCELED", canceledAt: new Date() },
  });
  revalidatePath("/dev/subscriptions");
}
