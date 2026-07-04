import { prisma } from "@/lib/db";
import { addDays, currentBillingPeriod } from "./period";
import { TRIAL_DAYS } from "./pricing";

/**
 * Fetch a company's subscription, lazily creating a trialing one if missing.
 * This keeps every company billable even if it predates the billing feature.
 */
export async function getOrCreateSubscription(companyId: string) {
  const existing = await prisma.subscription.findUnique({ where: { companyId } });
  if (existing) return existing;

  const period = currentBillingPeriod();
  return prisma.subscription.create({
    data: {
      companyId,
      status: "TRIALING",
      trialEndsAt: addDays(new Date(), TRIAL_DAYS),
      currentPeriodStart: period.start,
      currentPeriodEnd: period.end,
    },
  });
}

/** True when the company can use paid features (active, or still within trial). */
export function isEntitled(sub: {
  status: string;
  trialEndsAt: Date | null;
}): boolean {
  if (sub.status === "ACTIVE") return true;
  if (sub.status === "TRIALING") {
    return !sub.trialEndsAt || sub.trialEndsAt.getTime() > Date.now();
  }
  return false;
}
