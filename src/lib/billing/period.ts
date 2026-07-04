/** Billing period = calendar month. */

export type BillingPeriod = { start: Date; end: Date };

export function currentBillingPeriod(now = new Date()): BillingPeriod {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function daysUntil(date: Date, now = new Date()): number {
  return Math.ceil((date.getTime() - now.getTime()) / 86_400_000);
}

export function formatMonth(date: Date): string {
  return new Intl.DateTimeFormat("en-PH", { month: "long", year: "numeric" }).format(date);
}
