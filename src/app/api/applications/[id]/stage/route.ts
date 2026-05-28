import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ApplicationStage } from "@/types/timeline";
import { getStageMeta, STAGE_NOTIFICATION } from "@/types/timeline";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log("[Timeline API] request received — PATCH /api/applications/" + id + "/stage");

  try {
    // ── Parse body ────────────────────────────────────────────────────────────
    let stage:           ApplicationStage;
    let student_message: string | null;
    let internal_notes:  string | null;
    let next_action:     string | null;

    try {
      const body = await request.json() as {
        stage?:           string;
        student_message?: string | null;
        internal_notes?:  string | null;
        next_action?:     string | null;
      };
      stage           = body.stage as ApplicationStage;
      student_message = body.student_message ?? null;
      internal_notes  = body.internal_notes  ?? null;
      next_action     = body.next_action     ?? null;
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (!stage) {
      return NextResponse.json({ error: "stage is required" }, { status: 400 });
    }

    // ── Auth ──────────────────────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log("[Timeline API] user loaded — id:", user?.id ?? "null", "| authError:", authError?.message ?? "none");

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // ── Role check ────────────────────────────────────────────────────────────
    const { data: profile } = await supabase
      .from("profiles").select("role, college_id").eq("id", user.id).single();

    if (!profile || !["admin", "institution"].includes(profile.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    console.log("[Timeline API] permission checked — role:", profile.role, "| college_id:", profile.college_id ?? "none");

    // ── Fetch application ─────────────────────────────────────────────────────
    const { data: app, error: appError } = await supabase
      .from("applications")
      .select("id, student_id, course_id")
      .eq("id", id)
      .single();

    if (appError || !app) {
      console.error("[Timeline API] application not found:", appError?.message);
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // ── Institution ownership check ───────────────────────────────────────────
    if (profile.role === "institution" && profile.college_id) {
      const { data: course } = await supabase
        .from("courses").select("college_id").eq("id", app.course_id).single();
      if (!course || course.college_id !== profile.college_id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    // ── Update application ────────────────────────────────────────────────────
    console.log("[Timeline API] updating stage:", id, "→", stage);

    const { error: updateError } = await supabase
      .from("applications")
      .update({
        current_stage:    stage,
        stage_updated_at: new Date().toISOString(),
        student_message:  student_message,
        internal_notes:   internal_notes,
        next_action:      next_action,
      })
      .eq("id", id);

    if (updateError) {
      console.error("[Timeline API] update error:", updateError.message);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    console.log("[Timeline API] application updated successfully");

    // ── Timeline event ────────────────────────────────────────────────────────
    const stageMeta = getStageMeta(stage);
    const { error: eventError } = await supabase
      .from("application_timeline_events")
      .insert({
        application_id:     id,
        stage:              stage,
        title:              stageMeta.label,
        description:        student_message || stageMeta.description,
        created_by:         user.id,
        created_by_role:    profile.role,
        visible_to_student: true,
      });

    if (eventError) {
      // Non-fatal — log and continue
      console.error("[Timeline API] timeline event error (non-fatal):", eventError.message);
    }

    // ── Student notification ──────────────────────────────────────────────────
    const notifTemplate = STAGE_NOTIFICATION[stage];
    if (notifTemplate) {
      const { error: notifError } = await supabase
        .from("notifications")
        .insert({
          user_id:        app.student_id,
          application_id: id,
          title:          notifTemplate.title,
          message:        student_message || notifTemplate.message,
          type:           notifTemplate.type,
        });

      if (notifError) {
        console.error("[Timeline API] notification error (non-fatal):", notifError.message);
      } else {
        console.log("[Timeline API] notification created for student:", app.student_id);
      }
    }

    console.log("[Timeline API] stage update complete:", id, "→", stage);
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Timeline API] unexpected error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
