import { createAdminClient } from "@/lib/supabase/admin-client";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimitAsync, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { resolveEmployer } from "@/lib/employer-auth";

export async function GET(req: NextRequest) {
  const rl = await checkRateLimitAsync(getClientIp(req), LIMITS.profile.limit, LIMITS.profile.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const r = await resolveEmployer();
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  if (!r.ctx.companyId) return NextResponse.json({ departments: [] });

  const db = createAdminClient();
  const { data, error } = await db
    .from("employer_departments")
    .select("*")
    .eq("company_id", r.ctx.companyId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ departments: data ?? [] });
}

export async function POST(req: NextRequest) {
  const rl = await checkRateLimitAsync(getClientIp(req), LIMITS.profile.limit, LIMITS.profile.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const r = await resolveEmployer();
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  if (!r.ctx.companyId) return NextResponse.json({ error: "Create your company profile first" }, { status: 409 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!body.name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const db = createAdminClient();
  const { data, error } = await db.from("employer_departments").insert({
    company_id:  r.ctx.companyId,
    name:        body.name,
    description: body.description ?? null,
    sort_order:  body.sort_order ?? 0,
  }).select().single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "A department with that name already exists" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ department: data }, { status: 201 });
}
