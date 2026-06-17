import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { COURSE_CATEGORIES, type CourseLevel, type CourseStatus, type CourseStudyMode } from "@/types/courses";

const VALID_LEVELS:      readonly CourseLevel[]     = ["diploma", "advanced_diploma", "graduate_diploma", "certificate"];
const VALID_STUDY_MODES: readonly CourseStudyMode[] = ["full_time", "part_time"];
const VALID_STATUSES:    readonly CourseStatus[]    = ["open", "closed", "draft"];

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user)
    return { supabase, user: null, forbidden: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin")
    return { supabase, user, forbidden: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { supabase, user, forbidden: null };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ip = getClientIp(request);
  const rl = checkRateLimit(`courses-write:${ip}`, LIMITS.courseWrite.limit, LIMITS.courseWrite.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const { supabase, forbidden } = await requireAdmin();
  if (forbidden) return forbidden;

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;

  const updates: Record<string, unknown> = {};

  if (typeof body.title === "string") {
    const v = body.title.trim();
    if (!v) return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
    updates.title = v;
  }
  if (typeof body.description === "string") updates.description = body.description.trim() || null;
  if (typeof body.category === "string") {
    if (!(COURSE_CATEGORIES as readonly string[]).includes(body.category))
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    updates.category = body.category;
  }
  if (typeof body.level === "string") {
    if (!VALID_LEVELS.includes(body.level as CourseLevel))
      return NextResponse.json({ error: "Invalid level" }, { status: 400 });
    updates.level = body.level;
  }
  if (typeof body.study_mode === "string") {
    if (!VALID_STUDY_MODES.includes(body.study_mode as CourseStudyMode))
      return NextResponse.json({ error: "Invalid study mode" }, { status: 400 });
    updates.study_mode = body.study_mode;
  }
  if (typeof body.status === "string") {
    if (!VALID_STATUSES.includes(body.status as CourseStatus))
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    updates.status = body.status;
  }
  if (body.duration_months !== undefined) {
    const n = Number(body.duration_months);
    if (!Number.isFinite(n) || n < 1 || n > 120)
      return NextResponse.json({ error: "Duration must be between 1 and 120 months" }, { status: 400 });
    updates.duration_months = Math.trunc(n);
  }
  if (body.tuition_fee !== undefined) {
    const n = Number(body.tuition_fee);
    if (!Number.isFinite(n) || n < 0) return NextResponse.json({ error: "Invalid tuition fee" }, { status: 400 });
    updates.tuition_fee = n;
  }
  if (body.application_fee !== undefined) {
    const n = Number(body.application_fee);
    if (!Number.isFinite(n) || n < 0) return NextResponse.json({ error: "Invalid application fee" }, { status: 400 });
    updates.application_fee = n;
  }
  if (body.seats_total !== undefined) {
    const n = Number(body.seats_total);
    if (!Number.isFinite(n) || n < 1) return NextResponse.json({ error: "Seats must be at least 1" }, { status: 400 });
    updates.seats_total = Math.trunc(n);
  }
  if (body.intake_date !== undefined) {
    updates.intake_date = body.intake_date ? String(body.intake_date) : null;
  }

  if (typeof body.is_published === "boolean") {
    updates.is_published = body.is_published;
  }

  if (Object.keys(updates).length === 0)
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });

  const { data, error } = await supabase
    .from("courses")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "23505")
      return NextResponse.json({ error: "A course with this slug already exists" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Course not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ip = getClientIp(request);
  const rl = checkRateLimit(`courses-delete:${ip}`, LIMITS.coursesDelete.limit, LIMITS.coursesDelete.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const { supabase, forbidden } = await requireAdmin();
  if (forbidden) return forbidden;

  // Block delete if applications reference this course — preserves student history.
  // Admins should archive (status='closed') instead of delete in that case.
  const { count } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("course_id", id);

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: `Cannot delete — this course has ${count} application${count === 1 ? "" : "s"}. Archive it instead.` },
      { status: 400 },
    );
  }

  const { error } = await supabase.from("courses").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
