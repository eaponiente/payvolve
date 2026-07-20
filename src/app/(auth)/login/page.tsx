"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { login, loginWithPin } from "@/lib/actions/auth-actions";
import { Button, Card, ErrorText, Field, Input } from "@/components/ui";

const MODES = [
  { key: "password", label: "Email" },
  { key: "pin", label: "Staff PIN" },
] as const;

type Mode = (typeof MODES)[number]["key"];

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("password");
  const [pwState, pwAction, pwPending] = useActionState(login, undefined);
  const [pinState, pinAction, pinPending] = useActionState(loginWithPin, undefined);

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm p-8">
        <div className="mb-6 text-center">
          <div className="text-2xl font-bold tracking-tight">
            Pondo<span className="text-emerald-600">Flow</span>
          </div>
          <p className="mt-1 text-sm text-zinc-500">Sign in to your account</p>
        </div>

        <div className="mb-5 inline-flex w-full rounded-lg border border-zinc-200 bg-zinc-50 p-0.5">
          {MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMode(m.key)}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === m.key
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {mode === "password" ? (
          <form action={pwAction} className="space-y-4">
            <Field label="Email">
              <Input name="email" type="email" required autoComplete="email" />
            </Field>
            <Field label="Password">
              <Input
                name="password"
                type="password"
                required
                autoComplete="current-password"
              />
            </Field>
            <ErrorText>{pwState?.error}</ErrorText>
            <Button type="submit" disabled={pwPending} className="w-full">
              {pwPending ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        ) : (
          <form action={pinAction} className="space-y-4">
            <Field label="Login code">
              <Input
                name="loginCode"
                required
                autoComplete="username"
                placeholder="MARIA-042"
                className="uppercase"
              />
            </Field>
            <Field label="PIN">
              <Input
                name="pin"
                type="password"
                required
                inputMode="numeric"
                pattern="\d{4,6}"
                autoComplete="current-password"
                placeholder="••••"
              />
            </Field>
            <ErrorText>{pinState?.error}</ErrorText>
            <Button type="submit" disabled={pinPending} className="w-full">
              {pinPending ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-zinc-500">
          No account yet?{" "}
          <Link href="/signup" className="font-medium text-emerald-600 hover:underline">
            Create your company
          </Link>
        </p>
      </Card>
    </main>
  );
}
