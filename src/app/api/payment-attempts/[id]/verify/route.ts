// POST /api/payment-attempts/[id]/verify
//
// Institution / admin approves a proof_submitted attempt.
// Transitions:
//   payment_attempt.status  → verified
//   student_invoices.status → paid
//   application.current_stage → ipa_processing   (via advanceApplicationStage)
//
// Side effects (non-fatal, via admin client):
//   - student notification (payment_update)
//   - timeline event tagged to ipa_processing
//   - audit log entry
//   - email to student (payment_verified)
//   - email to student (official_receipt_issued) after receipt creation
//
// Body (JSON): { notes?: string, paid_amount_cents?: number, paid_currency?: string,
//               payment_date?: string, reconciliation_memo?: string }

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { checkRateLimitAsync, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { advanceApplicationStage, notifyUser, logAudit } from "@/lib/application-timeline";
import { sendTemplatedEmail } from "@/lib/email/send";
import { formatCents } from "@/lib/payments/invoice-helpers";
import { loadAttemptWithContext } from "@/lib/payments/verification-helpers";
import type { Currency, InvoiceFeeType } from "@/types/payment";
import type { ApplicationStage } from "@/types/timeline";

// Sprint 19: decide which stage to advance to based on the invoice's fee_type
// and the application's current stage. Legacy invoices (fee_type=null) fall
// through to the original application-fee path so existing behaviour is
// preserved.
function resolveStageAdvance(
  currentStage: ApplicationStage,
  feeType: InvoiceFeeType | null,
): { toStage: ApplicationStage; studentMessage: string } {
  if (feeType === "tuition_fee" || currentStage === "tuition_fee_payment_pending") {
    return {
      toStage:        "arrival_preparation",
      studentMessage: "Your tuition fee has been verified. Arrival preparation is now underway.",
    };
  }
  // Application fee path (default — also covers legacy fee_type=null).
  return {
    toStage:        "ipa_processing",
    studentMessage: "Your payment has been verified. Your IPA application is now being processed.",
  };
}

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
  const notes              = typeof body.notes === "string"                ? body.notes.trim()           : null;
  const reconciliationMemo = typeof body.reconciliation_memo === "string"  ? body.reconciliation_memo.trim() : null;
  const paymentDate        = typeof body.payment_date === "string"         ? body.payment_date           : null;
  const paidAmountCents    = typeof body.paid_amount_cents === "number"    ? body.paid_amount_cents      : null;
  const paidCurrency       = typeof body.paid_currency === "string"        ? body.paid_currency          : null;

  const callerCollegeId = profile.role === "institution" ? (profile.college_id ?? "") : null;
  const ctx = await loadAttemptWithContext(supabase, id, callerCollegeId);
  if (!ctx) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (ctx.attempt.status !== "proof_submitted") {
    return NextResponse.json(
      { error: `Attempt is ${ctx.attempt.status} — only proof_submitted attempts can be verified` },
      { status: 409 },
    );
  }

  const now = new Date().toISOString();

  // 1. Mark attempt verified
  const { data: updatedAttempt, error: attErr } = await supabase
    .from("payment_attempts")
    .update({
      status:              "verified",
      verified_by:         user.id,
      verified_at:         now,
      reconciliation_memo: reconciliationMemo,
      paid_amount_cents:   paidAmountCents,
      paid_currency:       paidCurrency,
      payment_date:        paymentDate,
    })
    .eq("id", id)
    .select()
    .single();
  if (attErr) return NextResponse.json({ error: attErr.message }, { status: 500 });

  // 2. Mark invoice paid
  const { error: invErr } = await supabase
    .from("student_invoices")
    .update({ status: "paid", paid_at: now })
    .eq("id", ctx.invoice.id);
  if (invErr) console.error("[Verify] invoice paid update failed:", invErr.message);

  // ─── Side effects (non-fatal, admin client) ────────────────────────────────
  const adminDb = createAdminClient();

  // 3. Advance stage — fee-type aware (Sprint 19).
  //    application_fee (or legacy null): fee_payment_pending → ipa_processing
  //    tuition_fee:                      tuition_fee_payment_pending → arrival_preparation
  const { data: appRow } = await adminDb
    .from("applications")
    .select("current_stage, status")
    .eq("id", ctx.applicationId)
    .single();

  const currentStage = (appRow?.current_stage ?? "fee_payment_pending") as ApplicationStage;
  const feeType      = (ctx.invoice.fee_type ?? null) as InvoiceFeeType | null;
  const { toStage, studentMessage } = resolveStageAdvance(currentStage, feeType);

  const stageResult = await advanceApplicationStage(adminDb, {
    applicationId:  ctx.applicationId,
    studentId:      ctx.studentId,
    fromStage:      currentStage,
    toStage,
    actorId:        user.id,
    actorRole:      profile.role,
    studentMessage,
    auditAction:    "payment_verified",
    auditMetadata: {
      invoice_id:   ctx.invoice.id,
      attempt_id:   id,
      fee_type:     feeType,
      amount_cents: ctx.invoice.amount_cents,
      currency:     ctx.invoice.currency,
      notes,
    },
  });
  if (!stageResult.success) {
    console.error("[Verify] stage advance failed:", stageResult.error);
  }

  // 4. Email student — payment verified
  const [
    { data: studentProfile },
    { data: courseRow },
    { data: collegeRow },
  ] = await Promise.all([
    adminDb.from("profiles").select("email, full_name").eq("id", ctx.studentId).single(),
    adminDb.from("courses").select("title").eq("id", ctx.courseId).single(),
    adminDb.from("colleges").select("name").eq("id", ctx.collegeId).single(),
  ]);

  const amountStr = formatCents(ctx.invoice.amount_cents, ctx.invoice.currency as Currency);

  if (studentProfile?.email) {
    sendTemplatedEmail({
      to:       studentProfile.email,
      template: "payment_verified",
      context: {
        name:          studentProfile.full_name ?? "Student",
        courseName:    (courseRow as { title: string } | null)?.title ?? "your course",
        collegeName:   (collegeRow as { name: string } | null)?.name ?? "",
        invoiceNumber: ctx.invoice.public_id ?? "",
        amount:        amountStr,
      },
      applicationId: ctx.applicationId,
      userId:        ctx.studentId,
    }).catch(err => console.error("[Verify] email failed (non-fatal):", err));
  }

  return NextResponse.json({ attempt: updatedAttempt });
}
