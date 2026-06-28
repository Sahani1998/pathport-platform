import { createAdminClient } from "@/lib/supabase/admin-client";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimitAsync, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { resolveEmployer } from "@/lib/employer-auth";

export async function GET(req: NextRequest) {
  const rl = await checkRateLimitAsync(getClientIp(req), LIMITS.profile.limit, LIMITS.profile.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const r = await resolveEmployer();
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  if (!r.ctx.companyId) return NextResponse.json({ recruiters: [] });

  const db = createAdminClient();
  const { data, error } = await db
    .from("employer_recruiters")
    .select(`id, role, invited_at, accepted_at, user:profiles!user_id(id, full_name, email)`)
    .eq("company_id", r.ctx.companyId)
    .order("invited_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ recruiters: data ?? [] });
}

// Add an existing PathPort user as a recruiter by email.
export async function POST(req: NextRequest) {
  const rl = await checkRateLimitAsync(getClientIp(req), LIMITS.profile.limit, LIMITS.profile.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const r = await resolveEmployer();
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  if (!r.ctx.companyId) return NextResponse.json({ error: "Create your company profile first" }, { status: 409 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const email = (body.email as string | undefined)?.toLowerCase().trim();
  const role  = (body.role as string | undefined) ?? "recruiter";
  if (!email) return NextResponse.json({ error: "email is required" }, { status: 400 });
  if (!["admin","recruiter","viewer"].includes(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });

  const db = createAdminClient();
  const { data: target } = await db.from("profiles").select("id").eq("email", email).maybeSingle();
  if (!target) return NextResponse.json({ error: "No PathPort account found for that email. Ask them to sign up first." }, { status: 404 });

  const { data, error } = await db.from("employer_recruiters").insert({
    company_id: r.ctx.companyId,
    user_id:    target.id,
    role,
    invited_by: r.ctx.userId,
    accepted_at: new Date().toISOString(),
  }).select().single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "That person is already a recruiter for your company" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ recruiter: data }, { status: 201 });
}
