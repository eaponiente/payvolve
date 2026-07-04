import { requireAdmin } from "@/lib/tenant";
import {
  previousSemiMonthlyPeriod,
  toDateInputValue,
} from "@/lib/payroll/period";
import { PageHeader } from "@/components/ui";
import { PayrollRunForm } from "@/components/payroll-run-form";

export default async function NewPayrollRunPage() {
  await requireAdmin();

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
      <PayrollRunForm
        defaultStart={toDateInputValue(period.start)}
        defaultEnd={toDateInputValue(period.end)}
        defaultPayout={toDateInputValue(payout)}
      />
    </div>
  );
}
