import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendTemplatedEmail } from "@/lib/email/send";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { recordTimelineEvent, notifyUser, logAudit, advanceApplicationStage } from "@/lib/application-timeline";
import type { IpaStatus } from "@/types/application-processing";

const VALID_STATUSES: IpaStatus[] = ["submitted", "pending", "approved", "rejected"];

// ─── PATCH /api/ipa/[id] ─────────────────────────────────────────────────────
// Institution/admin updates the IPA status. Approval advances the application
// to the `approved` stage and triggers the ipa_approved email.

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const ip = getClientIp(request);
  const rl = checkRateLimit(`ipa-update:${ip}`, LIMITS.ipaWrite.limit, LIMITS.ipaWrite.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  try {
    let status: IpaStatus;
    let notes:  string | null;

    try {
      const body = await request.json() as { status?: string; notes?: string | null };
      status = body.status as IpaStatus;
      notes  = body.notes?.trim().slice(0, 2000) || null;
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: `status must be one of: ${VALID_STATUSES.join(", ")}` }, { status: 400 });
    }
    if (status === "rejected" && !notes) {
      return NextResponse.json({ error: "notes are required when rejecting an IPA" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles").select("role").eq("id", user.id).single();
    if (!profile || !["admin", "institution"].includes(profile.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // RLS restricts institution users to their own college's records.
    const { data: record } = await supabase
      .from("ipa_records")
      .select("id, application_id, status")
      .eq("id", id)
      .single();
    if (!record) return NextResponse.json({ error: "IPA record not found" }, { status: 404 });
    if (record.status === status) {
      return NextResponse.json({ error: `IPA is already ${status}` }, { status: 409 });
    }

    const { data: app } = await supabase
      .from("applications")
      .select("id, student_id, course_id, current_stage, courses (title, colleges (name))")
      .eq("id", record.application_id)
      .single();
    if (!app) return NextResponse.json({ error: "Application not found" }, { status: 404 });

    const decided = status === "approved" || status === "rejected";
    const { error: updateErr } = await supabase
      .from("ipa_records")
      .update({
        status,
        notes:      notes ?? undefined,
        decided_at: decided ? new Date().toISOString() : null,
      })
      .eq("id", id);
    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    type RawCourse = { title: string; colleges: { name: string } | { name: string }[] | null };
    const rawCourse  = (Array.isArray(app.courses) ? app.courses[0] : app.courses) as RawCourse | null;
    const rawCollege = rawCourse ? (Array.isArray(rawCourse.colleges) ? rawCourse.colleges[0] : rawCourse.colleges) : null;

    if (status === "approved") {
      // Full stage advance: applications row + timeline + notification + audit
      await advanceApplicationStage(supabase, {
        applicationId: app.id,
        studentId:     app.student_id,
        fromStage:     app.current_stage ?? null,
        toStage:       "approved",
        actorId:       user.id,
        actorRole:     profile.role,
        auditAction:   "ipa_approved",
        auditMetadata: { ipa_record_id: id, notes },
      });
    } else {
      const statusCopy: Record<Exclude<IpaStatus, "approved">, { title: string; message: string }> = {
        submitted: { title: "IPA Submitted to ICA",  message: "Your IPA application has been submitted to ICA Singapore." },
        pending:   { title: "IPA Update",            message: "Your IPA application is pending with ICA Singapore." },
        rejected:  { title: "IPA Update — Action Needed", message: `Your IPA application was not approved.${notes ? ` Reason: ${notes}` : ""} Your institution will contact you about next steps.` },
      };
      const copy = statusCopy[status];

      await recordTimelineEvent(supabase, {
        applicationId: app.id,
        stage:         "ipa_processing",
        title:         copy.title,
        description:   copy.message,
        createdBy:     user.id,
        createdByRole: profile.role,
      });

      await notifyUser(supabase, {
        userId:        app.student_id,
        applicationId: app.id,
        title:         copy.title,
        message:       copy.message,
        type:          "application_update",
      });

      await logAudit(supabase, {
        applicationId: app.id,
        actorId:       user.id,
        actorRole:     profile.role,
        action:        `ipa_${status}`,
        fromValue:     record.status,
        toValue:       status,
        reason:        notes,
        metadata:      { ipa_record_id: id },
      });
    }

    // ── Email on approval (non-fatal) ─────────────────────────────────────────
    if (status === "approved") {
      const { data: student } = await supabase
        .from("profiles").select("email, full_name").eq("id", app.student_id).single();
      if (student?.email) {
        sendTemplatedEmail({
          to:       student.email,
          template: "ipa_approved",
          context: {
            name:        student.full_name ?? "there",
            courseName:  rawCourse?.title,
            collegeName: rawCollege?.name,
          },
          applicationId: app.id,
          userId:   app.student_id,
          metadata: { ipa_record_id: id },
        }).catch(err => console.error("[IPA] approval email failed (non-fatal):", err));
      }
    }

    console.log("[IPA]", id, "→", status, "by", user.id);
    return NextResponse.json({ success: true, status }, { status: 200 });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[IPA] update error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
