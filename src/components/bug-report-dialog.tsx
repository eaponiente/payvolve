"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { submitBugReport } from "@/lib/actions/bug-actions";

export function BugReportDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, action, pending] = useActionState(submitBugReport, undefined);
  const [open, setOpen] = useState(false);
  // Controlled so values survive re-renders (e.g. after a validation error).
  const [name, setName] = useState("");
  const [feedback, setFeedback] = useState("");

  // Sync the native <dialog> with our open state.
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open && !dlg.open) dlg.showModal();
    if (!open && dlg.open) dlg.close();
  }, [open]);

  // On success: auto-close shortly after (the success view replaces the form,
  // and fields are reset when the dialog is next opened).
  useEffect(() => {
    if (!state?.success) return;
    const t = setTimeout(() => setOpen(false), 1400);
    return () => clearTimeout(t);
  }, [state?.success]);

  const inputCls =
    "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setName("");
          setFeedback("");
          setOpen(true);
        }}
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-emerald-700"
      >
        🐞 Report a bug
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        className="m-auto w-[min(28rem,92vw)] rounded-2xl p-0 backdrop:bg-black/40"
      >
        <div className="p-6">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold">Report a bug</h2>
              <p className="text-sm text-zinc-500">
                Tell us what went wrong — it goes straight to the team.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
            >
              ✕
            </button>
          </div>

          {state?.success ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
              <div className="text-2xl">✅</div>
              <p className="mt-2 text-sm font-medium text-emerald-900">
                Thanks — bug reported!
              </p>
            </div>
          ) : (
            <form action={action} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  Your name
                </label>
                <input
                  name="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputCls}
                  placeholder="Juan dela Cruz"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  What happened?
                </label>
                <textarea
                  name="feedback"
                  required
                  rows={4}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className={inputCls}
                  placeholder="Describe the bug, what you expected, and how to reproduce it…"
                />
              </div>
              {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {pending ? "Sending…" : "Submit report"}
                </button>
              </div>
            </form>
          )}
        </div>
      </dialog>
    </>
  );
}
