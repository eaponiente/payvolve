"use client";

import { useActionState, useState } from "react";
import type { FormState } from "@/lib/actions/auth-actions";
import { Button, Card, ErrorText, Field, Input } from "@/components/ui";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

const METHODS = [
  { key: "password", label: "Email & password" },
  { key: "pin", label: "Login code & PIN" },
] as const;

type Method = (typeof METHODS)[number]["key"];

export function AddLoginForm({
  passwordAction,
  pinAction,
}: {
  passwordAction: Action;
  pinAction: Action;
}) {
  const [method, setMethod] = useState<Method>("password");
  const [pwState, pwFormAction, pwPending] = useActionState(passwordAction, undefined);
  const [pinState, pinFormAction, pinPending] = useActionState(pinAction, undefined);

  return (
    <Card className="mb-6 space-y-4 p-6">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Add login
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Give this employee a login to clock in/out and view their payslips.
        </p>
      </div>

      <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5">
        {METHODS.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMethod(m.key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              method === m.key
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {method === "password" ? (
        <form action={pwFormAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email">
              <Input
                name="email"
                type="email"
                required
                autoComplete="off"
                placeholder="crew@example.com"
              />
            </Field>
            <Field label="Password">
              <Input
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </Field>
          </div>
          <ErrorText>{pwState?.error}</ErrorText>
          <Button type="submit" disabled={pwPending}>
            {pwPending ? "Creating…" : "Create login"}
          </Button>
        </form>
      ) : (
        <form action={pinFormAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Login code">
              <Input
                name="loginCode"
                required
                autoComplete="off"
                placeholder="MARIA-042"
                className="uppercase"
              />
            </Field>
            <Field label="PIN (4–6 digits)">
              <Input
                name="pin"
                required
                inputMode="numeric"
                pattern="\d{4,6}"
                placeholder="••••"
                autoComplete="off"
              />
            </Field>
          </div>
          <p className="text-xs text-zinc-500">
            The employee signs in with this login code and PIN instead of an email
            and password. Share it with them privately.
          </p>
          <ErrorText>{pinState?.error}</ErrorText>
          <Button type="submit" disabled={pinPending}>
            {pinPending ? "Creating…" : "Create PIN login"}
          </Button>
        </form>
      )}
    </Card>
  );
}
