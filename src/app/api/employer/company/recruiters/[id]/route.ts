import { createAdminClient } from "@/lib/supabase/admin-client";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimitAsync, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { resolveEmployer } from "@/lib/employer-auth";

async function ownsRecruiter(companyId: string, recruiterId: string): Promise<boolean> {
  const db = createAdminClient();
  const { data } = await db.from("employer_recruiters").select("id, role").eq("id", recruiterId).eq("company_id", companyId).maybeSingle();
  // Cannot manage the owner row
  return !!data && data.role !== "owner";
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rl = await checkRateLimitAsync(getClientIp(req), LIMITS.profile.limit, LIMITS.profile.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const r = await resolveEmployer();
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  if (!r.ctx.companyId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  if (!(await ownsRecruiter(r.ctx.companyId, id))) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const role = body.role as string | undefined;
  if (!role || !["admin","recruiter","viewer"].includes(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });

  const db = createAdminClient();
  const { data, error } = await db.from("employer_recruiters").update({ role }).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ recruiter: data });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rl = await checkRateLimitAsync(getClientIp(req), LIMITS.coursesDelete.limit, LIMITS.coursesDelete.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const r = await resolveEmployer();
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  if (!r.ctx.companyId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  if (!(await ownsRecruiter(r.ctx.companyId, id))) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const db = createAdminClient();
  const { error } = await db.from("employer_recruiters").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
