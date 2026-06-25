// POST /api/payment-attempts/[id]/official-receipt
//
// Issues an official receipt for a verified payment attempt.
// Supports two paths (matching invoice dual-path pattern):
//   - multipart/form-data with file → uploaded receipt (PDF)
//   - application/json             → generated receipt (redirect to print page)
//
// Generates public_id via next_receipt_number(college_id) RPC.
// Storage bucket: official-receipts at path {attempt_id}/{timestamp}.pdf
//
// Body (JSON):    { notes?: string }
// Body (multipart): file (PDF, max 10MB), notes? (text)

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { checkRateLimitAsync, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { notifyUser, recordTimelineEvent, logAudit } from "@/lib/application-timeline";
import { sendTemplatedEmail } from "@/lib/email/send";
import { formatCents } from "@/lib/payments/invoice-helpers";
import { loadAttemptWithContext } from "@/lib/payments/verification-helpers";
import { withIdempotency } from "@/lib/payments/idempotency";
import { scanFile } from "@/lib/virus-scan";
import type { OfficialReceipt, Currency } from "@/types/payment";
import type { ApplicationStage } from "@/types/timeline";

const MAX_RECEIPT_BYTES = 10 * 1024 * 1024; // 10 MB

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

  // Idempotency guard — replay within 24h returns cached response
  const adminDb = createAdminClient();
  const idempotencyGuard = await withIdempotency(request, "official-receipt", id, user.id, adminDb);
  if (idempotencyGuard.cached) return idempotencyGuard.cachedResponse!;

  const callerCollegeId = profile.role === "institution" ? (profile.college_id ?? "") : null;
  const ctx = await loadAttemptWithContext(supabase, id, callerCollegeId);
  if (!ctx) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (ctx.attempt.status !== "verified") {
    return NextResponse.json(
      { error: "Official receipts can only be issued for verified payment attempts" },
      { status: 409 },
    );
  }

  // Block receipt on partially-paid invoices — the official receipt is the final
  // acknowledgement of full payment. Institution must verify the remaining balance first.
  if (ctx.invoice.status === "partially_paid") {
    return NextResponse.json({
      error: "Official receipts cannot be issued while the invoice has an outstanding balance. Verify the remaining payment first.",
    }, { status: 409 });
  }

  // Check for existing receipt
  const { data: existing } = await supabase
    .from("official_receipts").select("id").eq("payment_attempt_id", id).maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "A receipt has already been issued for this attempt" }, { status: 409 });
  }

  // Get next receipt public_id
  const { data: publicId, error: rpcErr } = await supabase
    .rpc("next_receipt_number", { p_college_id: ctx.collegeId });
  if (rpcErr || !publicId) {
    return NextResponse.json({ error: rpcErr?.message ?? "Failed to allocate receipt number" }, { status: 500 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  const isUpload    = contentType.includes("multipart/form-data");

  let filePath: string;
  let source:   "generated" | "uploaded";
  let notes:    string | null = null;

  if (isUpload) {
    // ── Uploaded PDF path ────────────────────────────────────────────────────
    const formData = await request.formData().catch(() => null);
    if (!formData) return NextResponse.json({ error: "Invalid form data" }, { status: 400 });

    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "file is required" }, { status: 400 });
    if (file.type !== "application/pdf") return NextResponse.json({ error: "Receipt must be a PDF" }, { status: 400 });
    if (file.size > MAX_RECEIPT_BYTES) return NextResponse.json({ error: "Receipt exceeds 10 MB limit" }, { status: 400 });
    if (file.size === 0) return NextResponse.json({ error: "File is empty" }, { status: 400 });

    const notesField = formData.get("notes");
    if (typeof notesField === "string" && notesField.trim()) notes = notesField.trim();

    // Virus / magic-byte scan before storage write
    const buffer = await file.arrayBuffer();
    const scan   = await scanFile(buffer, file.name, file.type);
    if (scan.status === "threat") {
      console.warn(`[Receipt] scan blocked file: ${file.name} threat=${scan.threat} user=${user.id}`);
      return NextResponse.json(
        { error: "File was rejected by the security scanner. Please ensure the PDF is not corrupted and try again." },
        { status: 422 },
      );
    }

    const timestamp = Date.now();
    filePath = `${id}/${timestamp}.pdf`;
    const { error: storageErr } = await adminDb.storage
      .from("official-receipts")
      .upload(filePath, buffer, {
        contentType:    "application/pdf",
        upsert:         false,
        cacheControl:   "3600",
      });
    if (storageErr) return NextResponse.json({ error: storageErr.message }, { status: 500 });
    source = "uploaded";

  } else {
    // ── Generated path (print-page PDF) ─────────────────────────────────────
    const body = await request.json().catch(() => ({})) as Record<string, unknown>;
    if (typeof body.notes === "string" && body.notes.trim()) notes = body.notes.trim();
    // Generated receipts use the print route path as a placeholder; actual PDF
    // is the print page rendered at /receipts/{receipt_id}/print
    filePath = `${id}/generated-${publicId}.pdf`;
    source   = "generated";
  }

  // Insert receipt row
  const now = new Date().toISOString();
  const { data: receipt, error: rcpErr } = await supabase
    .from("official_receipts")
    .insert({
      public_id:          publicId,
      invoice_id:         ctx.invoice.id,
      payment_attempt_id: id,
      source,
      file_path:          filePath,
      amount_cents:       ctx.invoice.amount_cents,
      currency:           ctx.invoice.currency,
      issued_by:          user.id,
      issued_at:          now,
      notes,
    })
    .select()
    .single();
  if (rcpErr) {
    if (isUpload) {
      await adminDb.storage.from("official-receipts").remove([filePath]);
    }
    // 23505 = unique_violation: concurrent receipt insert hit the DB-level
    // unique index on official_receipts(payment_attempt_id)
    if (rcpErr.code === "23505") {
      return NextResponse.json({ error: "A receipt has already been issued for this attempt" }, { status: 409 });
    }
    return NextResponse.json({ error: rcpErr.message }, { status: 500 });
  }

  // ─── Side effects (non-fatal, admin client) ────────────────────────────────

  const { data: appRow } = await adminDb
    .from("applications").select("current_stage").eq("id", ctx.applicationId).single();
  const stage = (appRow?.current_stage as ApplicationStage | null) ?? "ipa_processing";
  const amountStr = formatCents(ctx.invoice.amount_cents, ctx.invoice.currency as Currency);

  await Promise.all([
    notifyUser(adminDb, {
      userId:        ctx.studentId,
      applicationId: ctx.applicationId,
      title:         "Official receipt issued",
      message:       `Receipt ${publicId} for ${amountStr} is now available for download.`,
      type:          "payment_update",
    }),
    recordTimelineEvent(adminDb, {
      applicationId:    ctx.applicationId,
      stage,
      title:            `Official receipt ${publicId} issued`,
      description:      `Receipt for ${amountStr}${notes ? `. ${notes}` : ""}.`,
      createdBy:        user.id,
      createdByRole:    profile.role,
      visibleToStudent: true,
    }),
    logAudit(adminDb, {
      applicationId: ctx.applicationId,
      actorId:       user.id,
      actorRole:     profile.role,
      action:        "official_receipt_issued",
      toValue:       publicId,
      metadata: {
        receipt_id:   receipt.id,
        invoice_id:   ctx.invoice.id,
        attempt_id:   id,
        source,
        amount_cents: ctx.invoice.amount_cents,
        currency:     ctx.invoice.currency,
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
      template: "official_receipt_issued",
      context: {
        name:          studentProfile.full_name ?? "Student",
        courseName:    (courseRow as { title: string } | null)?.title ?? "your course",
        collegeName:   (collegeRow as { name: string } | null)?.name ?? "",
        receiptNumber: publicId,
        amount:        amountStr,
      },
      applicationId: ctx.applicationId,
      userId:        ctx.studentId,
    }).catch(err => console.error("[Receipt] email failed (non-fatal):", err));
  }

  const responseBody = { receipt: receipt as OfficialReceipt };
  await idempotencyGuard.store(responseBody, 200);
  return NextResponse.json(responseBody);
}
