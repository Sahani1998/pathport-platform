// POST /api/unsubscribe
//
// RFC 8058 one-click unsubscribe endpoint. Targeted by the
// `List-Unsubscribe-Post: List-Unsubscribe=One-Click` header.
//
// Accepts EITHER:
//   - HMAC-signed `token` query / body param (preferred, set in email link)
//   - raw `email` body param (legacy fallback; only flips do_not_contact if
//     the email matches an existing profile and the request includes a valid
//     turnstile token — NOT currently in use)
//
// Sets profiles.do_not_contact = true. Idempotent.

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe-token";
import { checkRateLimitAsync, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await checkRateLimitAsync(`unsubscribe:${ip}`, LIMITS.inquiry.limit, LIMITS.inquiry.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  // Token can be in URL (List-Unsubscribe=mailto?subject=... encoders) or body
  const url = new URL(request.url);
  let token = url.searchParams.get("token");

  if (!token) {
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const form = await request.formData().catch(() => null);
      token = (form?.get("token") as string | null) ?? null;
    } else if (contentType.includes("application/json")) {
      const body = await request.json().catch(() => ({})) as Record<string, unknown>;
      token = typeof body.token === "string" ? body.token : null;
    }
  }

  const result = await verifyUnsubscribeToken(token);
  if (!result.valid || !result.email) {
    return NextResponse.json(
      { error: "Invalid or expired unsubscribe link" },
      { status: 400 },
    );
  }

  const adminDb = createAdminClient();
  const { error } = await adminDb
    .from("profiles")
    .update({ do_not_contact: true })
    .eq("email", result.email);

  if (error) {
    console.error("[Unsubscribe] update failed:", error.message);
    return NextResponse.json({ error: "Could not process unsubscribe — please try again later" }, { status: 500 });
  }

  console.log(`[Unsubscribe] success → ${result.email}`);
  return NextResponse.json({ success: true, email: result.email });
}
