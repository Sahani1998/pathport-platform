import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimitAsync, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";

async function requireEmployer() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401 };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "employer") return { error: "Forbidden", status: 403 };
  return { user, supabase };
}

export async function GET(req: NextRequest) {
  const rl = await checkRateLimitAsync(getClientIp(req), LIMITS.profile.limit, LIMITS.profile.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const auth = await requireEmployer();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { user } = auth;

  const url = new URL(req.url);
  const status = url.searchParams.get("status");

  const db = createAdminClient();
  let query = db
    .from("internship_postings")
    .select("*, employer_companies(company_name, logo_url)")
    .eq("employer_id", user.id)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ postings: data ?? [] });
}

export async function POST(req: NextRequest) {
  const rl = await checkRateLimitAsync(getClientIp(req), LIMITS.courseWrite.limit, LIMITS.courseWrite.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const auth = await requireEmployer();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { user } = auth;

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { title, monthly_allowance_sgd, duration_months } = body;
  if (!title || monthly_allowance_sgd === undefined || !duration_months) {
    return NextResponse.json({ error: "title, monthly_allowance_sgd, and duration_months are required" }, { status: 400 });
  }

  const db = createAdminClient();
  const { data: company } = await db.from("employer_companies").select("id").eq("employer_id", user.id).maybeSingle();

  const allowed = ["title","department","description","requirements","location","work_type","monthly_allowance_sgd","duration_months","openings","status","skills_required","start_date","application_deadline"] as const;
  const payload: Record<string, unknown> = { employer_id: user.id };
  if (company) payload.company_id = company.id;
  for (const k of allowed) {
    if (k in body) payload[k] = body[k];
  }

  const { data, error } = await db.from("internship_postings").insert(payload).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ posting: data }, { status: 201 });
}
