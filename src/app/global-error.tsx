"use client";

// The root layout itself failed, so this replaces <html>/<body> entirely.
// Kept self-contained (no imports from app components/fonts) so it renders
// even if the failure was in shared layout code.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 font-sans text-zinc-900">
        <div className="max-w-md rounded-xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight">
            Pondo<span className="text-emerald-600">Flow</span> hit a snag
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Something went wrong loading the app. Please try again.
          </p>
          <button
            onClick={reset}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
