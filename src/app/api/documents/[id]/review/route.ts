import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { sendTemplatedEmail } from "@/lib/email/send";
import { DOCUMENT_TYPES } from "@/types/documents";
import type { DocumentStatus } from "@/types/documents";
import { recordTimelineEvent, notifyUser, logAudit } from "@/lib/application-timeline";

const VALID_ACTIONS: DocumentStatus[] = ["verified", "rejected", "reupload_required"];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const ip = getClientIp(request);
  const rl = checkRateLimit(`doc-review:${ip}`, LIMITS.documentReview.limit, LIMITS.documentReview.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  try {
    let action: DocumentStatus;
    let comment: string | null;

    try {
      const body = await request.json() as { action?: string; comment?: string | null };
      action  = (body.action  ?? "") as DocumentStatus;
      comment = body.comment?.trim() || null;
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (!VALID_ACTIONS.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(", ")}` },
        { status: 400 },
      );
    }

    // Comments are mandatory when a document is sent back to the student —
    // they need to know what to fix.
    if ((action === "rejected" || action === "reupload_required") && !comment) {
      return NextResponse.json(
        { error: "A comment is required when rejecting or requesting re-upload" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, college_id, full_name")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "institution"].includes(profile.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Fetch document + application + course + student
    const { data: doc, error: docError } = await supabase
      .from("student_documents")
      .select("id, student_id, application_id, document_type, status, file_name")
      .eq("id", id)
      .single();

    if (docError || !doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Institution: verify the document belongs to their college
    if (profile.role === "institution" && doc.application_id) {
      const { data: app } = await supabase
        .from("applications")
        .select("course_id, courses(college_id)")
        .eq("id", doc.application_id)
        .single();

      const rawCourse = Array.isArray(app?.courses) ? app.courses[0] : app?.courses;
      const collegeId = (rawCourse as { college_id?: string } | null)?.college_id;

      if (!app || collegeId !== profile.college_id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    const oldStatus = doc.status as DocumentStatus;
    const now       = new Date().toISOString();

    // ── 1. Update student_documents ─────────────────────────────────────────
    const { error: updateErr } = await supabase
      .from("student_documents")
      .update({
        status:           action,
        rejection_reason: (action === "rejected" || action === "reupload_required") ? comment : null,
        reviewed_at:      now,
        reviewed_by:      user.id,
      })
      .eq("id", id);

    if (updateErr) {
      console.error("[DocReview] update error:", updateErr.message);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // ── 2. Insert document_reviews history row ───────────────────────────────
    await supabase.from("document_reviews").insert({
      document_id: id,
      reviewer_id: user.id,
      status:      action,
      comment,
    });

    // Resolve document type label
    const docMeta    = DOCUMENT_TYPES.find(d => d.value === doc.document_type);
    const docLabel   = docMeta?.label ?? doc.document_type;

    // ── 3. Notification ──────────────────────────────────────────────────────
    const notifCopy: Record<DocumentStatus, { title: string; message: string }> = {
      verified:          { title: `Document verified — ${docLabel}`,       message: `Your ${docLabel} has been verified.${comment ? " Comment: " + comment : ""}` },
      rejected:          { title: `Document not accepted — ${docLabel}`,   message: `Your ${docLabel} was not accepted.${comment ? " Reason: " + comment : ""}` },
      reupload_required: { title: `Re-upload required — ${docLabel}`,      message: `Please re-upload your ${docLabel}.${comment ? " Note: " + comment : ""}` },
      pending:           { title: `Document pending review — ${docLabel}`, message: `Your ${docLabel} is awaiting review.` },
    };

    if (doc.application_id) {
      await notifyUser(supabase, {
        userId:        doc.student_id,
        applicationId: doc.application_id,
        title:         notifCopy[action].title,
        message:       notifCopy[action].message,
        type:          "document_update",
      });

      await recordTimelineEvent(supabase, {
        applicationId: doc.application_id,
        stage:         "documents_under_review",
        title:         notifCopy[action].title,
        description:   notifCopy[action].message,
        createdBy:     user.id,
        createdByRole: profile.role,
      });

      await logAudit(supabase, {
        applicationId: doc.application_id,
        actorId:       user.id,
        actorRole:     profile.role,
        action:        `document_${action}`,
        fromValue:     oldStatus,
        toValue:       action,
        reason:        comment,
        comments:      comment,
        metadata: {
          document_id:   id,
          document_type: doc.document_type,
          file_name:     doc.file_name,
        },
      });
    }

    // ── 6. Email (non-fatal) ─────────────────────────────────────────────────
    if (doc.student_id) {
      const { data: student } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", doc.student_id)
        .single();

      if (student?.email) {
        const templateMap: Record<DocumentStatus, "document_verified" | "document_rejected" | "document_reupload_requested"> = {
          verified:          "document_verified",
          rejected:          "document_rejected",
          reupload_required: "document_reupload_requested",
          pending:           "document_verified", // fallback (never triggered)
        };

        if (action !== "pending") {
          await sendTemplatedEmail({
            to:            student.email,
            template:      templateMap[action],
            context: {
              name:         student.full_name ?? "there",
              documentType: docLabel,
              collegeName:  profile.role === "institution" ? (profile.full_name ?? undefined) : undefined,
              comment,
            },
            applicationId: doc.application_id ?? null,
            userId:        doc.student_id,
            metadata:      { document_id: id, action },
          });
        }
      }
    }

    console.log("[DocReview] document", id, "→", action, "by", user.id);
    return NextResponse.json({ success: true, status: action }, { status: 200 });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[DocReview] unexpected error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
