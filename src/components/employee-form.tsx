"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/actions/auth-actions";
import {
  Button,
  ButtonLink,
  Card,
  ErrorText,
  Field,
  Input,
  Select,
} from "@/components/ui";

export type EmployeeFormValues = {
  firstName: string;
  lastName: string;
  position: string;
  hireDate: string; // yyyy-mm-dd
  payType: "MONTHLY" | "DAILY" | "HOURLY";
  baseRate: number;
  tin: string;
  sssNumber: string;
  philhealthNumber: string;
  pagibigNumber: string;
  active: boolean;
  hasAccount: boolean;
};

export function EmployeeForm({
  action,
  defaults,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  defaults?: EmployeeFormValues;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const isEdit = Boolean(defaults);

  return (
    <form action={formAction} className="space-y-6">
      <Card className="space-y-4 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Profile
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name">
            <Input name="firstName" required defaultValue={defaults?.firstName} />
          </Field>
          <Field label="Last name">
            <Input name="lastName" required defaultValue={defaults?.lastName} />
          </Field>
          <Field label="Position">
            <Input name="position" defaultValue={defaults?.position} placeholder="Line Cook" />
          </Field>
          <Field label="Hire date">
            <Input name="hireDate" type="date" required defaultValue={defaults?.hireDate} />
          </Field>
        </div>
        {isEdit && (
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              name="active"
              defaultChecked={defaults?.active}
              className="h-4 w-4 rounded border-zinc-300 accent-emerald-600"
            />
            Active (included in payroll runs)
          </label>
        )}
      </Card>

      <Card className="space-y-4 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Pay setup
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Pay type">
            <Select name="payType" defaultValue={defaults?.payType ?? "DAILY"}>
              <option value="MONTHLY">Monthly salary</option>
              <option value="DAILY">Daily rate</option>
              <option value="HOURLY">Hourly rate</option>
            </Select>
          </Field>
          <Field label="Base rate (₱)">
            <Input
              name="baseRate"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={defaults?.baseRate}
              placeholder="645.00"
            />
          </Field>
        </div>
        <p className="text-xs text-zinc-500">
          Monthly salary, daily rate, or hourly rate depending on pay type.
        </p>
      </Card>

      <Card className="space-y-4 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Government IDs
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="TIN">
            <Input name="tin" defaultValue={defaults?.tin} placeholder="000-000-000-000" />
          </Field>
          <Field label="SSS number">
            <Input name="sssNumber" defaultValue={defaults?.sssNumber} placeholder="00-0000000-0" />
          </Field>
          <Field label="PhilHealth number">
            <Input
              name="philhealthNumber"
              defaultValue={defaults?.philhealthNumber}
              placeholder="00-000000000-0"
            />
          </Field>
          <Field label="Pag-IBIG MID">
            <Input
              name="pagibigNumber"
              defaultValue={defaults?.pagibigNumber}
              placeholder="0000-0000-0000"
            />
          </Field>
        </div>
      </Card>

      {!isEdit && (
        <Card className="space-y-4 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Self-service account (optional)
          </h2>
          <p className="text-sm text-zinc-500">
            Give this employee a login to clock in/out and view payslips.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email">
              <Input name="accountEmail" type="email" placeholder="crew@example.com" />
            </Field>
            <Field label="Password">
              <Input name="accountPassword" type="password" minLength={8} />
            </Field>
          </div>
        </Card>
      )}

      <ErrorText>{state?.error}</ErrorText>
      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : isEdit ? "Save changes" : "Add employee"}
        </Button>
        <ButtonLink href="/employees" variant="secondary">
          Cancel
        </ButtonLink>
      </div>
    </form>
  );
}
