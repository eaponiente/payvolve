"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/tenant";
import { computeBill } from "@/lib/billing/pricing";
import { currentBillingPeriod } from "@/lib/billing/period";
import { getOrCreateSubscription } from "@/lib/billing/subscription";

/**
 * Simulated payment provider. Swap this single function for a real PayMongo /
 * Stripe charge (create a PaymentIntent, confirm it, return the reference).
 */
async function chargeCustomer(_companyId: string, _amount: number): Promise<{ ok: true }> {
  return { ok: true };
}

async function activeEmployeeCount(companyId: string): Promise<number> {
  return prisma.employee.count({ where: { companyId, active: true } });
}

/** Owner subscribes (from trial or canceled): create + pay this month's invoice, go ACTIVE. */
export async function subscribe(): Promise<void> {
  const user = await requireOwner();
  const sub = await getOrCreateSubscription(user.companyId);
  const period = currentBillingPeriod();
  const count = await activeEmployeeCount(user.companyId);
  const bill = computeBill(count, sub.includeEwa);

  await chargeCustomer(user.companyId, bill.total);

  await prisma.$transaction([
    prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: "ACTIVE",
        currentPeriodStart: period.start,
        currentPeriodEnd: period.end,
        canceledAt: null,
      },
    }),
    prisma.invoice.create({
      data: {
        companyId: user.companyId,
        periodStart: period.start,
        periodEnd: period.end,
        employeeCount: count,
        baseAmount: bill.base,
        perEmployeeTotal: bill.perEmployeeTotal,
        ewaTotal: bill.ewaTotal,
        total: bill.total,
        status: "PAID",
        paidAt: new Date(),
      },
    }),
  ]);
  revalidatePath("/billing");
}

/** Pay an OPEN invoice (e.g. a past-due renewal). */
export async function payInvoice(
  invoiceId: string,
): Promise<{ error?: string } | undefined> {
  const user = await requireOwner();
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, companyId: user.companyId, status: "OPEN" },
  });
  if (!invoice) return { error: "Invoice not found or already paid" };

  await chargeCustomer(user.companyId, Number(invoice.total));
  await prisma.$transaction([
    prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: "PAID", paidAt: new Date() },
    }),
    prisma.subscription.updateMany({
      where: { companyId: user.companyId },
      data: { status: "ACTIVE" },
    }),
  ]);
  revalidatePath("/billing");
}

/** Cancel the subscription (stays usable until the period ends in a real system). */
export async function cancelSubscription(): Promise<void> {
  const user = await requireOwner();
  await prisma.subscription.updateMany({
    where: { companyId: user.companyId },
    data: { status: "CANCELED", canceledAt: new Date() },
  });
  revalidatePath("/billing");
}

/** Toggle the Earned Wage Access add-on for future invoices. */
export async function toggleEwa(): Promise<void> {
  const user = await requireOwner();
  const sub = await getOrCreateSubscription(user.companyId);
  await prisma.subscription.update({
    where: { id: sub.id },
    data: { includeEwa: !sub.includeEwa },
  });
  revalidatePath("/billing");
}
