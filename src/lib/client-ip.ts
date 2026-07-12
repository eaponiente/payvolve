import { headers } from "next/headers";

/** Best-effort client IP from proxy headers, for rate-limiting keys. */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwardedFor = h.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}
