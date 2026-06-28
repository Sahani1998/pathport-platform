import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimitAsync, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";

async function requireEmployer() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401 };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "employer") return { error: "Forbidden", status: 403 };
  return { user, supabase };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rl = await checkRateLimitAsync(getClientIp(req), LIMITS.profile.limit, LIMITS.profile.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const auth = await requireEmployer();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { user } = auth;
  const { id } = await params;

  const db = createAdminClient();
  const { data, error } = await db
    .from("postings")
    .select("*, employer_companies(company_name, logo_url)")
    .eq("id", id)
    .eq("employer_id", user.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: error.code === "PGRST116" ? 404 : 500 });
  return NextResponse.json({ posting: data });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rl = await checkRateLimitAsync(getClientIp(req), LIMITS.courseWrite.limit, LIMITS.courseWrite.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const auth = await requireEmployer();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { user } = auth;
  const { id } = await params;

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const allowed = ["title","department","description","requirements","location","work_type","monthly_allowance","duration_months","openings","status","skills_required","start_date","application_deadline","posting_type","country_code","currency_code","working_hours_per_week","benefits"] as const;
  const patch: Record<string, unknown> = {};
  for (const k of allowed) {
    if (k in body) patch[k] = body[k];
  }
  if (!Object.keys(patch).length) return NextResponse.json({ error: "No valid fields" }, { status: 400 });

  // Archiving stamps archived_at/by
  if (patch.status === "archived") {
    patch.archived_at = new Date().toISOString();
    patch.archived_by = user.id;
  }

  const db = createAdminClient();
  const { data, error } = await db
    .from("postings")
    .update(patch)
    .eq("id", id)
    .eq("employer_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: error.code === "PGRST116" ? 404 : 500 });
  return NextResponse.json({ posting: data });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rl = await checkRateLimitAsync(getClientIp(req), LIMITS.coursesDelete.limit, LIMITS.coursesDelete.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const auth = await requireEmployer();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { user } = auth;
  const { id } = await params;

  const db = createAdminClient();
  // Only allow deleting drafts — close live postings instead
  const { data: posting } = await db.from("postings").select("status").eq("id", id).eq("employer_id", user.id).single();
  if (!posting) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (posting.status !== "draft") return NextResponse.json({ error: "Only draft postings can be deleted. Set status to 'closed' instead." }, { status: 409 });

  const { error } = await db.from("postings").delete().eq("id", id).eq("employer_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
