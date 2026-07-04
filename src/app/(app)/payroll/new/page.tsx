import { requireAdmin } from "@/lib/tenant";
import {
  previousSemiMonthlyPeriod,
  toDateInputValue,
} from "@/lib/payroll/period";
import { getEntitlement } from "@/lib/billing/subscription";
import { ButtonLink, Card, PageHeader } from "@/components/ui";
import { PayrollRunForm } from "@/components/payroll-run-form";

export default async function NewPayrollRunPage() {
  const user = await requireAdmin();
  const { entitled } = await getEntitlement(user.companyId);

  // Default to the most recently completed cutoff, payout 5 days after it ends.
  const period = previousSemiMonthlyPeriod(new Date());
  const payout = new Date(period.end);
  payout.setDate(payout.getDate() + 5);

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader
        title="New payroll run"
        subtitle="Computes a draft you can review before finalizing."
      />
      {entitled ? (
        <PayrollRunForm
          defaultStart={toDateInputValue(period.start)}
          defaultEnd={toDateInputValue(period.end)}
          defaultPayout={toDateInputValue(payout)}
        />
      ) : (
        <Card className="p-8 text-center">
          <p className="text-sm font-medium text-amber-700">Payroll is locked</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500">
            Your subscription is inactive. Reactivate it to create and finalize
            payroll runs.
          </p>
          <div className="mt-6">
            <ButtonLink href="/billing">Go to Billing</ButtonLink>
          </div>
        </Card>
      )}
    </div>
  );
}
