import { createAdminClient } from "@/lib/supabase/admin-client";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimitAsync, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { resolveEmployer } from "@/lib/employer-auth";

export async function GET(req: NextRequest) {
  const rl = await checkRateLimitAsync(getClientIp(req), LIMITS.profile.limit, LIMITS.profile.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const r = await resolveEmployer();
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  if (!r.ctx.companyId) return NextResponse.json({ offices: [] });

  const db = createAdminClient();
  const { data, error } = await db
    .from("employer_company_offices")
    .select("*")
    .eq("company_id", r.ctx.companyId)
    .order("is_hq", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ offices: data ?? [] });
}

export async function POST(req: NextRequest) {
  const rl = await checkRateLimitAsync(getClientIp(req), LIMITS.profile.limit, LIMITS.profile.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const r = await resolveEmployer();
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  if (!r.ctx.companyId) return NextResponse.json({ error: "Create your company profile first" }, { status: 409 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!body.label || !body.city) return NextResponse.json({ error: "label and city are required" }, { status: 400 });

  const allowed = ["label","is_hq","address_line1","address_line2","city","state","postal_code","country_code","phone"] as const;
  const payload: Record<string, unknown> = { company_id: r.ctx.companyId };
  for (const k of allowed) if (k in body) payload[k] = body[k];

  const db = createAdminClient();
  const { data, error } = await db.from("employer_company_offices").insert(payload).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ office: data }, { status: 201 });
}
