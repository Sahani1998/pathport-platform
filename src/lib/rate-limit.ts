// Rate limiter — fixed window per IP.
//
// Default: in-memory Map (adequate for dev / single-instance).
// Production: set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN env vars
// and the limiter automatically switches to Upstash (shared across all
// serverless instances, survives cold starts).

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

// ─── Upstash Redis backend ────────────────────────────────────────────────────
// Uses the Upstash REST API via fetch — no SDK required. Activates when both
// env vars are present; falls back to in-memory if Redis is unreachable.

const upstashBackend: Backend = {
  async check(key, limit, windowMs) {
    const url   = process.env.UPSTASH_REDIS_REST_URL!;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
    const now        = Date.now();
    const windowSec  = Math.ceil(windowMs / 1000);
    const windowSlot = Math.floor(now / windowMs);
    const windowKey  = `rl:${key}:${windowSlot}`;
    const resetAt    = (windowSlot + 1) * windowMs;

    try {
      const res = await fetch(`${url}/pipeline`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body:    JSON.stringify([
          ["INCR",   windowKey],
          ["EXPIRE", windowKey, windowSec],
        ]),
        signal: AbortSignal.timeout(2_000),
      });

      if (!res.ok) throw new Error(`Upstash ${res.status}`);

      const data  = await res.json() as [{ result: number }, unknown];
      const count = data[0]?.result ?? 1;

      if (count > limit) {
        return { success: false, remaining: 0, resetAt };
      }
      return { success: true, remaining: limit - count, resetAt };
    } catch (err) {
      // Fail open: never block a request because Redis is down
      console.error("[RateLimit] Upstash error (fail-open):", err);
      return { success: true, remaining: limit - 1, resetAt };
    }
  },
};

// ─── Active backend ───────────────────────────────────────────────────────────
const backend: Backend = (
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
) ? upstashBackend : inMemoryBackend;

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
  partnerApply:        { limit: 5,  windowMs: 3_600_000 }, // 5 / hour — public form
  partnerApproval:     { limit: 10, windowMs: 60_000  },
  documentRequest:     { limit: 20, windowMs: 60_000  },
  offerDecision:       { limit: 10, windowMs: 60_000  },
  ipaWrite:            { limit: 20, windowMs: 60_000  },
  notes:               { limit: 30, windowMs: 60_000  },
  coursesDelete:       { limit: 10, windowMs: 60_000  },

  // Sprint 17 — finance
  invoiceRead:         { limit: 60, windowMs: 60_000  },
  invoiceWrite:        { limit: 20, windowMs: 60_000  },
  proofUpload:         { limit: 10, windowMs: 60_000  },
  paymentVerify:       { limit: 30, windowMs: 60_000  },
  verificationQueue:   { limit: 60, windowMs: 60_000  },
  paymentSettings:     { limit: 20, windowMs: 60_000  },
  feeSchedule:         { limit: 20, windowMs: 60_000  },

  // Sprint 23 — document lifecycle + archival
  offerLifecycle:    { limit: 20, windowMs: 60_000  },
  ipaLifecycle:      { limit: 20, windowMs: 60_000  },
  appArchive:        { limit: 10, windowMs: 60_000  },

  // Sprint 24A — institution media
  brandingWrite:     { limit: 20, windowMs: 60_000  },
  mediaUpload:       { limit: 20, windowMs: 60_000  },
  mediaWrite:        { limit: 30, windowMs: 60_000  },
} as const;
