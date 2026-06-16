// GET /api/payments/verification-queue
//
// Returns payment attempts awaiting verification for the caller's college.
// Institution: college-scoped (RLS). Admin: all colleges (optional ?college_id filter).
//
// Query params:
//   status   — filter by attempt status (default: proof_submitted)
//   page     — 1-based, default 1
//   per_page — default 20, max 100

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimitAsync, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import type { PaymentAttempt } from "@/types/payment";

export const dynamic = "force-dynamic";

const VALID_STATUSES = ["proof_submitted", "verified", "rejected", "info_requested", "initiated", "expired"] as const;

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const rl = await checkRateLimitAsync(`vq-read:${ip}`, LIMITS.verificationQueue.limit, LIMITS.verificationQueue.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role, college_id").eq("id", user.id).single();
  if (profile?.role !== "institution" && profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url       = new URL(request.url);
  const statusParam = url.searchParams.get("status") ?? "proof_submitted";
  const status    = VALID_STATUSES.includes(statusParam as typeof VALID_STATUSES[number]) ? statusParam : "proof_submitted";
  const page      = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const perPage   = Math.min(100, Math.max(1, parseInt(url.searchParams.get("per_page") ?? "20", 10)));
  const from      = (page - 1) * perPage;
  const to        = from + perPage - 1;

  let query = supabase
    .from("payment_attempts")
    .select("*", { count: "exact" })
    .eq("status", status)
    .order("created_at", { ascending: true })  // oldest first for FIFO queue
    .range(from, to);

  // Admin may filter by a specific college
  if (profile.role === "admin") {
    const collegeFilter = url.searchParams.get("college_id");
    if (collegeFilter) query = query.eq("college_id", collegeFilter);
  }
  // Institution: RLS already restricts to their college via "pa: institution manage own"

  const { data: attempts, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    attempts: (attempts ?? []) as PaymentAttempt[],
    total:    count ?? 0,
    page,
    per_page: perPage,
  });
}
