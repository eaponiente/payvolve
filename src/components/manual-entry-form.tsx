"use client";

import { useActionState } from "react";
import { addManualEntry } from "@/lib/actions/time-actions";
import { Button, Card, ErrorText, Field, Input, Select } from "@/components/ui";

export function ManualEntryForm({
  employees,
}: {
  employees: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(addManualEntry, undefined);

  return (
    <Card className="p-4">
      <form action={action} className="flex flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1">
          <Field label="Employee">
            <Select name="employeeId" required defaultValue="">
              <option value="" disabled>
                Select…
              </option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Date">
          <Input name="date" type="date" required />
        </Field>
        <Field label="Time in">
          <Input name="timeIn" type="time" required />
        </Field>
        <Field label="Time out">
          <Input name="timeOut" type="time" required />
        </Field>
        <Button type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add entry"}
        </Button>
        {state?.error && (
          <div className="w-full">
            <ErrorText>{state.error}</ErrorText>
          </div>
        )}
      </form>
      <p className="mt-2 text-xs text-zinc-500">
        Overnight shifts are supported — a time out earlier than time in rolls into the next day.
      </p>
    </Card>
  );
}
