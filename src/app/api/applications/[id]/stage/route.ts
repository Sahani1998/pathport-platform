import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ApplicationStage } from "@/types/timeline";
import { getStageMeta, STAGE_NOTIFICATION, STAGE_META } from "@/types/timeline";
import { STAGE_TO_STATUS } from "@/lib/application-stage-mapping";
import { STAGE_EMAIL } from "@/lib/application-workflow";
import { sendApplicationUpdate, sendTemplatedEmail } from "@/lib/email/send";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

const VALID_STAGES = STAGE_META.map(s => s.value);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const ip = getClientIp(request);
  const rl = checkRateLimit(`stage:${ip}`, 30, 60_000);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  console.log("[Applications API] PATCH /api/applications/" + id + "/stage — request received");

  try {
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

    if (!stage) return NextResponse.json({ error: "stage is required" }, { status: 400 });
    if (!VALID_STAGES.includes(stage)) {
      return NextResponse.json({ error: `Invalid stage. Must be one of: ${VALID_STAGES.join(", ")}` }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles").select("role, college_id").eq("id", user.id).single();

    if (!profile || !["admin", "institution"].includes(profile.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Fetch current application values + student email for notifications
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

    // Compute the matching legacy status for this stage
    const newStatus = STAGE_TO_STATUS[stage] ?? "submitted";

    console.log("[Applications API] old status:", app.status,       "| old stage:", app.current_stage);
    console.log("[Applications API] new status:", newStatus,         "| new stage:", stage);

    const { error: updateError } = await supabase
      .from("applications")
      .update({
        current_stage:    stage,
        status:           newStatus,
        stage_updated_at: new Date().toISOString(),
        student_message,
        internal_notes,
        next_action,
      })
      .eq("id", id);

    if (updateError) {
      console.error("[Applications API] update error:", updateError.message);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    console.log("[Applications API] synced status/stage —", newStatus, "/", stage);

    // Timeline event
    const stageMeta = getStageMeta(stage);
    const { error: eventError } = await supabase
      .from("application_timeline_events")
      .insert({
        application_id:     id,
        stage,
        title:              stageMeta.label,
        description:        student_message || stageMeta.description,
        created_by:         user.id,
        created_by_role:    profile.role,
        visible_to_student: true,
      });

    if (eventError) {
      console.error("[Applications API] timeline event error (non-fatal):", eventError.message);
    }

    // Student notification
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
        console.error("[Applications API] notification error (non-fatal):", notifError.message);
      } else {
        console.log("[Applications API] notification sent to student:", app.student_id);
      }
    }

    // Send email notification (non-fatal)
    const stageMeta2 = getStageMeta(stage);
    const { data: studentProfile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", app.student_id)
      .single();
    const { data: courseData } = await supabase
      .from("courses")
      .select("title")
      .eq("id", app.course_id)
      .single();

    if (studentProfile?.email) {
      const courseName = (courseData as { title: string } | null)?.title ?? "your course";
      // Stage-specific templates are centralised in STAGE_EMAIL (application-workflow);
      // stages without one fall back to the generic update email.
      const specificTemplate = STAGE_EMAIL[stage];
      const emailPromise = specificTemplate
        ? sendTemplatedEmail({
            to:            studentProfile.email,
            template:      specificTemplate,
            context: {
              name:       studentProfile.full_name ?? "Student",
              courseName,
              message:    student_message,
            },
            applicationId: id,
            userId:        app.student_id,
            metadata:      { stage },
          })
        : sendApplicationUpdate({
            to:            studentProfile.email,
            name:          studentProfile.full_name ?? "Student",
            courseName,
            stageLabel:    stageMeta2.label,
            message:       student_message,
            applicationId: id,
            userId:        app.student_id,
          });
      emailPromise.catch(err => console.error("[Email] application update failed (non-fatal):", err));
    }

    console.log("[Applications API] stage update complete:", id, "→", stage);
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Applications API] unexpected error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
