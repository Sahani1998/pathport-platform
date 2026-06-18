import { NextRequest, NextResponse } from "next/server";
import { createClient }      from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import type { SuccessStory } from "@/types/institution-trust";

interface CreateBody {
  person_name:       string;
  story_text:        string;
  course_name?:      string;
  graduation_year?:  number;
  current_role?:     string;
  current_company?:  string;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`story-write:${ip}`, LIMITS.storyWrite.limit, LIMITS.storyWrite.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role, college_id").eq("id", user.id).single();
  if (!profile || (profile.role !== "institution" && profile.role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!profile.college_id) return NextResponse.json({ error: "No college linked" }, { status: 403 });

  let body: CreateBody;
  try { body = await request.json() as CreateBody; }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (!body.person_name?.trim()) return NextResponse.json({ error: "person_name is required" }, { status: 400 });
  if (!body.story_text?.trim())  return NextResponse.json({ error: "story_text is required" },  { status: 400 });

  if (body.graduation_year !== undefined && (typeof body.graduation_year !== "number" || body.graduation_year < 1950 || body.graduation_year > 2100)) {
    return NextResponse.json({ error: "graduation_year must be a valid year" }, { status: 400 });
  }

  const adminDb = createAdminClient();
  const { data: inserted, error: dbErr } = await adminDb
    .from("institution_success_stories")
    .insert({
      college_id:      profile.college_id,
      person_name:     body.person_name.trim(),
      story_text:      body.story_text.trim(),
      course_name:     body.course_name?.trim()     || null,
      graduation_year: body.graduation_year         ?? null,
      current_role:    body.current_role?.trim()    || null,
      current_company: body.current_company?.trim() || null,
      status:          "draft",
      uploaded_by:     user.id,
    })
    .select().single();

  if (dbErr) {
    console.error("[success-stories POST]", dbErr.message);
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  return NextResponse.json({ story: inserted as SuccessStory }, { status: 201 });
}
