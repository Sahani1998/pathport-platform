// POST /api/invoices/[id]/issue
//
// Transitions draft → pending:
//   - Calls next_invoice_number(college_id) for public_id (per-college, per-year)
//   - Sets issued_at = now()
//   - Notifies the student + writes a timeline event tagged to the current stage
//
// Stage advancement (e.g. → fee_payment_pending) is intentionally NOT done here
// — that's PR-D's verification queue flow. Issuing an invoice is a financial
// event, not a workflow stage change.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { notifyUser, recordTimelineEvent, logAudit } from "@/lib/application-timeline";
import { sendTemplatedEmail } from "@/lib/email/send";
import { formatCents } from "@/lib/payments/invoice-helpers";
import type { Currency, StudentInvoice } from "@/types/payment";
import type { ApplicationStage } from "@/types/timeline";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ip = getClientIp(request);
  const rl = checkRateLimit(`invoice-issue:${ip}`, LIMITS.invoiceWrite.limit, LIMITS.invoiceWrite.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "institution" && profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: invoice } = await supabase
    .from("student_invoices").select("*").eq("id", id).maybeSingle();
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (invoice.status !== "draft") {
    return NextResponse.json({ error: `Invoice already in status ${invoice.status}` }, { status: 409 });
  }

  // Source-specific guards.
  if (invoice.source === "generated" && (invoice.amount_cents ?? 0) <= 0) {
    return NextResponse.json({ error: "Cannot issue a zero-amount invoice — add line items first" }, { status: 400 });
  }
  if (invoice.source === "uploaded" && !invoice.file_path) {
    return NextResponse.json({ error: "Uploaded invoice missing file" }, { status: 400 });
  }
  if (!Array.isArray(invoice.payment_methods_allowed) || invoice.payment_methods_allowed.length === 0) {
    return NextResponse.json({ error: "At least one payment method must be allowed" }, { status: 400 });
  }

  // Get next public_id via DB function (per-college, per-year sequence).
  const { data: publicId, error: rpcErr } = await supabase
    .rpc("next_invoice_number", { p_college_id: invoice.college_id });
  if (rpcErr || !publicId) {
    return NextResponse.json({ error: rpcErr?.message ?? "Failed to allocate invoice number" }, { status: 500 });
  }

  const now = new Date().toISOString();
  const { data: updated, error: updErr } = await supabase
    .from("student_invoices")
    .update({
      status:    "pending",
      public_id: publicId,
      issued_at: now,
    })
    .eq("id", id)
    .select()
    .single();
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  // ─── Side effects (non-fatal) ─────────────────────────────────────────────
  // Use admin client for inserts that students can't write to (notifications,
  // timeline) — matches existing offer letter / IPA pattern.
  const adminDb = createAdminClient();

  // Look up the current stage so the timeline event is tagged correctly.
  const { data: appRow } = await adminDb
    .from("applications").select("current_stage").eq("id", invoice.application_id).single();
  const stage = (appRow?.current_stage as ApplicationStage | null) ?? "fee_payment_pending";

  const amount = formatCents(updated.amount_cents, updated.currency as Currency);
  const dueLine = updated.due_date
    ? ` Due ${new Date(updated.due_date).toLocaleDateString("en-SG", { dateStyle: "medium" })}.`
    : "";

  await Promise.all([
    notifyUser(adminDb, {
      userId:        invoice.student_id,
      applicationId: invoice.application_id,
      title:         "New invoice issued",
      message:       `Invoice ${publicId} for ${amount} is now available.${dueLine}`,
      type:          "payment_update",
    }),
    recordTimelineEvent(adminDb, {
      applicationId:   invoice.application_id,
      stage,
      title:           `Invoice ${publicId} issued`,
      description:     `An invoice for ${amount} has been issued.${dueLine}`,
      createdBy:       user.id,
      createdByRole:   profile.role,
      visibleToStudent: true,
    }),
    logAudit(adminDb, {
      applicationId: invoice.application_id,
      actorId:       user.id,
      actorRole:     profile.role,
      action:        "invoice_issued",
      fromValue:     "draft",
      toValue:       "pending",
      metadata: {
        invoice_id:  invoice.id,
        public_id:   publicId,
        amount_cents: updated.amount_cents,
        currency:    updated.currency,
        source:      invoice.source,
      },
    }),
  ]);

  // Email — non-fatal
  const [{ data: studentProfile }, { data: courseRow }, { data: collegeRow }] = await Promise.all([
    adminDb.from("profiles").select("email, full_name").eq("id", invoice.student_id).single(),
    adminDb.from("courses").select("title").eq("id", invoice.course_id).single(),
    adminDb.from("colleges").select("name").eq("id", invoice.college_id).single(),
  ]);
  if (studentProfile?.email) {
    sendTemplatedEmail({
      to:       studentProfile.email,
      template: "invoice_issued",
      context: {
        name:        studentProfile.full_name ?? "Student",
        invoiceNumber: publicId,
        amount,
        courseName:  (courseRow as { title: string } | null)?.title ?? "your course",
        collegeName: (collegeRow as { name: string } | null)?.name  ?? "",
        dueDate:     updated.due_date ?? "",
      },
      applicationId: invoice.application_id,
      userId:        invoice.student_id,
    }).catch(err => console.error("[Invoice] email failed (non-fatal):", err));
  }

  return NextResponse.json({ invoice: updated as StudentInvoice });
}
