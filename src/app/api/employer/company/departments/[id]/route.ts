import { createAdminClient } from "@/lib/supabase/admin-client";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimitAsync, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { resolveEmployer } from "@/lib/employer-auth";

async function ownsDept(companyId: string, deptId: string): Promise<boolean> {
  const db = createAdminClient();
  const { data } = await db.from("employer_departments").select("id").eq("id", deptId).eq("company_id", companyId).maybeSingle();
  return !!data;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rl = await checkRateLimitAsync(getClientIp(req), LIMITS.profile.limit, LIMITS.profile.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const r = await resolveEmployer();
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  if (!r.ctx.companyId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  if (!(await ownsDept(r.ctx.companyId, id))) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const allowed = ["name","description","sort_order"] as const;
  const patch: Record<string, unknown> = {};
  for (const k of allowed) if (k in body) patch[k] = body[k];
  if (!Object.keys(patch).length) return NextResponse.json({ error: "No valid fields" }, { status: 400 });

  const db = createAdminClient();
  const { data, error } = await db.from("employer_departments").update(patch).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ department: data });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rl = await checkRateLimitAsync(getClientIp(req), LIMITS.coursesDelete.limit, LIMITS.coursesDelete.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const r = await resolveEmployer();
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  if (!r.ctx.companyId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  if (!(await ownsDept(r.ctx.companyId, id))) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const db = createAdminClient();
  const { error } = await db.from("employer_departments").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
