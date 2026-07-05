// In-memory rate limiter (resets on cold starts — acceptable for MVP)
const store = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  options: { limit: number; windowMs: number },
): { success: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + options.windowMs });
    return { success: true };
  }
  if (entry.count >= options.limit) {
    return { success: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count++;
  return { success: true };
}

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of store) {
    if (now > value.resetAt) store.delete(key);
  }
}, 60_000);
