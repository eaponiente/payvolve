"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup } from "@/lib/actions/auth-actions";
import { Button, Card, ErrorText, Field, Input } from "@/components/ui";

export default function SignupPage() {
  const [state, action, pending] = useActionState(signup, undefined);

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm p-8">
        <div className="mb-6 text-center">
          <div className="text-2xl font-bold tracking-tight">
            Pay<span className="text-emerald-600">volve</span>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            Set up payroll for your company
          </p>
        </div>
        <form action={action} className="space-y-4">
          <Field label="Company name">
            <Input name="companyName" required placeholder="Kanto Kitchen Inc." />
          </Field>
          <Field label="Work email">
            <Input name="email" type="email" required autoComplete="email" />
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
          <ErrorText>{state?.error}</ErrorText>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Creating…" : "Create account"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-emerald-600 hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </main>
  );
}
