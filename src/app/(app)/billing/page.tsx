import { requireOwner } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { getOrCreateSubscription, isEntitled } from "@/lib/billing/subscription";
import { computeBill } from "@/lib/billing/pricing";
import { currentBillingPeriod, daysUntil, formatMonth } from "@/lib/billing/period";
import { phpFormat } from "@/lib/payroll/money";
import {
  cancelSubscription,
  payInvoice,
  subscribe,
  toggleEwa,
} from "@/lib/actions/billing-actions";
import { Badge, Button, Card, PageHeader, Td, Th } from "@/components/ui";

const dateFmt = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const STATUS_TONE = {
  ACTIVE: "emerald",
  TRIALING: "amber",
  PAST_DUE: "amber",
  CANCELED: "zinc",
} as const;

const STATUS_LABEL = {
  ACTIVE: "Active",
  TRIALING: "Free trial",
  PAST_DUE: "Past due",
  CANCELED: "Canceled",
} as const;

export default async function BillingPage() {
  const user = await requireOwner();
  const [sub, activeCount, invoices] = await Promise.all([
    getOrCreateSubscription(user.companyId),
    prisma.employee.count({ where: { companyId: user.companyId, active: true } }),
    prisma.invoice.findMany({
      where: { companyId: user.companyId },
      orderBy: { periodStart: "desc" },
    }),
  ]);

  const bill = computeBill(activeCount, sub.includeEwa);
  const period = currentBillingPeriod();
  const entitled = isEntitled(sub);
  const trialLeft =
    sub.status === "TRIALING" && sub.trialEndsAt ? daysUntil(sub.trialEndsAt) : null;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Billing"
        subtitle="Your PondoFlow subscription and invoices."
        action={<Badge tone={STATUS_TONE[sub.status]}>{STATUS_LABEL[sub.status]}</Badge>}
      />

      {sub.status === "TRIALING" && (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {trialLeft !== null && trialLeft > 0
            ? `Free trial — ${trialLeft} day(s) left. Subscribe anytime to keep payroll running.`
            : "Your free trial has ended. Subscribe to continue."}
        </p>
      )}
      {!entitled && sub.status !== "TRIALING" && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Subscription {STATUS_LABEL[sub.status].toLowerCase()}. Subscribe to restore access.
        </p>
      )}

      {/* Plan / estimate */}
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              {formatMonth(period.start)} estimate
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              Billed on {activeCount} active employee(s).
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold tabular-nums">{phpFormat(bill.total)}</div>
            <div className="text-xs text-zinc-400">/ month</div>
          </div>
        </div>

        <table className="mt-4 w-full text-sm">
          <tbody className="divide-y divide-zinc-100">
            {bill.lines.map((line, i) => (
              <tr key={i}>
                <td className="py-2">
                  {line.label}
                  {line.detail && (
                    <span className="ml-1 text-xs text-zinc-400">({line.detail})</span>
                  )}
                </td>
                <td className="py-2 text-right tabular-nums">{phpFormat(line.amount)}</td>
              </tr>
            ))}
            <tr className="border-t border-zinc-300 font-semibold">
              <td className="py-2">Total / month</td>
              <td className="py-2 text-right tabular-nums">{phpFormat(bill.total)}</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {sub.status === "ACTIVE" ? (
            <form action={cancelSubscription}>
              <Button variant="danger">Cancel subscription</Button>
            </form>
          ) : (
            <form action={subscribe}>
              <Button>
                {sub.status === "TRIALING" ? "Subscribe now" : "Reactivate subscription"}
              </Button>
            </form>
          )}
          <form action={toggleEwa}>
            <Button variant="secondary">
              {sub.includeEwa ? "Remove Earned Wage Access" : "Add Earned Wage Access (+₱100/employee)"}
            </Button>
          </form>
        </div>
        <p className="mt-3 text-xs text-zinc-400">
          Payments are simulated in this build — no real charge is made. The provider
          integration point is stubbed for PayMongo/Stripe.
        </p>
      </Card>

      {/* Invoice history */}
      <h2 className="mt-8 mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Invoices
      </h2>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[560px]">
          <thead className="border-b border-zinc-200">
            <tr>
              <Th>Period</Th>
              <Th className="text-right">Employees</Th>
              <Th className="text-right">Amount</Th>
              <Th>Status</Th>
              <Th />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-zinc-50">
                <Td className="font-medium">{formatMonth(inv.periodStart)}</Td>
                <Td className="text-right tabular-nums">{inv.employeeCount}</Td>
                <Td className="text-right tabular-nums">{phpFormat(Number(inv.total))}</Td>
                <Td>
                  {inv.status === "PAID" ? (
                    <Badge tone="emerald">
                      Paid {inv.paidAt ? `· ${dateFmt.format(inv.paidAt)}` : ""}
                    </Badge>
                  ) : inv.status === "OPEN" ? (
                    <Badge tone="amber">Open</Badge>
                  ) : (
                    <Badge>Void</Badge>
                  )}
                </Td>
                <Td className="text-right">
                  {inv.status === "OPEN" && (
                    <form
                      action={async () => {
                        "use server";
                        await payInvoice(inv.id);
                      }}
                    >
                      <button className="text-sm font-medium text-emerald-700 hover:underline">
                        Pay now
                      </button>
                    </form>
                  )}
                </Td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <Td colSpan={5} className="py-10 text-center text-zinc-500">
                  No invoices yet. Subscribe to generate your first invoice.
                </Td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
