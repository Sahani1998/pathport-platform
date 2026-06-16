// GET + PATCH /api/invoices/[id]
//
// PATCH only allowed while invoice is 'draft' — DB trigger
// guard_invoice_mutation enforces this server-side too.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
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
