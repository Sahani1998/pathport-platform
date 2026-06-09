// Simple sliding-window rate limiter — per function instance in memory.
// Good for low-traffic apps; for multi-region scale upgrade to @upstash/ratelimit.

interface Entry { count: number; resetAt: number }
const store = new Map<string, Entry>();

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(
  key: string,
  limit = 10,
  windowMs = 60_000,
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { success: true, remaining: limit - 1, resetAt };
  }
  if (entry.count >= limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }
  entry.count++;
  return { success: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

export function rateLimitResponse(resetAt: number): Response {
  return new Response(
    JSON.stringify({ error: "Too many requests. Please try again later." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
      },
    },
  );
}
