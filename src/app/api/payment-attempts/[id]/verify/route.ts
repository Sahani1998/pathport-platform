// POST /api/payment-attempts/[id]/verify
//
// Institution / admin approves a proof_submitted attempt.
//
// Sprint 22 (payment safety):
//   - paid_amount_cents + paid_currency are REQUIRED.
//   - Amount is compared to invoice: if paid < invoice, accept_partial: true
//     must be sent explicitly. Partial payments do not advance the stage and
//     cannot receive an official receipt until the full amount is verified.
//   - UPDATE is atomic: WHERE status='proof_submitted' closes the TOCTOU race
//     where two concurrent verify calls would both mark the invoice paid.
//
// Transitions (full payment):
//   payment_attempt.status  → verified
//   student_invoices.status → paid
//   application.current_stage → ipa_processing | arrival_preparation
//
// Transitions (partial payment):
//   payment_attempt.status  → verified
//   student_invoices.status → partially_paid
//   application.current_stage → unchanged
//
// Body (JSON): {
//   paid_amount_cents:    number   (required, positive integer)
//   paid_currency:        string   (required — SGD/USD/INR/GBP/EUR/AUD)
//   payment_date?:        string   (YYYY-MM-DD, not future)
//   reconciliation_memo?: string
//   notes?:               string
//   accept_partial?:      boolean  (must be true when paid < invoice amount)
// }

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { checkRateLimitAsync, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { advanceApplicationStage, notifyUser, logAudit } from "@/lib/application-timeline";
import { sendTemplatedEmail } from "@/lib/email/send";
import { formatCents } from "@/lib/payments/invoice-helpers";
import { loadAttemptWithContext } from "@/lib/payments/verification-helpers";
import { resolveStageAdvance } from "@/lib/payments/stage-advance";
import type { Currency, InvoiceFeeType } from "@/types/payment";
import type { ApplicationStage } from "@/types/timeline";
import { getStageMeta } from "@/types/timeline";

const ALLOWED_CURRENCIES = new Set(["SGD", "USD", "INR", "GBP", "EUR", "AUD"]);

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
  const notes              = typeof body.notes === "string"               ? body.notes.trim()                : null;
  const reconciliationMemo = typeof body.reconciliation_memo === "string" ? body.reconciliation_memo.trim()  : null;
  const paymentDate        = typeof body.payment_date === "string"        ? body.payment_date                : null;
  const paidAmountCents    = typeof body.paid_amount_cents === "number"   ? body.paid_amount_cents            : null;
  const paidCurrencyRaw    = typeof body.paid_currency === "string"       ? body.paid_currency.toUpperCase() : null;
  const acceptPartial      = body.accept_partial === true;

  // Validate required fields
  if (paidAmountCents === null || !Number.isInteger(paidAmountCents) || paidAmountCents <= 0) {
    return NextResponse.json(
      { error: "paid_amount_cents is required and must be a positive integer" },
      { status: 400 },
    );
  }
  if (!paidCurrencyRaw || !ALLOWED_CURRENCIES.has(paidCurrencyRaw)) {
    return NextResponse.json(
      { error: "paid_currency is required and must be one of: SGD, USD, INR, GBP, EUR, AUD" },
      { status: 400 },
    );
  }
  const paidCurrency = paidCurrencyRaw as Currency;

  // Payment date must not be in the future
  if (paymentDate) {
    const today = new Date().toISOString().slice(0, 10);
    if (paymentDate > today) {
      return NextResponse.json({ error: "payment_date cannot be in the future" }, { status: 400 });
    }
  }

  const callerCollegeId = profile.role === "institution" ? (profile.college_id ?? "") : null;
  const ctx = await loadAttemptWithContext(supabase, id, callerCollegeId);
  if (!ctx) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (ctx.attempt.status !== "proof_submitted") {
    return NextResponse.json(
      { error: `Attempt is ${ctx.attempt.status} — only proof_submitted attempts can be verified` },
      { status: 409 },
    );
  }

  // Amount guard: paid < invoice requires explicit opt-in to partial payment
  const isPartial = paidAmountCents < ctx.invoice.amount_cents;
  if (isPartial && !acceptPartial) {
    return NextResponse.json({
      error: `Amount received (${formatCents(paidAmountCents, paidCurrency)}) is less than invoice amount (${formatCents(ctx.invoice.amount_cents, ctx.invoice.currency as Currency)}). Set accept_partial: true to record as a partial payment.`,
      invoice_amount_cents: ctx.invoice.amount_cents,
      paid_amount_cents:    paidAmountCents,
    }, { status: 400 });
  }

  const now = new Date().toISOString();

  // Atomic UPDATE — WHERE status='proof_submitted' is the idempotency guard.
  // A concurrent verify that already processed this attempt will have changed
  // its status to 'verified', so this UPDATE matches 0 rows → PGRST116 → 409.
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
    .eq("status", "proof_submitted")
    .select()
    .single();

  if (attErr) {
    if (attErr.code === "PGRST116") {
      return NextResponse.json(
        { error: "Payment proof has already been processed" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: attErr.message }, { status: 500 });
  }

  // Update invoice status
  const invoiceStatus = isPartial ? "partially_paid" : "paid";
  const { error: invErr } = await supabase
    .from("student_invoices")
    .update({
      status:  invoiceStatus,
      paid_at: isPartial ? null : now,
    })
    .eq("id", ctx.invoice.id);
  if (invErr) console.error("[Verify] invoice update failed:", invErr.message);

  // ─── Side effects (non-fatal, admin client) ────────────────────────────────
  const adminDb = createAdminClient();

  if (isPartial) {
    // Partial: notify student, log audit. No stage advance, no email.
    const paidStr    = formatCents(paidAmountCents, paidCurrency);
    const invoiceStr = formatCents(ctx.invoice.amount_cents, ctx.invoice.currency as Currency);
    await Promise.all([
      notifyUser(adminDb, {
        userId:        ctx.studentId,
        applicationId: ctx.applicationId,
        title:         "Partial payment received",
        message:       `Payment of ${paidStr} received on invoice ${ctx.invoice.public_id ?? ""}. Invoice amount: ${invoiceStr}. Please arrange the remaining balance.`,
        type:          "payment_update",
      }),
      logAudit(adminDb, {
        applicationId: ctx.applicationId,
        actorId:       user.id,
        actorRole:     profile.role,
        action:        "payment_partial",
        metadata: {
          invoice_id:           ctx.invoice.id,
          attempt_id:           id,
          paid_amount_cents:    paidAmountCents,
          paid_currency:        paidCurrency,
          invoice_amount_cents: ctx.invoice.amount_cents,
          invoice_currency:     ctx.invoice.currency,
          notes,
        },
      }),
    ]);

    return NextResponse.json({
      attempt: updatedAttempt,
      partial: true,
      message: "Partial payment recorded. No stage advance. Issue receipt only after full payment is verified.",
    });
  }

  // Full payment: advance stage
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

  return NextResponse.json({
    attempt:           updatedAttempt,
    advanced_to_stage: toStage,
    advanced_to_label: getStageMeta(toStage).label,
  });
}
