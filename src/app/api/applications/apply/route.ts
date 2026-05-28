import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  console.log("[Applications] /api/applications/apply — POST received");

  try {
    // ── Parse body ─────────────────────────────────────────────────────────
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

    console.log("[Applications] courseId:", courseId);

    // ── Step 1: auth — server Supabase client reads cookies reliably ───────
    console.log("[Applications] getUser start");
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log("[Applications] getUser done — user:", user?.id ?? "null", "| error:", authError?.message ?? "none");

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // ── Step 2: duplicate check ────────────────────────────────────────────
    console.log("[Applications] duplicate check start");
    const { data: existing, error: checkError } = await supabase
      .from("applications")
      .select("id, status")
      .eq("student_id", user.id)
      .eq("course_id", courseId)
      .maybeSingle();
    console.log("[Applications] duplicate check done — existing:", existing?.id ?? "none", "| error:", checkError?.message ?? "none");

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

    // ── Step 3: insert ─────────────────────────────────────────────────────
    console.log("[Applications] insert start");
    const { data: inserted, error: insertError } = await supabase
      .from("applications")
      .insert({ student_id: user.id, course_id: courseId, status: "submitted" })
      .select("id, status")
      .single();
    console.log("[Applications] insert done — id:", inserted?.id ?? "null", "| error:", insertError?.code ?? "none", insertError?.message ?? "none");

    if (insertError) {
      if (insertError.code === "23505") {
        // Race-condition duplicate — treat as success
        return NextResponse.json(
          { alreadyApplied: true },
          { status: 200 }
        );
      }
      return NextResponse.json(
        { error: `Insert failed (${insertError.code}): ${insertError.message}` },
        { status: 500 }
      );
    }

    // ── Success ────────────────────────────────────────────────────────────
    console.log("[Applications] success — applicationId:", inserted?.id);
    return NextResponse.json({ success: true, applicationId: inserted?.id }, { status: 201 });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Applications] unexpected error:", msg);
    return NextResponse.json({ error: `Unexpected error: ${msg}` }, { status: 500 });
  }
}
