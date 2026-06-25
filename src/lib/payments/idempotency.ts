// Payment idempotency guard.
//
// Callers pass an Idempotency-Key header (UUID). The key is hashed with the
// operation name and caller user ID to produce a per-user, per-operation key.
// On a replay within 24 h the original response is returned instantly without
// re-executing any business logic.
//
// Usage:
//   const guard = await withIdempotency(request, "payment-verify", attemptId, userId, adminDb);
//   if (guard.cached) return guard.cachedResponse!;
//   // ... do work ...
//   await guard.store(responseBody, httpStatus);

import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const HASH_ALGO = "SHA-256";
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest(HASH_ALGO, new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export interface IdempotencyGuard {
  cached: boolean;
  cachedResponse?: NextResponse;
  store: (body: Record<string, unknown>, httpStatus: number) => Promise<void>;
}

export async function withIdempotency(
  request: Request,
  operation: string,
  entityId: string,
  callerId: string,
  // biome-ignore lint: admin client generic param
  adminDb: SupabaseClient<any>,
): Promise<IdempotencyGuard> {
  const rawKey = request.headers.get("Idempotency-Key");
  if (!rawKey) {
    return {
      cached: false,
      store: async () => { /* no-op when no key supplied */ },
    };
  }

  const keyHash = await sha256(`${operation}:${entityId}:${callerId}:${rawKey}`);

  // Look up existing record
  const { data: existing } = await adminDb
    .from("idempotency_keys")
    .select("response_body, http_status, created_at")
    .eq("key_hash", keyHash)
    .maybeSingle();

  if (existing) {
    const age = Date.now() - new Date(existing.created_at as string).getTime();
    if (age < TWENTY_FOUR_HOURS_MS) {
      return {
        cached: true,
        cachedResponse: NextResponse.json(
          existing.response_body,
          { status: existing.http_status, headers: { "Idempotent-Replayed": "true" } },
        ),
        store: async () => {},
      };
    }
    // Expired — treat as new request (record will be overwritten)
  }

  return {
    cached: false,
    store: async (body: Record<string, unknown>, httpStatus: number) => {
      await adminDb.from("idempotency_keys").upsert({
        key_hash:      keyHash,
        operation,
        entity_id:     entityId,
        caller_id:     callerId,
        response_body: body,
        http_status:   httpStatus,
      }, { onConflict: "key_hash" });
    },
  };
}
