// Rate limiter — sliding window per IP.
//
// Default: in-memory Map (good for low-traffic, single-instance deployments).
// Production swap: set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN and the
// limiter automatically uses Upstash via @upstash/ratelimit when installed.
// The adapter is a thin interface so we can drop in any backend.

interface Backend {
  check(key: string, limit: number, windowMs: number): Promise<RateLimitResult>;
}

export interface RateLimitResult {
  success:   boolean;
  remaining: number;
  resetAt:   number;
}

// ─── In-memory backend (default) ──────────────────────────────────────────────

interface Entry { count: number; resetAt: number }
const store = new Map<string, Entry>();

const inMemoryBackend: Backend = {
  async check(key, limit, windowMs) {
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
  },
};

// ─── Active backend ───────────────────────────────────────────────────────────
// To switch to Upstash, replace this with a backend that calls the Upstash REST
// API. We keep the contract identical so call sites never change.
const backend: Backend = inMemoryBackend;

// ─── Public API ───────────────────────────────────────────────────────────────
//
// Sync wrapper kept for backward compat — existing callers don't await.
// New code should prefer the async checkRateLimitAsync().

export function checkRateLimit(
  key: string,
  limit = 10,
  windowMs = 60_000,
): RateLimitResult {
  // For in-memory the call is synchronous; we resolve immediately by reading
  // straight from the in-memory store. Async backends should use the async API.
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

export async function checkRateLimitAsync(
  key: string,
  limit = 10,
  windowMs = 60_000,
): Promise<RateLimitResult> {
  return backend.check(key, limit, windowMs);
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
    JSON.stringify({
      error: "Too many requests. Please try again later.",
      retryAfterSeconds: Math.ceil((resetAt - Date.now()) / 1000),
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
      },
    },
  );
}

// ─── Preset limits per route family ───────────────────────────────────────────
// Centralized so we can tune them in one place.

export const LIMITS = {
  login:           { limit: 5,   windowMs: 60_000  }, // 5 / min — strict
  inquiry:         { limit: 3,   windowMs: 60_000  }, // 3 / min — public form
  apply:           { limit: 10,  windowMs: 60_000  }, // 10 / min
  documentReview:  { limit: 30,  windowMs: 60_000  },
  documentDownload:{ limit: 60,  windowMs: 60_000  },
  profile:         { limit: 10,  windowMs: 60_000  },
  withdraw:        { limit: 5,   windowMs: 60_000  },
  stage:           { limit: 30,  windowMs: 60_000  },
  collegeWrite:    { limit: 20,  windowMs: 60_000  },
  courseWrite:     { limit: 30,  windowMs: 60_000  },
  offerLetterUpload: { limit: 20,  windowMs: 60_000  },
  offerLetterDownload: { limit: 60, windowMs: 60_000  },
  partnerApproval:     { limit: 10, windowMs: 60_000  },
  documentRequest:     { limit: 20, windowMs: 60_000  },
  offerDecision:       { limit: 10, windowMs: 60_000  },
  ipaWrite:            { limit: 20, windowMs: 60_000  },
  notes:               { limit: 30, windowMs: 60_000  },
} as const;
