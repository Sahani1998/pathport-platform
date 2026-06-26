import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimitAsync, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const rl = await checkRateLimitAsync(getClientIp(req), LIMITS.profile.limit, LIMITS.profile.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "student") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = createAdminClient();
  const { data, error } = await db
    .from("internship_candidacies")
    .select(`
      id, status, cover_note, offer_allowance_sgd, offer_start_date, applied_at, updated_at,
      internship_postings(
        id, title, department, location, work_type, monthly_allowance_sgd, duration_months,
        employer_companies(company_name, logo_url)
      )
    `)
    .eq("student_id", user.id)
    .order("applied_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ candidacies: data ?? [] });
}

// Allow student to withdraw an application
export async function PATCH(req: NextRequest) {
  const rl = await checkRateLimitAsync(getClientIp(req), LIMITS.withdraw.limit, LIMITS.withdraw.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "student") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { candidacy_id } = body;
  if (!candidacy_id) return NextResponse.json({ error: "candidacy_id required" }, { status: 400 });

  const db = createAdminClient();
  const { data, error } = await db
    .from("internship_candidacies")
    .update({ status: "withdrawn" })
    .eq("id", candidacy_id)
    .eq("student_id", user.id)
    .not("status", "in", '("hired","offer_accepted")')
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: error.code === "PGRST116" ? 404 : 500 });
  return NextResponse.json({ candidacy: data });
}
