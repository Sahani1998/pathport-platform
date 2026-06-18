// GET + PATCH + DELETE /api/invoices/[id]
//
// PATCH only allowed while invoice is 'draft' — DB trigger
// guard_invoice_mutation enforces this server-side too.
//
// DELETE only allowed while invoice is 'draft' (institution/admin). Cleans up
// line items and any uploaded PDF file in storage. Issued invoices must go
// through /void (or /refund for paid invoices) so the audit chain survives.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { logAudit } from "@/lib/application-timeline";
import {
  validateInvoiceLines, validatePaymentMethods, readInvoiceWithRelations,
} from "@/lib/payments/invoice-helpers";
import type { StudentInvoice } from "@/types/payment";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ip = getClientIp(request);
  const rl = checkRateLimit(`invoice-get:${ip}`, LIMITS.invoiceRead.limit, LIMITS.invoiceRead.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await readInvoiceWithRelations(supabase, id);
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(result);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ip = getClientIp(request);
  const rl = checkRateLimit(`invoice-write:${ip}`, LIMITS.invoiceWrite.limit, LIMITS.invoiceWrite.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "institution" && profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: existing } = await supabase
    .from("student_invoices")
    .select("id, status, currency, source")
    .eq("id", id)
    .maybeSingle();
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.status !== "draft") {
    return NextResponse.json({ error: "Invoice can only be edited while in draft" }, { status: 409 });
  }

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const updates: Record<string, unknown> = {};

  if (typeof body.description === "string" || body.description === null) {
    updates.description = body.description ? String(body.description).trim().slice(0, 1000) : null;
  }
  if (typeof body.due_date === "string" || body.due_date === null) {
    if (body.due_date === null || body.due_date === "") {
      updates.due_date = null;
    } else if (typeof body.due_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.due_date)) {
      updates.due_date = body.due_date;
    } else {
      return NextResponse.json({ error: "due_date must be YYYY-MM-DD" }, { status: 400 });
    }
  }
  if (body.payment_methods_allowed !== undefined) {
    const m = validatePaymentMethods(body.payment_methods_allowed);
    if (!m || m.length === 0) return NextResponse.json({ error: "Invalid payment_methods_allowed" }, { status: 400 });
    updates.payment_methods_allowed = m;
  }
  if (typeof body.external_invoice_number === "string" || body.external_invoice_number === null) {
    updates.external_invoice_number = body.external_invoice_number
      ? String(body.external_invoice_number).trim().slice(0, 80)
      : null;
  }

  // Apply scalar updates first (if any).
  if (Object.keys(updates).length > 0) {
    const { error: updErr } = await supabase
      .from("student_invoices").update(updates).eq("id", id);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  // Line items — full-replace if provided.
  if (existing.source === "generated" && body.line_items !== undefined) {
    const lv = validateInvoiceLines(body.line_items, existing.currency);
    if (!lv.ok) return NextResponse.json({ error: lv.error }, { status: 400 });

    const { error: delErr } = await supabase
      .from("invoice_line_items").delete().eq("invoice_id", id);
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

    const rows = lv.lines.map((l, idx) => ({
      invoice_id:   id,
      line_type:    l.line_type,
      description:  l.description,
      amount_cents: l.amount_cents,
      currency:     l.currency,
      sort_order:   idx,
    }));
    const { error: insErr } = await supabase.from("invoice_line_items").insert(rows);
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  const { data: fresh } = await supabase.from("student_invoices").select("*").eq("id", id).single();
  return NextResponse.json({ invoice: fresh as StudentInvoice });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ip = getClientIp(request);
  const rl = checkRateLimit(`invoice-delete:${ip}`, LIMITS.invoiceWrite.limit, LIMITS.invoiceWrite.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role, college_id").eq("id", user.id).single();
  if (profile?.role !== "institution" && profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: invoice } = await supabase
    .from("student_invoices")
    .select("id, status, college_id, application_id, file_path, source, public_id")
    .eq("id", id)
    .maybeSingle();
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Institution ownership check (admin bypasses).
  if (profile.role === "institution" && invoice.college_id !== profile.college_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Only drafts can be hard-deleted. Issued / paid / partial invoices must use
  // /void or /refund so the audit chain and student-facing history survive.
  if (invoice.status !== "draft") {
    return NextResponse.json(
      { error: `Cannot delete invoice in status ${invoice.status}. Use void/refund instead.` },
      { status: 409 },
    );
  }

  // Delete line items first (no ON DELETE CASCADE assumed).
  const { error: liErr } = await supabase
    .from("invoice_line_items").delete().eq("invoice_id", id);
  if (liErr) return NextResponse.json({ error: liErr.message }, { status: 500 });

  const { error: delErr } = await supabase
    .from("student_invoices").delete().eq("id", id);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  // Storage cleanup for uploaded-source drafts.
  if (invoice.source === "uploaded" && invoice.file_path) {
    const adminDb = createAdminClient();
    await adminDb.storage.from("invoices").remove([invoice.file_path]).catch(err =>
      console.error("[Invoice] storage cleanup failed (non-fatal):", err),
    );
  }

  // Audit — non-fatal. Draft drops do not write to the user-visible timeline.
  const adminDb = createAdminClient();
  await logAudit(adminDb, {
    applicationId: invoice.application_id,
    actorId:       user.id,
    actorRole:     profile.role,
    action:        "invoice_draft_deleted",
    fromValue:     "draft",
    toValue:       null,
    metadata: {
      invoice_id:  invoice.id,
      public_id:   invoice.public_id,
      source:      invoice.source,
    },
  }).catch(err => console.error("[Invoice] audit failed (non-fatal):", err));

  return NextResponse.json({ ok: true });
}
