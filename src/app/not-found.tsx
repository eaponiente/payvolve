import { ButtonLink, Card } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-1 items-center justify-center px-4">
      <Card className="max-w-md p-8 text-center">
        <h1 className="text-lg font-semibold tracking-tight">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          The page you&apos;re looking for doesn&apos;t exist or may have
          moved.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <ButtonLink href="/dashboard">Go to dashboard</ButtonLink>
          <ButtonLink href="/" variant="secondary">
            Back to home
          </ButtonLink>
        </div>
      </Card>
    </div>
  );
}
