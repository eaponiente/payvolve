"use client";

import { useActionState } from "react";
import { createPayrollRun } from "@/lib/actions/payroll-actions";
import {
  Button,
  ButtonLink,
  Card,
  ErrorText,
  Field,
  Input,
  Select,
} from "@/components/ui";

export function PayrollRunForm({
  defaultStart,
  defaultEnd,
  defaultPayout,
}: {
  defaultStart: string;
  defaultEnd: string;
  defaultPayout: string;
}) {
  const [state, action, pending] = useActionState(createPayrollRun, undefined);

  return (
    <form action={action}>
      <Card className="space-y-4 p-6">
        <Field label="Run type">
          <Select name="type" defaultValue="REGULAR">
            <option value="REGULAR">Regular (semi-monthly)</option>
            <option value="THIRTEENTH_MONTH">13th month pay</option>
          </Select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Period start">
            <Input name="periodStart" type="date" required defaultValue={defaultStart} />
          </Field>
          <Field label="Period end">
            <Input name="periodEnd" type="date" required defaultValue={defaultEnd} />
          </Field>
        </div>
        <Field label="Payout date">
          <Input name="payoutDate" type="date" required defaultValue={defaultPayout} />
        </Field>
        <p className="text-xs text-zinc-500">
          For 13th-month runs, the period start&apos;s year selects which calendar
          year of finalized basic pay is averaged.
        </p>
        <ErrorText>{state?.error}</ErrorText>
        <div className="flex gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Computing…" : "Compute draft"}
          </Button>
          <ButtonLink href="/payroll" variant="secondary">
            Cancel
          </ButtonLink>
        </div>
      </Card>
    </form>
  );
}
