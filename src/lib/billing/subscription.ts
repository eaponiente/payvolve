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

/** True when the company can use paid features (active & paid-through, or still within trial). */
export function isEntitled(sub: {
  status: string;
  trialEndsAt: Date | null;
  currentPeriodEnd?: Date | null;
}): boolean {
  if (sub.status === "ACTIVE") {
    // Auto-lapse once the paid-through date passes. A missing end date is
    // treated as open-ended so legacy/edge rows aren't locked out.
    return !sub.currentPeriodEnd || sub.currentPeriodEnd.getTime() > Date.now();
  }
  if (sub.status === "TRIALING") {
    return !sub.trialEndsAt || sub.trialEndsAt.getTime() > Date.now();
  }
  return false;
}

export type Entitlement = {
  entitled: boolean;
  status: string;
  trialEndsAt: Date | null;
};

/** Resolve a company's current entitlement (used by pages, the layout, and action guards). */
export async function getEntitlement(companyId: string): Promise<Entitlement> {
  const sub = await getOrCreateSubscription(companyId);
  return { entitled: isEntitled(sub), status: sub.status, trialEndsAt: sub.trialEndsAt };
}

/** Shown when a locked write action is attempted. */
export const LOCKED_MESSAGE =
  "This company's subscription has lapsed. An owner must reactivate it in Billing to unlock scheduling and payroll.";
