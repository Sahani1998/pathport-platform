import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimitAsync, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { getStageMeta } from "@/types/timeline";

export async function GET(req: NextRequest) {
  const rl = await checkRateLimitAsync(getClientIp(req), LIMITS.profile.limit, LIMITS.profile.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "student") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = createAdminClient();

  // Check internship eligibility
  const { data: eligibility } = await db
    .from("posting_eligibility")
    .select("status")
    .eq("student_id", user.id)
    .maybeSingle();

  // Also check application stage as fallback
  const { data: appRow } = await db
    .from("applications")
    .select("current_stage")
    .eq("student_id", user.id)
    .not("current_stage", "in", '("rejected","withdrawn")')
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const stageStep = appRow ? getStageMeta(appRow.current_stage as Parameters<typeof getStageMeta>[0]).step : 0;
  const eligibleByStage = stageStep >= getStageMeta("internship_eligible").step;
  const isEligible = eligibility?.status === "eligible" || (eligibleByStage && eligibility?.status !== "suspended");

  if (!isEligible) return NextResponse.json({ error: "Not eligible for internship browsing", eligible: false }, { status: 403 });

  const url = new URL(req.url);
  const search = url.searchParams.get("q")?.trim() ?? "";

  let query = db
    .from("postings")
    .select(`
      id, title, department, description, location, work_type,
      monthly_allowance, duration_months, openings, skills_required,
      start_date, application_deadline, created_at,
      employer_companies(company_name, logo_url, industry, hq_city)
    `)
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`title.ilike.%${search}%,department.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ postings: data ?? [], eligible: true });
}
