import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ApplicationStage } from "@/types/timeline";
import { getStageMeta, STAGE_NOTIFICATION } from "@/types/timeline";
import { STATUS_TO_STAGE } from "@/lib/application-stage-mapping";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";

const VALID_STATUSES = [
  "submitted", "under_review", "docs_required",
  "offer_ready", "ipa_processing", "approved", "rejected",
];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const ip = getClientIp(request);
  const rl = checkRateLimit(`app-status:${ip}`, LIMITS.stage.limit, LIMITS.stage.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  try {
    let status: string;
    try {
      const body = await request.json() as { status?: string };
      status = body.status ?? "";
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles").select("role, college_id").eq("id", user.id).single();

    if (!profile || !["admin", "institution"].includes(profile.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Fetch current application values
    const { data: app, error: appError } = await supabase
      .from("applications")
      .select("id, student_id, course_id, status, current_stage")
      .eq("id", id)
      .single();

    if (appError || !app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (profile.role === "institution" && profile.college_id) {
      const { data: course } = await supabase
        .from("courses").select("college_id").eq("id", app.course_id).single();
      if (!course || course.college_id !== profile.college_id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    // Compute synced current_stage from the new status
    const newStage = STATUS_TO_STAGE[status] ?? "application_submitted";

    const { error: updateError } = await supabase
      .from("applications")
      .update({
        status,
        current_stage:    newStage,
        stage_updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      console.error("[Applications API] update error:", updateError.message);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Timeline event
    const stageMeta = getStageMeta(newStage);
    await supabase.from("application_timeline_events").insert({
      application_id:     id,
      stage:              newStage,
      title:              stageMeta.label,
      description:        stageMeta.description,
      created_by:         user.id,
      created_by_role:    profile.role,
      visible_to_student: true,
    });

    // Student notification
    const notifTemplate = STAGE_NOTIFICATION[newStage];
    if (notifTemplate) {
      await supabase.from("notifications").insert({
        user_id:        app.student_id,
        application_id: id,
        title:          notifTemplate.title,
        message:        notifTemplate.message,
        type:           notifTemplate.type,
      });
    }

    return NextResponse.json({ success: true, stage: newStage }, { status: 200 });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Applications API] unexpected error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
