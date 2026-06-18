// POST /api/invoices/[id]/payment-attempts
//
// Student creates a payment attempt against an issued invoice. Picks a method
// (bank_transfer or wise). DB function next_payment_reference() generates a
// unique reference like "DIM-INV-2026-0001-01-K" under an advisory lock to
// prevent concurrent collisions.
//
// Invoice status is NOT advanced here — it stays 'pending' until proof upload
// promotes it to 'under_verification' (handled in the proof upload route).

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import type { PaymentAttempt, PaymentMethod } from "@/types/payment";

const VALID_METHODS: readonly PaymentMethod[] = ["bank_transfer", "wise"];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: invoiceId } = await params;
  const ip = getClientIp(request);
  const rl = checkRateLimit(`pa-create:${ip}`, LIMITS.paymentVerify.limit, LIMITS.paymentVerify.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const method = body.payment_method;
  if (typeof method !== "string" || !VALID_METHODS.includes(method as PaymentMethod)) {
    return NextResponse.json({ error: "payment_method must be 'bank_transfer' or 'wise'" }, { status: 400 });
  }

  const { data: invoice } = await supabase
    .from("student_invoices")
    .select("id, status, student_id, application_id, college_id, amount_cents, currency, payment_methods_allowed")
    .eq("id", invoiceId)
    .maybeSingle();
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  // Students may only create attempts for their own invoices.
  if (invoice.student_id !== user.id) {
    // Allow institution / admin to record a manual attempt on behalf — useful
    // when student pays out-of-band and they capture the proof later.
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "institution" && profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  if (
    invoice.status !== "pending" &&
    invoice.status !== "payment_action_required" &&
    invoice.status !== "partially_paid"
  ) {
    return NextResponse.json(
      { error: `Cannot start payment for invoice in status ${invoice.status}` },
      { status: 409 },
    );
  }
  if (!Array.isArray(invoice.payment_methods_allowed) || !invoice.payment_methods_allowed.includes(method)) {
    return NextResponse.json({ error: "This payment method is not enabled for this invoice" }, { status: 400 });
  }

  // Allocate a unique payment reference under advisory lock.
  const { data: reference, error: refErr } = await supabase
    .rpc("next_payment_reference", { p_invoice_id: invoiceId });
  if (refErr || !reference) {
    return NextResponse.json({ error: refErr?.message ?? "Failed to allocate payment reference" }, { status: 500 });
  }

  const { data: attempt, error: insErr } = await supabase
    .from("payment_attempts")
    .insert({
      invoice_id:           invoiceId,
      application_id:       invoice.application_id,
      student_id:           invoice.student_id,
      college_id:           invoice.college_id,
      payment_method:       method,
      provider:             "manual",
      status:               "initiated",
      payment_reference:    reference,
      invoice_amount_cents: invoice.amount_cents,
      invoice_currency:     invoice.currency,
    })
    .select()
    .single();
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  return NextResponse.json({ attempt: attempt as PaymentAttempt }, { status: 201 });
}
