import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimitAsync, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { notifyUser } from "@/lib/application-timeline";
import { loadStudentProfiles } from "@/lib/student-profiles";

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

  // posting_eligibility.student_id → auth.users(id), NOT profiles — so the
  // profiles embed can't be used (errors the query). Batch-load instead.
  let query = db
    .from("posting_eligibility")
    .select("id, student_id, status, enabled_at, suspended_at, suspension_reason, notes, updated_at")
    .order("updated_at", { ascending: false });

  // Institution users are scoped to their college's students. college_id lives
  // on `courses`, NOT `applications` — resolve via course ids (same pattern as
  // every other institution page) instead of filtering applications.college_id.
  if (profile.role === "institution") {
    if (!collegeId) return NextResponse.json({ eligibility: [] });

    const { data: courseRows } = await db.from("courses").select("id").eq("college_id", collegeId);
    const courseIds = (courseRows ?? []).map((c: Record<string, unknown>) => c.id as string);
    if (!courseIds.length) return NextResponse.json({ eligibility: [] });

    const { data: collegeStudents } = await db
      .from("applications")
      .select("student_id")
      .in("course_id", courseIds)
      .not("current_stage", "in", '("rejected","withdrawn")');

    const ids = (collegeStudents ?? []).map((r: Record<string, unknown>) => r.student_id as string).filter(Boolean);
    if (!ids.length) return NextResponse.json({ eligibility: [] });
    query = query.in("student_id", ids);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Attach student profiles (batch-loaded — no inline FK embed)
  const rows = data ?? [];
  const profileMap = await loadStudentProfiles(db, rows.map((r: Record<string, unknown>) => r.student_id as string));
  const eligibility = rows.map((r: Record<string, unknown>) => ({
    ...r,
    student: profileMap.get(r.student_id as string) ?? null,
  }));

  return NextResponse.json({ eligibility });
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
    .from("posting_eligibility")
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
