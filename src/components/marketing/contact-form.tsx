"use client";

import { useActionState } from "react";
import { sendContactMessage } from "@/lib/actions/contact-actions";

export function ContactForm() {
  const [state, action, pending] = useActionState(sendContactMessage, undefined);

  if (state?.success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <div className="text-3xl">🎉</div>
        <h3 className="mt-2 text-lg font-semibold text-emerald-900">
          Message sent — salamat!
        </h3>
        <p className="mt-1 text-sm text-emerald-700">
          Our team will get back to you within one business day.
        </p>
      </div>
    );
  }

  const inputCls =
    "w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <input name="name" required placeholder="Your name" className={inputCls} aria-label="Your name" />
        <input
          name="email"
          type="email"
          required
          placeholder="you@restaurant.ph"
          className={inputCls}
          aria-label="Email"
        />
      </div>
      <input
        name="company"
        placeholder="Company / restaurant name (optional)"
        className={inputCls}
        aria-label="Company"
      />
      <textarea
        name="message"
        required
        rows={4}
        placeholder="Tell us about your team — headcount, branches, what you need…"
        className={inputCls}
        aria-label="Message"
      />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 sm:w-auto sm:px-8"
      >
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
