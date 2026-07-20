"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { deleteRun, finalizeRun, recomputeRun } from "@/lib/actions/payroll-actions";
import { Button, ErrorText } from "@/components/ui";

type Confirm = {
  title: string;
  body: string;
  confirmLabel: string;
  variant: "primary" | "danger";
  run: () => Promise<{ error?: string } | undefined>;
};

export function PayrollRunActions({ runId }: { runId: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);

  // Sync the native <dialog> with the pending confirmation.
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (confirm && !dlg.open) dlg.showModal();
    if (!confirm && dlg.open) dlg.close();
  }, [confirm]);

  // Run a server action, surfacing any returned error. Redirecting actions
  // (delete) never resolve with a value, so there's nothing to show on success.
  function run(action: () => Promise<{ error?: string } | undefined>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result?.error) setError(result.error);
    });
  }

  function onConfirm() {
    if (!confirm) return;
    const action = confirm.run;
    setConfirm(null);
    run(action);
  }

  return (
    <>
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant="danger"
            disabled={pending}
            onClick={() =>
              setConfirm({
                title: "Delete draft run?",
                body: "This permanently removes the draft and its computed payslips. This cannot be undone.",
                confirmLabel: "Delete draft",
                variant: "danger",
                run: () => deleteRun(runId),
              })
            }
          >
            Delete draft
          </Button>
          <Button
            variant="secondary"
            disabled={pending}
            onClick={() => run(() => recomputeRun(runId))}
          >
            {pending ? "Working…" : "Recompute"}
          </Button>
          <Button
            disabled={pending}
            onClick={() =>
              setConfirm({
                title: "Finalize this run?",
                body: "Finalizing locks the run and makes payslips visible to employees. This cannot be undone.",
                confirmLabel: "Finalize run",
                variant: "primary",
                run: () => finalizeRun(runId),
              })
            }
          >
            Finalize run
          </Button>
        </div>
        <ErrorText>{error}</ErrorText>
      </div>

      <dialog
        ref={dialogRef}
        onClose={() => setConfirm(null)}
        className="m-auto w-[min(26rem,92vw)] rounded-2xl p-0 backdrop:bg-black/40"
      >
        {confirm && (
          <div className="p-6">
            <h2 className="text-lg font-semibold">{confirm.title}</h2>
            <p className="mt-2 text-sm text-zinc-600">{confirm.body}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirm(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
              >
                Cancel
              </button>
              <Button variant={confirm.variant} onClick={onConfirm}>
                {confirm.confirmLabel}
              </Button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
