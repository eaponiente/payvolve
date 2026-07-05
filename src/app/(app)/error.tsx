"use client";

import { Button, ButtonLink, Card } from "@/components/ui";

export default function AppErrorBoundary({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 items-center justify-center py-16">
      <Card className="max-w-md p-8 text-center">
        <h1 className="text-lg font-semibold tracking-tight">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Please try again or contact support if the problem continues.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={reset}>Try again</Button>
          <ButtonLink href="/dashboard" variant="secondary">
            Back to dashboard
          </ButtonLink>
        </div>
      </Card>
    </div>
  );
}
