import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimitAsync, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { notifyUser } from "@/lib/application-timeline";

async function requireInstitution() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401 };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, college_id")
    .eq("id", user.id)
    .single();
  if (!profile || !["institution","admin"].includes(profile.role)) return { error: "Forbidden", status: 403 };
  return { user, profile };
}

export async function GET(req: NextRequest) {
  const rl = await checkRateLimitAsync(getClientIp(req), LIMITS.profile.limit, LIMITS.profile.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const auth = await requireInstitution();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { profile } = auth;

  const db = createAdminClient();
  const collegeId = profile.college_id as string | null;

  let query = db
    .from("internship_eligibility")
    .select(`
      id, status, enabled_at, suspended_at, suspension_reason, notes, updated_at,
      student:profiles!internship_eligibility_student_id_fkey(
        id, full_name, email, country
      )
    `)
    .order("updated_at", { ascending: false });

  // Institution users are scoped to their college's students
  if (profile.role === "institution" && collegeId) {
    // Filter by students enrolled at this institution
    const { data: collegeStudentIds } = await db
      .from("applications")
      .select("student_id")
      .eq("college_id", collegeId)
      .not("current_stage", "in", '("rejected","withdrawn")');

    const ids = (collegeStudentIds ?? []).map((r: Record<string,unknown>) => r.student_id as string).filter(Boolean);
    if (!ids.length) return NextResponse.json({ eligibility: [] });
    query = query.in("student_id", ids);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ eligibility: data ?? [] });
}

export async function POST(req: NextRequest) {
  const rl = await checkRateLimitAsync(getClientIp(req), LIMITS.stage.limit, LIMITS.stage.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const auth = await requireInstitution();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { user } = auth;

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { student_id, application_id, notes } = body;
  if (!student_id) return NextResponse.json({ error: "student_id required" }, { status: 400 });

  const db = createAdminClient();
  const now = new Date().toISOString();

  const { data, error } = await db
    .from("internship_eligibility")
    .upsert({
      student_id:     student_id as string,
      application_id: application_id as string | null ?? null,
      institution_id: user.id,
      status:         "eligible",
      enabled_at:     now,
      enabled_by:     user.id,
      suspended_at:   null,
      suspended_by:   null,
      suspension_reason: null,
      notes:          notes as string | null ?? null,
    }, { onConflict: "student_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Non-fatal notification to student
  await notifyUser(db, {
    userId:        student_id as string,
    applicationId: application_id as string | null ?? undefined,
    title:         "Internship Access Enabled 💼",
    message:       "You are now eligible to browse and apply for internship placements. Visit your Internships page to get started.",
    type:          "application_update",
  });

  return NextResponse.json({ eligibility: data }, { status: 201 });
}
