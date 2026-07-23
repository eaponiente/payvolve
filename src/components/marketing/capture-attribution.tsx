"use client";

import { useEffect } from "react";

/** First-touch attribution cookie: name + how long it survives. */
const COOKIE = "pf_attr";
const MAX_AGE_DAYS = 90;

/** Query params we treat as attribution signals. */
const PARAM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid",
] as const;

function hasCookie(name: string): boolean {
  return document.cookie.split("; ").some((c) => c.startsWith(`${name}=`));
}

/**
 * Records the visitor's first-touch marketing source in a cookie so the signup
 * server action can stamp it onto the new Company. First-touch = we never
 * overwrite an existing cookie, so the *original* source wins even if the
 * visitor later arrives via a different link. Effect-only; renders nothing.
 */
export function CaptureAttribution() {
  useEffect(() => {
    // First-touch: once set, leave it alone for the cookie's lifetime.
    if (hasCookie(COOKIE)) return;

    const params = new URLSearchParams(window.location.search);
    const data: Record<string, string> = {};
    for (const key of PARAM_KEYS) {
      const value = params.get(key);
      if (value) data[key] = value.slice(0, 300);
    }

    // Only record an external referrer (skip our own pages / empty referrers).
    const ref = document.referrer;
    if (ref && !ref.startsWith(window.location.origin)) {
      data.referrer = ref.slice(0, 300);
    }

    // Nothing to attribute (direct/organic with no params) — don't set a cookie,
    // so a later visit carrying real params can still become the first touch.
    if (Object.keys(data).length === 0) return;

    data.landingPath = window.location.pathname.slice(0, 300);

    const maxAge = MAX_AGE_DAYS * 24 * 60 * 60;
    document.cookie =
      `${COOKIE}=${encodeURIComponent(JSON.stringify(data))}; ` +
      `path=/; max-age=${maxAge}; SameSite=Lax`;
  }, []);

  return null;
}
