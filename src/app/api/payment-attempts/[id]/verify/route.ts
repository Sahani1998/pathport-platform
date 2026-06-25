// POST /api/payment-attempts/[id]/verify
//
// Institution / admin approves a proof_submitted attempt.
//
// Sprint 22 (payment safety):
//   - paid_amount_cents + paid_currency are REQUIRED.
//   - All previously verified paid amounts for the invoice are summed first.
//     This makes multiple partial payments work correctly: attempt 1 = 3500
//     on a 5000 invoice → partially_paid; attempt 2 = 1500 → totalPaid = 5000
//     → paid. Without the sum, attempt 2 would read 1500 < 5000 = partial.
//   - UPDATE is atomic: WHERE status='proof_submitted' closes TOCTOU race.
//
// Transitions (full payment, totalPaid >= invoice.amount_cents):
//   payment_attempt.status  → verified
//   student_invoices.status → paid
//   application.current_stage → ipa_processing | arrival_preparation
//
// Transitions (partial payment, totalPaid < invoice.amount_cents):
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
//   accept_partial?:      boolean  (must be true when totalPaid < invoice amount)
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
import { withIdempotency } from "@/lib/payments/idempotency";
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

  const adminDb = createAdminClient();

  // Idempotency — replay within 24 h returns the cached response
  const idempotencyGuard = await withIdempotency(request, "payment-verify", id, user.id, adminDb);
  if (idempotencyGuard.cached) return idempotencyGuard.cachedResponse!;

  const callerCollegeId = profile.role === "institution" ? (profile.college_id ?? "") : null;
  const ctx = await loadAttemptWithContext(supabase, id, callerCollegeId);
  if (!ctx) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (ctx.attempt.status !== "proof_submitted") {
    return NextResponse.json(
      { error: `Attempt is ${ctx.attempt.status} — only proof_submitted attempts can be verified` },
      { status: 409 },
    );
  }

  // Sum previously verified paid amounts for this invoice.
  // Supports multiple partial payments: e.g. 3500 + 1500 on a 5000 invoice
  // correctly resolves to paid rather than staying partially_paid.
  const { data: prevVerified } = await supabase
    .from("payment_attempts")
    .select("paid_amount_cents")
    .eq("invoice_id", ctx.invoice.id)
    .eq("status", "verified");

  const previouslyPaidCents = (prevVerified ?? []).reduce(
    (sum, a) => sum + ((a as { paid_amount_cents: number | null }).paid_amount_cents ?? 0),
    0,
  );
  const totalPaidCents = previouslyPaidCents + paidAmountCents;
  const isPartial      = totalPaidCents < ctx.invoice.amount_cents;

  if (totalPaidCents > ctx.invoice.amount_cents) {
    return NextResponse.json({
      error:                 `Total payments (${formatCents(totalPaidCents, paidCurrency)}) would exceed invoice amount (${formatCents(ctx.invoice.amount_cents, ctx.invoice.currency as Currency)})`,
      invoice_amount_cents:  ctx.invoice.amount_cents,
      paid_amount_cents:     paidAmountCents,
      previously_paid_cents: previouslyPaidCents,
      total_paid_after_this: totalPaidCents,
    }, { status: 400 });
  }

  // Amount guard: total after this payment still < invoice requires explicit partial opt-in
  if (isPartial && !acceptPartial) {
    return NextResponse.json({
      error: `Total payments (${formatCents(totalPaidCents, paidCurrency)}) will be less than invoice amount (${formatCents(ctx.invoice.amount_cents, ctx.invoice.currency as Currency)}). Set accept_partial: true to record as a partial payment.`,
      invoice_amount_cents:    ctx.invoice.amount_cents,
      paid_amount_cents:       paidAmountCents,
      previously_paid_cents:   previouslyPaidCents,
      total_paid_after_this:   totalPaidCents,
    }, { status: 400 });
  }

  const now = new Date().toISOString();

  // Atomic UPDATE — WHERE status='proof_submitted' closes the TOCTOU race.
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

  // Update invoice status — admin client required; fatal if it fails
  const invoiceStatus = isPartial ? "partially_paid" : "paid";
  const { error: invErr } = await adminDb
    .from("student_invoices")
    .update({
      status:  invoiceStatus,
      paid_at: isPartial ? null : now,
    })
    .eq("id", ctx.invoice.id);
  if (invErr) {
    console.error("[Verify] invoice update failed:", invErr.message);
    return NextResponse.json(
      { error: "Payment attempt recorded but invoice status update failed — please contact support." },
      { status: 500 },
    );
  }

  // ─── Side effects (non-fatal, admin client) ────────────────────────────────

  if (isPartial) {
    const paidStr      = formatCents(paidAmountCents, paidCurrency);
    const invoiceStr   = formatCents(ctx.invoice.amount_cents, ctx.invoice.currency as Currency);
    const remainingStr = formatCents(ctx.invoice.amount_cents - totalPaidCents, ctx.invoice.currency as Currency);
    await Promise.all([
      notifyUser(adminDb, {
        userId:        ctx.studentId,
        applicationId: ctx.applicationId,
        title:         "Partial payment received",
        message:       `Payment of ${paidStr} received on invoice ${ctx.invoice.public_id ?? ""}. Total received: ${formatCents(totalPaidCents, paidCurrency)} of ${invoiceStr}. Remaining balance: ${remainingStr}. Please arrange the outstanding amount.`,
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
          previously_paid:      previouslyPaidCents,
          total_paid:           totalPaidCents,
          invoice_amount_cents: ctx.invoice.amount_cents,
          invoice_currency:     ctx.invoice.currency,
          remaining_cents:      ctx.invoice.amount_cents - totalPaidCents,
          notes,
        },
      }),
    ]);

    const partialBody = {
      attempt:             updatedAttempt,
      partial:             true,
      previously_paid:     previouslyPaidCents,
      total_paid:          totalPaidCents,
      remaining:           ctx.invoice.amount_cents - totalPaidCents,
      message:             "Partial payment recorded. No stage advance. Issue receipt only after full invoice amount is verified.",
    };
    await idempotencyGuard.store(partialBody, 200);
    return NextResponse.json(partialBody);
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
      invoice_id:          ctx.invoice.id,
      attempt_id:          id,
      fee_type:            feeType,
      amount_cents:        ctx.invoice.amount_cents,
      currency:            ctx.invoice.currency,
      previously_paid:     previouslyPaidCents,
      total_paid:          totalPaidCents,
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

  const fullBody = {
    attempt:           updatedAttempt,
    advanced_to_stage: toStage,
    advanced_to_label: getStageMeta(toStage).label,
  };
  await idempotencyGuard.store(fullBody, 200);
  return NextResponse.json(fullBody);
}
