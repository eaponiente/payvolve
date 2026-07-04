"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/lib/actions/auth-actions";
import { Button, Card, ErrorText, Field, Input } from "@/components/ui";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm p-8">
        <div className="mb-6 text-center">
          <div className="text-2xl font-bold tracking-tight">
            Pay<span className="text-emerald-600">volve</span>
          </div>
          <p className="mt-1 text-sm text-zinc-500">Sign in to your account</p>
        </div>
        <form action={action} className="space-y-4">
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
          <ErrorText>{state?.error}</ErrorText>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
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
