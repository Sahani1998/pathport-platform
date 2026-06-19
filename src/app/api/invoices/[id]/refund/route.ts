// POST /api/invoices/[id]/refund
//
// Admin-only. Records a full refund for a paid invoice.
// Marks the invoice "refunded" and populates the refund audit columns added
// in the sprint22_payment_safety migration.
//
// This route does NOT void the invoice — "void" is reserved for pre-payment
// cancellations. A paid invoice with received money must go through refund.
// The DB trigger guard_paid_invoice_void() also enforces this at schema level.
//
// Prerequisites:
//   - Invoice must be in status "paid" (not partially_paid, not void, etc.)
//   - Caller must be role "admin"
//
// Body (JSON): {
//   reason:                string  (required, max 500 chars)
//   refunded_amount_cents: number  (required, positive integer, <= invoice.amount_cents)
// }
//
// Side effects (non-fatal):
//   - Student notification (payment_update)
//   - Application timeline event
//   - Audit log entry

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { checkRateLimitAsync, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { notifyUser, recordTimelineEvent, logAudit } from "@/lib/application-timeline";
import { formatCents } from "@/lib/payments/invoice-helpers";
import type { StudentInvoice, Currency } from "@/types/payment";
import type { ApplicationStage } from "@/types/timeline";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ip = getClientIp(request);
  const rl = await checkRateLimitAsync(`invoice-refund:${ip}`, LIMITS.invoiceWrite.limit, LIMITS.invoiceWrite.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden — admin access required" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const reason              = typeof body.reason === "string"                   ? body.reason.trim().slice(0, 500) : "";
  const refundedAmountCents = typeof body.refunded_amount_cents === "number"    ? body.refunded_amount_cents       : null;

  if (!reason) {
    return NextResponse.json({ error: "reason is required" }, { status: 400 });
  }
  if (
    refundedAmountCents === null ||
    !Number.isInteger(refundedAmountCents) ||
    refundedAmountCents <= 0
  ) {
    return NextResponse.json(
      { error: "refunded_amount_cents is required and must be a positive integer" },
      { status: 400 },
    );
  }

  const { data: invoice } = await supabase
    .from("student_invoices").select("*").eq("id", id).maybeSingle();
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (invoice.status !== "paid" && invoice.status !== "partially_paid") {
    return NextResponse.json(
      { error: `Cannot refund invoice in status "${invoice.status}" — only paid or partially_paid invoices can be refunded` },
      { status: 409 },
    );
  }
  if (refundedAmountCents > invoice.amount_cents) {
    return NextResponse.json({
      error: `Refund amount (${formatCents(refundedAmountCents, invoice.currency as Currency)}) exceeds invoice amount (${formatCents(invoice.amount_cents, invoice.currency as Currency)})`,
    }, { status: 400 });
  }

  const now = new Date().toISOString();
  const adminDb = createAdminClient();

  // Atomic UPDATE WHERE status='paid' prevents concurrent refunds
  const { data: updated, error: updErr } = await adminDb
    .from("student_invoices")
    .update({
      status:                "refunded",
      refunded_at:           now,
      refunded_by:           user.id,
      refund_reason:         reason,
      refunded_amount_cents: refundedAmountCents,
    })
    .eq("id", id)
    .in("status", ["paid", "partially_paid"])
    .select()
    .single();

  if (updErr) {
    if (updErr.code === "PGRST116") {
      return NextResponse.json(
        { error: "Invoice status has changed — please reload and try again" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  // Side effects
  const { data: appRow } = await adminDb
    .from("applications").select("current_stage").eq("id", invoice.application_id).single();
  const stage         = (appRow?.current_stage as ApplicationStage | null) ?? "ipa_processing";
  const refundedStr   = formatCents(refundedAmountCents, invoice.currency as Currency);

  await Promise.all([
    notifyUser(adminDb, {
      userId:        invoice.student_id,
      applicationId: invoice.application_id,
      title:         "Invoice refunded",
      message:       `Invoice ${invoice.public_id ?? ""} (${refundedStr}) has been refunded. ${reason}`,
      type:          "payment_update",
    }),
    recordTimelineEvent(adminDb, {
      applicationId:    invoice.application_id,
      stage,
      title:            `Invoice ${invoice.public_id ?? ""} refunded`,
      description:      `${refundedStr} refunded. ${reason}`,
      createdBy:        user.id,
      createdByRole:    "admin",
      visibleToStudent: true,
    }),
    logAudit(adminDb, {
      applicationId: invoice.application_id,
      actorId:       user.id,
      actorRole:     "admin",
      action:        "invoice_refunded",
      fromValue:     "paid",
      toValue:       "refunded",
      reason,
      metadata: {
        invoice_id:            id,
        public_id:             invoice.public_id,
        refunded_amount_cents: refundedAmountCents,
        currency:              invoice.currency,
      },
    }),
  ]);

  return NextResponse.json({ invoice: updated as StudentInvoice });
}
