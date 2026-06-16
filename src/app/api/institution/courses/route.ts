import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimitAsync, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { COURSE_CATEGORIES, type CourseLevel, type CourseStatus, type CourseStudyMode } from "@/types/courses";

const VALID_LEVELS:      readonly CourseLevel[]     = ["diploma", "advanced_diploma", "graduate_diploma", "certificate"];
const VALID_STUDY_MODES: readonly CourseStudyMode[] = ["full_time", "part_time"];
const VALID_STATUSES:    readonly CourseStatus[]    = ["open", "closed", "draft"];

function asInt(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : fallback;
}
function asNum(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}
function asStr(v: unknown): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return s || null;
}
function asStrArr(v: unknown): string[] | null {
  if (!Array.isArray(v)) return null;
  const filtered = v.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
  return filtered.length > 0 ? filtered : null;
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = await checkRateLimitAsync(`institution-course-write:${ip}`, LIMITS.courseWrite.limit, LIMITS.courseWrite.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role, college_id").eq("id", user.id).single();

  if (profile?.role !== "institution")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!profile.college_id)
    return NextResponse.json({ error: "No college linked to your account. Contact your administrator." }, { status: 403 });

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;

  const title    = asStr(body.title);
  const category = asStr(body.category);
  const slug     = asStr(body.slug);

  if (!title)    return NextResponse.json({ error: "Title is required" },    { status: 400 });
  if (!category) return NextResponse.json({ error: "Category is required" }, { status: 400 });
  if (!slug)     return NextResponse.json({ error: "Slug is required" },     { status: 400 });

  if (!/^[a-z0-9-]+$/.test(slug))
    return NextResponse.json({ error: "Invalid slug format" }, { status: 400 });
  if (!(COURSE_CATEGORIES as readonly string[]).includes(category))
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });

  const level      = (body.level      as CourseLevel)     ?? "diploma";
  const study_mode = (body.study_mode as CourseStudyMode) ?? "full_time";
  const status     = (body.status     as CourseStatus)    ?? "draft";

  if (!VALID_LEVELS.includes(level))           return NextResponse.json({ error: "Invalid level" },      { status: 400 });
  if (!VALID_STUDY_MODES.includes(study_mode)) return NextResponse.json({ error: "Invalid study mode" }, { status: 400 });
  if (!VALID_STATUSES.includes(status))        return NextResponse.json({ error: "Invalid status" },     { status: 400 });

  // college_id always taken from the server-side profile — never from the client body
  const insert: Record<string, unknown> = {
    college_id:                       profile.college_id,
    title,
    slug,
    category,
    level,
    study_mode,
    status,
    description:                      asStr(body.description),
    duration_months:                  asInt(body.duration_months, 12),
    tuition_fee:                      asNum(body.tuition_fee, 0),
    application_fee:                  asNum(body.application_fee, 109),
    seats_total:                      asInt(body.seats_total, 30),
    intake_date:                      asStr(body.intake_date),
    // Optional fields added by courses_media_migration.sql (null-safe — ignored if columns absent)
    thumbnail_url:                    asStr(body.thumbnail_url),
    video_url:                        asStr(body.video_url),
    brochure_url:                     asStr(body.brochure_url),
    gallery_images:                   asStrArr(body.gallery_images),
    career_outcomes:                  asStrArr(body.career_outcomes),
    industries:                       asStrArr(body.industries),
    internship_available:             body.internship_available === true,
    internship_duration_months:       body.internship_duration_months != null
                                        ? asInt(body.internship_duration_months, 0) || null
                                        : null,
    estimated_internship_allowance:   body.estimated_internship_allowance != null
                                        ? asNum(body.estimated_internship_allowance, 0) || null
                                        : null,
    pathway_description:              asStr(body.pathway_description),
    job_outlook_description:          asStr(body.job_outlook_description),
  };

  const { data, error } = await supabase
    .from("courses")
    .insert(insert)
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505")
      return NextResponse.json({ error: "A course with this slug already exists. Please try a different title." }, { status: 409 });
    console.error("[API] institution/courses POST:", error.code, error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
