// POST /api/invoices/[id]/void
//
// Voids any non-terminal invoice. Always allowed from draft. From pending
// or under_verification it's a manual cancellation — institution must
// provide a reason. Voided invoices cannot be uncancelled (re-issue is via
// a new invoice with supersedes_invoice_id — Phase 2 UI).

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { notifyUser, recordTimelineEvent, logAudit } from "@/lib/application-timeline";
import { withIdempotency } from "@/lib/payments/idempotency";
import type { StudentInvoice } from "@/types/payment";
import type { ApplicationStage } from "@/types/timeline";

const VOIDABLE = new Set(["draft", "pending", "under_verification", "payment_action_required"]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ip = getClientIp(request);
  const rl = checkRateLimit(`invoice-void:${ip}`, LIMITS.invoiceWrite.limit, LIMITS.invoiceWrite.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "institution" && profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Idempotency guard — replay within 24h returns cached response
  const adminDb = createAdminClient();
  const idempotencyGuard = await withIdempotency(request, "invoice-void", id, user.id, adminDb);
  if (idempotencyGuard.cached) return idempotencyGuard.cachedResponse!;

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 500) : "";

  const { data: invoice } = await supabase
    .from("student_invoices").select("*").eq("id", id).maybeSingle();
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!VOIDABLE.has(invoice.status)) {
    return NextResponse.json({ error: `Cannot void invoice in status ${invoice.status}` }, { status: 409 });
  }
  if (invoice.status !== "draft" && !reason) {
    return NextResponse.json({ error: "Reason required when voiding an issued invoice" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { data: updated, error: updErr } = await supabase
    .from("student_invoices")
    .update({
      status:      "void",
      voided_at:   now,
      voided_by:   user.id,
      void_reason: reason || null,
    })
    .eq("id", id)
    .select()
    .single();
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  // Notify the student only if the invoice had been issued (draft voids are silent).
  if (invoice.status !== "draft") {
    const { data: appRow } = await adminDb
      .from("applications").select("current_stage").eq("id", invoice.application_id).single();
    const stage = (appRow?.current_stage as ApplicationStage | null) ?? "fee_payment_pending";

    await Promise.all([
      notifyUser(adminDb, {
        userId:        invoice.student_id,
        applicationId: invoice.application_id,
        title:         "Invoice voided",
        message:       reason
          ? `Invoice ${invoice.public_id ?? ""} was voided. Reason: ${reason}`
          : `Invoice ${invoice.public_id ?? ""} was voided.`,
        type:          "payment_update",
      }),
      recordTimelineEvent(adminDb, {
        applicationId:   invoice.application_id,
        stage,
        title:           `Invoice ${invoice.public_id ?? ""} voided`,
        description:     reason ?? null,
        createdBy:       user.id,
        createdByRole:   profile.role,
        visibleToStudent: true,
      }),
      logAudit(adminDb, {
        applicationId: invoice.application_id,
        actorId:       user.id,
        actorRole:     profile.role,
        action:        "invoice_voided",
        fromValue:     invoice.status,
        toValue:       "void",
        reason:        reason || null,
        metadata: { invoice_id: invoice.id, public_id: invoice.public_id },
      }),
    ]);
  }

  const responseBody = { invoice: updated as StudentInvoice };
  await idempotencyGuard.store(responseBody, 200);
  return NextResponse.json(responseBody);
}
