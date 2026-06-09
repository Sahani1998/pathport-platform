import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { COURSE_CATEGORIES, type CourseLevel, type CourseStatus, type CourseStudyMode } from "@/types/courses";

const VALID_LEVELS:      readonly CourseLevel[]     = ["diploma", "advanced_diploma", "graduate_diploma", "certificate"];
const VALID_STUDY_MODES: readonly CourseStudyMode[] = ["full_time", "part_time"];
const VALID_STATUSES:    readonly CourseStatus[]    = ["open", "closed", "draft"];

function asInt(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}
function asNum(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`courses-write:${ip}`, LIMITS.courseWrite.limit, LIMITS.courseWrite.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;

  const college_id = (body.college_id as string | undefined)?.trim();
  const title      = (body.title      as string | undefined)?.trim();
  const slug       = (body.slug       as string | undefined)?.trim();
  const category   = (body.category   as string | undefined)?.trim();

  if (!college_id) return NextResponse.json({ error: "College is required" },    { status: 400 });
  if (!title)      return NextResponse.json({ error: "Title is required" },      { status: 400 });
  if (!slug)       return NextResponse.json({ error: "Slug is required" },       { status: 400 });
  if (!category)   return NextResponse.json({ error: "Category is required" },   { status: 400 });

  if (!/^[a-z0-9-]+$/.test(slug))
    return NextResponse.json({ error: "Slug must be lowercase letters, numbers, and hyphens only" }, { status: 400 });
  if (!(COURSE_CATEGORIES as readonly string[]).includes(category))
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });

  const level      = (body.level      as CourseLevel)     ?? "diploma";
  const study_mode = (body.study_mode as CourseStudyMode) ?? "full_time";
  const status     = (body.status     as CourseStatus)    ?? "draft";

  if (!VALID_LEVELS.includes(level))           return NextResponse.json({ error: "Invalid level" },      { status: 400 });
  if (!VALID_STUDY_MODES.includes(study_mode)) return NextResponse.json({ error: "Invalid study mode" }, { status: 400 });
  if (!VALID_STATUSES.includes(status))        return NextResponse.json({ error: "Invalid status" },     { status: 400 });

  // Verify college exists (defence in depth — FK will also enforce this)
  const { data: college } = await supabase
    .from("colleges").select("id").eq("id", college_id).single();
  if (!college) return NextResponse.json({ error: "College not found" }, { status: 400 });

  const insert: Record<string, unknown> = {
    college_id,
    title,
    slug,
    category,
    level,
    study_mode,
    status,
    description:     (body.description as string | undefined)?.trim() || null,
    duration_months: asInt(body.duration_months, 12),
    tuition_fee:     asNum(body.tuition_fee, 0),
    application_fee: asNum(body.application_fee, 0),
    seats_total:     asInt(body.seats_total, 30),
    intake_date:     (body.intake_date as string | undefined)?.trim() || null,
  };

  const { data, error } = await supabase
    .from("courses")
    .insert(insert)
    .select()
    .single();

  if (error) {
    if (error.code === "23505")
      return NextResponse.json({ error: "A course with this slug already exists" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
