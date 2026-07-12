import { prisma } from "@/lib/db";
import { requireDev } from "@/lib/dev";
import { computeBill } from "@/lib/billing/pricing";
import { phpFormat } from "@/lib/payroll/money";
import {
  activateSubscriptionAsDev,
  deactivateSubscriptionAsDev,
} from "@/lib/actions/dev-actions";
import { Badge, Button, Card, PageHeader, Td, Th } from "@/components/ui";

const dateFmt = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const MONTH_OPTIONS = [1, 3, 6, 12];

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

export default async function DevSubscriptionsPage() {
  await requireDev();

  const [companies, activeCounts] = await Promise.all([
    prisma.company.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        subscription: true,
        users: { where: { role: "OWNER" }, select: { email: true } },
      },
    }),
    prisma.employee.groupBy({
      by: ["companyId"],
      where: { active: true },
      _count: true,
    }),
  ]);

  const countByCompany = new Map(activeCounts.map((c) => [c.companyId, c._count]));

  return (
    <>
      <PageHeader
        title="Subscriptions"
        subtitle={`${companies.length} company(ies) · activate after a manual (bank/GCash) payment`}
        action={<Badge tone="amber">Dev</Badge>}
      />

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[820px]">
          <thead className="border-b border-zinc-200">
            <tr>
              <Th>Company</Th>
              <Th>Owner</Th>
              <Th className="text-right">Active EE</Th>
              <Th className="text-right">Est. / mo</Th>
              <Th>Status</Th>
              <Th />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {companies.map((c) => {
              const count = countByCompany.get(c.id) ?? 0;
              const bill = computeBill(count, c.subscription?.includeEwa ?? false);
              const status = c.subscription?.status;
              const isActive = status === "ACTIVE";
              return (
                <tr key={c.id} className="align-middle hover:bg-zinc-50">
                  <Td className="font-medium">{c.name}</Td>
                  <Td className="text-zinc-500">
                    {c.users.map((u) => u.email).join(", ") || "—"}
                  </Td>
                  <Td className="text-right tabular-nums">{count}</Td>
                  <Td className="text-right tabular-nums">{phpFormat(bill.total)}</Td>
                  <Td>
                    {status ? (
                      <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>
                    ) : (
                      <Badge tone="zinc">No subscription</Badge>
                    )}
                    {isActive && c.subscription?.currentPeriodEnd && (
                      <div className="mt-1 text-xs text-zinc-400">
                        Paid through {dateFmt.format(c.subscription.currentPeriodEnd)}
                      </div>
                    )}
                  </Td>
                  <Td className="text-right">
                    {isActive ? (
                      <form action={deactivateSubscriptionAsDev}>
                        <input type="hidden" name="companyId" value={c.id} />
                        <Button variant="danger">Deactivate</Button>
                      </form>
                    ) : (
                      <form
                        action={activateSubscriptionAsDev}
                        className="flex items-center justify-end gap-2"
                      >
                        <input type="hidden" name="companyId" value={c.id} />
                        <label className="sr-only" htmlFor={`months-${c.id}`}>
                          Months
                        </label>
                        <select
                          id={`months-${c.id}`}
                          name="months"
                          defaultValue={1}
                          className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm"
                        >
                          {MONTH_OPTIONS.map((m) => (
                            <option key={m} value={m}>
                              {m} mo
                            </option>
                          ))}
                        </select>
                        <Button>Activate</Button>
                      </form>
                    )}
                  </Td>
                </tr>
              );
            })}
            {companies.length === 0 && (
              <tr>
                <Td colSpan={6} className="py-10 text-center text-zinc-500">
                  No companies yet.
                </Td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <p className="mt-3 text-xs text-zinc-400">
        Pick how many months were paid, then Activate. This records a PAID invoice
        (monthly rate × months) and unlocks scheduling &amp; payroll until the
        paid-through date, after which access auto-lapses. Use this once you&apos;ve
        confirmed the customer&apos;s bank transfer or GCash payment.
      </p>
    </>
  );
}
