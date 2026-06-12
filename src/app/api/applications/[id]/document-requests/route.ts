import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendTemplatedEmail } from "@/lib/email/send";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { recordTimelineEvent, notifyUser, logAudit } from "@/lib/application-timeline";
import { getStageMeta, STAGE_TO_STATUS } from "@/lib/application-workflow";
import { DOCUMENT_TYPES } from "@/types/documents";
import type { DocumentRequestPriority } from "@/types/application-processing";

const VALID_PRIORITIES: DocumentRequestPriority[] = ["low", "normal", "high", "urgent"];
const VALID_DOC_TYPES = DOCUMENT_TYPES.map(d => d.value as string);

// Stages where requesting documents should pull the application back into the
// document phase. Later stages (offer issued onwards) keep their stage.
const DOCUMENT_PHASE_STAGES = [
  "application_submitted", "documents_pending", "documents_uploaded",
  "documents_under_review", "documents_verified",
];

// ─── POST /api/applications/[id]/document-requests ───────────────────────────
// Institution/admin requests a specific document from the student.

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const ip = getClientIp(request);
  const rl = checkRateLimit(`doc-request:${ip}`, LIMITS.documentRequest.limit, LIMITS.documentRequest.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  try {
    let document_type: string;
    let title:         string;
    let description:   string | null;
    let deadline:      string | null;
    let priority:      DocumentRequestPriority;

    try {
      const body = await request.json() as {
        document_type?: string; title?: string; description?: string | null;
        deadline?: string | null; priority?: string;
      };
      document_type = (body.document_type ?? "").trim();
      title         = (body.title ?? "").trim().slice(0, 255);
      description   = body.description?.trim().slice(0, 2000) || null;
      deadline      = body.deadline?.trim() || null;
      priority      = (body.priority ?? "normal") as DocumentRequestPriority;
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (!VALID_DOC_TYPES.includes(document_type)) {
      return NextResponse.json({ error: `document_type must be one of: ${VALID_DOC_TYPES.join(", ")}` }, { status: 400 });
    }
    if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });
    if (!VALID_PRIORITIES.includes(priority)) {
      return NextResponse.json({ error: `priority must be one of: ${VALID_PRIORITIES.join(", ")}` }, { status: 400 });
    }
    if (deadline && !/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
      return NextResponse.json({ error: "deadline must be in YYYY-MM-DD format" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles").select("role, college_id").eq("id", user.id).single();
    if (!profile || !["admin", "institution"].includes(profile.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Application + scope check
    const { data: app } = await supabase
      .from("applications")
      .select("id, student_id, course_id, current_stage, courses (title, college_id, colleges (name))")
      .eq("id", id)
      .single();
    if (!app) return NextResponse.json({ error: "Application not found" }, { status: 404 });

    type RawCourse = { title: string; college_id: string; colleges: { name: string } | { name: string }[] | null };
    const rawCourse  = (Array.isArray(app.courses) ? app.courses[0] : app.courses) as RawCourse | null;
    const rawCollege = rawCourse ? (Array.isArray(rawCourse.colleges) ? rawCourse.colleges[0] : rawCourse.colleges) : null;

    if (profile.role === "institution" && rawCourse?.college_id !== profile.college_id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // ── Create the request ───────────────────────────────────────────────────
    const { data: docRequest, error: insertError } = await supabase
      .from("document_requests")
      .insert({
        application_id: id,
        student_id:     app.student_id,
        requested_by:   user.id,
        document_type,
        title,
        description,
        deadline,
        priority,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // ── Pull the application back into the document phase if needed ──────────
    const currentStage = app.current_stage ?? "application_submitted";
    if (DOCUMENT_PHASE_STAGES.includes(currentStage) && currentStage !== "documents_pending") {
      await supabase
        .from("applications")
        .update({
          current_stage:    "documents_pending",
          status:           STAGE_TO_STATUS.documents_pending,
          stage_updated_at: new Date().toISOString(),
        })
        .eq("id", id);
    }

    const docLabel = DOCUMENT_TYPES.find(d => d.value === document_type)?.label ?? document_type;
    const stageMeta = getStageMeta("documents_pending");
    const deadlineText = deadline
      ? ` Deadline: ${new Date(deadline).toLocaleDateString("en-SG", { day: "numeric", month: "long", year: "numeric" })}.`
      : "";

    // ── Side effects: timeline + notification + audit ────────────────────────
    await recordTimelineEvent(supabase, {
      applicationId: id,
      stage:         "documents_pending",
      title:         `Document Requested — ${docLabel}`,
      description:   `${title}.${description ? ` ${description}` : ""}${deadlineText}`,
      createdBy:     user.id,
      createdByRole: profile.role,
    });

    await notifyUser(supabase, {
      userId:        app.student_id,
      applicationId: id,
      title:         `Document Requested: ${docLabel}`,
      message:       `${title}${deadlineText}`,
      type:          "document_update",
    });

    await logAudit(supabase, {
      applicationId: id,
      actorId:       user.id,
      actorRole:     profile.role,
      action:        "document_requested",
      toValue:       document_type,
      comments:      description,
      metadata:      { request_id: docRequest.id, title, deadline, priority },
    });

    // ── Email (non-fatal) ─────────────────────────────────────────────────────
    const { data: student } = await supabase
      .from("profiles").select("email, full_name").eq("id", app.student_id).single();

    if (student?.email) {
      sendTemplatedEmail({
        to:       student.email,
        template: "document_request",
        context: {
          name:         student.full_name ?? "there",
          documentType: docLabel,
          requestTitle: title,
          message:      description,
          deadline:     deadline
            ? new Date(deadline).toLocaleDateString("en-SG", { day: "numeric", month: "long", year: "numeric" })
            : undefined,
          courseName:   rawCourse?.title,
          collegeName:  rawCollege?.name,
        },
        applicationId: id,
        userId:        app.student_id,
        metadata:      { request_id: docRequest.id, document_type },
      }).catch(err => console.error("[DocRequest] email failed (non-fatal):", err));
    }

    console.log("[DocRequest] created:", docRequest.id, "for app:", id, "type:", document_type, stageMeta.label);
    return NextResponse.json(docRequest, { status: 201 });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[DocRequest] unexpected error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── GET /api/applications/[id]/document-requests ────────────────────────────
// List requests for one application. RLS scopes visibility (student own /
// institution own college / admin all).

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const ip = getClientIp(request);
  const rl = checkRateLimit(`doc-request-list:${ip}`, 60, 60_000);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data, error } = await supabase
    .from("document_requests")
    .select("*")
    .eq("application_id", id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
