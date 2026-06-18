import { NextRequest, NextResponse } from "next/server";
import { createClient }      from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import type { Testimonial } from "@/types/institution-trust";

interface CreateBody {
  student_name:      string;
  testimonial_text:  string;
  course_name?:      string;
  graduation_year?:  number;
  rating?:           number;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`testimonial-write:${ip}`, LIMITS.testimonialWrite.limit, LIMITS.testimonialWrite.windowMs);
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

  if (!body.student_name?.trim())     return NextResponse.json({ error: "student_name is required" },     { status: 400 });
  if (!body.testimonial_text?.trim()) return NextResponse.json({ error: "testimonial_text is required" }, { status: 400 });

  if (body.rating !== undefined && (typeof body.rating !== "number" || body.rating < 1 || body.rating > 5)) {
    return NextResponse.json({ error: "rating must be between 1 and 5" }, { status: 400 });
  }
  if (body.graduation_year !== undefined && (typeof body.graduation_year !== "number" || body.graduation_year < 1950 || body.graduation_year > 2100)) {
    return NextResponse.json({ error: "graduation_year must be a valid year" }, { status: 400 });
  }

  const adminDb = createAdminClient();
  const { data: inserted, error: dbErr } = await adminDb
    .from("institution_testimonials")
    .insert({
      college_id:       profile.college_id,
      student_name:     body.student_name.trim(),
      testimonial_text: body.testimonial_text.trim(),
      course_name:      body.course_name?.trim() || null,
      graduation_year:  body.graduation_year ?? null,
      rating:           body.rating          ?? null,
      status:           "draft",
      uploaded_by:      user.id,
    })
    .select().single();

  if (dbErr) {
    console.error("[testimonials POST]", dbErr.message);
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  return NextResponse.json({ testimonial: inserted as Testimonial }, { status: 201 });
}
