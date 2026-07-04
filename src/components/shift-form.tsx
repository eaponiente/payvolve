"use client";

import { useActionState } from "react";
import { createShift } from "@/lib/actions/schedule-actions";
import { Button, Card, ErrorText, Field, Input, Select } from "@/components/ui";

export function ShiftForm({
  employees,
  weekDays,
}: {
  employees: { id: string; name: string }[];
  weekDays: { value: string; label: string }[];
}) {
  const [state, action, pending] = useActionState(createShift, undefined);

  return (
    <Card className="p-4">
      <form action={action} className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-44 flex-1">
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
          <Field label="Start">
            <Input name="startTime" type="time" required defaultValue="09:00" />
          </Field>
          <Field label="End">
            <Input name="endTime" type="time" required defaultValue="17:00" />
          </Field>
          <Field label="Role">
            <Input name="role" placeholder="Server" className="w-32" />
          </Field>
          <Button type="submit" disabled={pending}>
            {pending ? "Adding…" : "Add shift(s)"}
          </Button>
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-zinc-700">
            Days this week
          </span>
          <div className="flex flex-wrap gap-2">
            {weekDays.map((d, i) => (
              <label key={d.value} className="cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="dates"
                  value={d.value}
                  defaultChecked={i === 0}
                  className="peer sr-only"
                />
                <span className="inline-block rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:border-zinc-400 peer-checked:border-emerald-500 peer-checked:bg-emerald-50 peer-checked:font-medium peer-checked:text-emerald-700">
                  {d.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {state?.error && <ErrorText>{state.error}</ErrorText>}
        {state?.success && (
          <p className="text-sm font-medium text-emerald-600">Shifts added ✓</p>
        )}
      </form>
      <p className="mt-2 text-xs text-zinc-500">
        Tick multiple days to schedule the same shift across the week. Overnight
        shifts (end time before start) roll into the next day.
      </p>
    </Card>
  );
}
