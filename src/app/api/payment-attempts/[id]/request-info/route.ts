// POST /api/payment-attempts/[id]/request-info
//
// Institution / admin requests additional information from the student.
// Transitions:
//   payment_attempt.status  → info_requested
//   student_invoices.status → payment_action_required
//
// Body (JSON): { message: string }  — message is required

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { checkRateLimitAsync, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { notifyUser, recordTimelineEvent, logAudit } from "@/lib/application-timeline";
import { sendTemplatedEmail } from "@/lib/email/send";
import { loadAttemptWithContext } from "@/lib/payments/verification-helpers";
import type { ApplicationStage } from "@/types/timeline";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ip = getClientIp(request);
  const rl = await checkRateLimitAsync(`payment-verify:${ip}`, LIMITS.paymentVerify.limit, LIMITS.paymentVerify.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role, college_id").eq("id", user.id).single();
  if (profile?.role !== "institution" && profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return NextResponse.json({ error: "A message is required when requesting additional information" }, { status: 400 });
  }

  const callerCollegeId = profile.role === "institution" ? (profile.college_id ?? "") : null;
  const ctx = await loadAttemptWithContext(supabase, id, callerCollegeId);
  if (!ctx) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (ctx.attempt.status !== "proof_submitted") {
    return NextResponse.json(
      { error: `Attempt is ${ctx.attempt.status} — only proof_submitted attempts can receive info requests` },
      { status: 409 },
    );
  }

  // 1. Mark attempt info_requested
  const { data: updatedAttempt, error: attErr } = await supabase
    .from("payment_attempts")
    .update({ status: "info_requested", info_request_message: message })
    .eq("id", id)
    .select()
    .single();
  if (attErr) return NextResponse.json({ error: attErr.message }, { status: 500 });

  // 2. Return invoice to payment_action_required
  const { error: invErr } = await supabase
    .from("student_invoices")
    .update({ status: "payment_action_required" })
    .eq("id", ctx.invoice.id);
  if (invErr) console.error("[RequestInfo] invoice status update failed:", invErr.message);

  // ─── Side effects (non-fatal, admin client) ────────────────────────────────
  const adminDb = createAdminClient();

  const { data: appRow } = await adminDb
    .from("applications")
    .select("current_stage")
    .eq("id", ctx.applicationId)
    .single();
  const stage = (appRow?.current_stage as ApplicationStage | null) ?? "fee_payment_pending";

  await Promise.all([
    notifyUser(adminDb, {
      userId:        ctx.studentId,
      applicationId: ctx.applicationId,
      title:         "Additional information requested",
      message:       `The finance team has requested more information about your payment. ${message}`,
      type:          "payment_update",
    }),
    recordTimelineEvent(adminDb, {
      applicationId:    ctx.applicationId,
      stage,
      title:            "Additional payment information requested",
      description:      message,
      createdBy:        user.id,
      createdByRole:    profile.role,
      visibleToStudent: true,
    }),
    logAudit(adminDb, {
      applicationId: ctx.applicationId,
      actorId:       user.id,
      actorRole:     profile.role,
      action:        "payment_info_requested",
      fromValue:     "proof_submitted",
      toValue:       "info_requested",
      comments:      message,
      metadata: {
        invoice_id: ctx.invoice.id,
        attempt_id: id,
      },
    }),
  ]);

  // Email student
  const [{ data: studentProfile }, { data: courseRow }, { data: collegeRow }] = await Promise.all([
    adminDb.from("profiles").select("email, full_name").eq("id", ctx.studentId).single(),
    adminDb.from("courses").select("title").eq("id", ctx.courseId).single(),
    adminDb.from("colleges").select("name").eq("id", ctx.collegeId).single(),
  ]);
  if (studentProfile?.email) {
    sendTemplatedEmail({
      to:       studentProfile.email,
      template: "payment_info_requested",
      context: {
        name:        studentProfile.full_name ?? "Student",
        courseName:  (courseRow as { title: string } | null)?.title ?? "your course",
        collegeName: (collegeRow as { name: string } | null)?.name ?? "",
        message,
      },
      applicationId: ctx.applicationId,
      userId:        ctx.studentId,
    }).catch(err => console.error("[RequestInfo] email failed (non-fatal):", err));
  }

  return NextResponse.json({ attempt: updatedAttempt });
}
