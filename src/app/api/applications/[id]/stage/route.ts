import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ApplicationStage } from "@/types/timeline";
import { STAGE_META, STAGE_NOTIFICATION } from "@/types/timeline";
import { STAGE_EMAIL, canTransition } from "@/lib/application-workflow";
import { STAGE_TO_STATUS } from "@/lib/application-stage-mapping";
import { recordTimelineEvent, notifyUser, logAudit } from "@/lib/application-timeline";
import { sendApplicationUpdate, sendTemplatedEmail } from "@/lib/email/send";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";

const VALID_STAGES = STAGE_META.map(s => s.value);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const ip = getClientIp(request);
  const rl = checkRateLimit(`stage:${ip}`, LIMITS.stage.limit, LIMITS.stage.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

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
      return NextResponse.json(
        { error: `Invalid stage. Must be one of: ${VALID_STAGES.join(", ")}` },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles").select("role, college_id").eq("id", user.id).single();

    if (!profile || !["admin", "institution"].includes(profile.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

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

    // Enforce allowed transitions
    const fromStage = app.current_stage as ApplicationStage | null;
    if (fromStage && !canTransition(fromStage, stage)) {
      return NextResponse.json(
        { error: `Invalid transition: cannot move from "${fromStage}" to "${stage}"` },
        { status: 422 }
      );
    }

    const newStatus = STAGE_TO_STATUS[stage] ?? "submitted";

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

    // Side effects via helpers — non-fatal individually
    await recordTimelineEvent(supabase, {
      applicationId: id,
      stage,
      description:   student_message ?? undefined,
      createdBy:     user.id,
      createdByRole: profile.role,
    });

    const notifTemplate = STAGE_NOTIFICATION[stage];
    if (notifTemplate) {
      await notifyUser(supabase, {
        userId:        app.student_id,
        applicationId: id,
        title:         notifTemplate.title,
        message:       student_message || notifTemplate.message,
        type:          notifTemplate.type,
      });
    }

    await logAudit(supabase, {
      applicationId: id,
      actorId:       user.id,
      actorRole:     profile.role,
      action:        "stage_changed",
      fromValue:     fromStage,
      toValue:       stage,
      comments:      student_message ?? null,
      metadata:      { internal_notes, next_action },
    });

    // Email — non-fatal
    const [{ data: studentProfile }, { data: courseData }] = await Promise.all([
      supabase.from("profiles").select("email, full_name").eq("id", app.student_id).single(),
      supabase.from("courses").select("title").eq("id", app.course_id).single(),
    ]);

    if (studentProfile?.email) {
      const stageMeta  = STAGE_META.find(s => s.value === stage);
      const courseName = (courseData as { title: string } | null)?.title ?? "your course";
      const specificTemplate = STAGE_EMAIL[stage];

      const emailPromise = specificTemplate
        ? sendTemplatedEmail({
            to:            studentProfile.email,
            template:      specificTemplate,
            context:       { name: studentProfile.full_name ?? "Student", courseName, message: student_message },
            applicationId: id,
            userId:        app.student_id,
            metadata:      { stage },
          })
        : sendApplicationUpdate({
            to:            studentProfile.email,
            name:          studentProfile.full_name ?? "Student",
            courseName,
            stageLabel:    stageMeta?.label ?? stage,
            message:       student_message,
            applicationId: id,
            userId:        app.student_id,
          });

      emailPromise.catch(err => console.error("[Email] application update failed (non-fatal):", err));
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Applications API] unexpected error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
