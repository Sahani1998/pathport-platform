import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendTemplatedEmail } from "@/lib/email/send";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`apply:${ip}`, 10, 60_000);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  console.log("[Applications] /api/applications/apply — POST received");

  try {
    let courseId: string;
    try {
      const body = await request.json();
      courseId = body?.courseId;
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (!courseId || typeof courseId !== "string") {
      return NextResponse.json({ error: "courseId is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Duplicate check
    const { data: existing, error: checkError } = await supabase
      .from("applications")
      .select("id, status")
      .eq("student_id", user.id)
      .eq("course_id", courseId)
      .maybeSingle();

    if (checkError) {
      return NextResponse.json(
        { error: `Duplicate check failed: ${checkError.message}` },
        { status: 500 }
      );
    }

    if (existing) {
      return NextResponse.json(
        { alreadyApplied: true, applicationId: existing.id, status: existing.status },
        { status: 200 }
      );
    }

    // Insert
    const { data: inserted, error: insertError } = await supabase
      .from("applications")
      .insert({ student_id: user.id, course_id: courseId, status: "submitted" })
      .select("id, status")
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json({ alreadyApplied: true }, { status: 200 });
      }
      return NextResponse.json(
        { error: `Insert failed (${insertError.code}): ${insertError.message}` },
        { status: 500 }
      );
    }

    // Fire confirmation email (non-fatal)
    const applicationId = inserted?.id as string;

    const [{ data: profile }, { data: course }] = await Promise.all([
      supabase.from("profiles").select("email, full_name").eq("id", user.id).single(),
      supabase
        .from("courses")
        .select("title, colleges(name)")
        .eq("id", courseId)
        .single(),
    ]);

    if (profile?.email) {
      const collegeData = (course as { colleges?: { name: string } | { name: string }[] } | null)?.colleges;
      const collegeName = Array.isArray(collegeData) ? collegeData[0]?.name : collegeData?.name;

      sendTemplatedEmail({
        to:            profile.email,
        template:      "application_submitted",
        context: {
          name:        profile.full_name ?? "Student",
          courseName:  (course as { title?: string } | null)?.title ?? "your course",
          collegeName: collegeName ?? "",
        },
        applicationId,
        userId:        user.id,
      }).catch(err => console.error("[Email] application_submitted failed (non-fatal):", err));
    }

    console.log("[Applications] success — applicationId:", applicationId);
    return NextResponse.json({ success: true, applicationId }, { status: 201 });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Applications] unexpected error:", msg);
    return NextResponse.json({ error: `Unexpected error: ${msg}` }, { status: 500 });
  }
}
