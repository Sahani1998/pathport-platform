// POST /api/payment-attempts/[id]/proofs
//
// Student uploads a transfer proof for an existing payment attempt.
//   - File path is forced to `${student_id}/${attempt_id}/${timestamp}.${ext}`
//     so the storage RLS policy (path[0] = auth.uid()) passes.
//   - Attempt status: initiated → proof_submitted
//   - Invoice status: pending → under_verification (enters verification queue)
//   - SHA-256 hash stored for downstream duplicate detection.

import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { notifyUser, recordTimelineEvent, logAudit } from "@/lib/application-timeline";
import { ALLOWED_PROOF_MIME, MAX_FILE_BYTES, type AllowedProofMime, type PaymentProof } from "@/types/payment";
import type { ApplicationStage } from "@/types/timeline";

const ALLOWED_MIME_SET = new Set<string>(ALLOWED_PROOF_MIME);

function extFor(mime: AllowedProofMime): string {
  switch (mime) {
    case "application/pdf": return "pdf";
    case "image/png":       return "png";
    case "image/jpeg":      return "jpg";
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: attemptId } = await params;
  const ip = getClientIp(request);
  const rl = checkRateLimit(`proof-upload:${ip}`, LIMITS.proofUpload.limit, LIMITS.proofUpload.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Load attempt + verify ownership (student) or role (institution/admin).
  const { data: attempt } = await supabase
    .from("payment_attempts")
    .select("id, status, invoice_id, student_id, application_id, college_id, payment_reference")
    .eq("id", attemptId)
    .maybeSingle();
  if (!attempt) return NextResponse.json({ error: "Payment attempt not found" }, { status: 404 });
  if (attempt.student_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (attempt.status === "verified" || attempt.status === "expired") {
    return NextResponse.json({ error: `Cannot upload proof for ${attempt.status} attempt` }, { status: 409 });
  }

  let form: FormData;
  try { form = await request.formData(); }
  catch { return NextResponse.json({ error: "Invalid form data" }, { status: 400 }); }

  const file = form.get("file") as File | null;
  if (!file)                                  return NextResponse.json({ error: "File is required" }, { status: 400 });
  if (!ALLOWED_MIME_SET.has(file.type))       return NextResponse.json({ error: "Only PDF, PNG, or JPEG accepted" }, { status: 400 });
  if (file.size > MAX_FILE_BYTES || file.size < 1) {
    return NextResponse.json({ error: "File must be 1 byte – 10 MB" }, { status: 400 });
  }

  const receiptReference = String(form.get("receipt_reference") ?? "").trim().slice(0, 120) || null;
  const paymentDate      = String(form.get("payment_date")      ?? "").trim();
  const paymentDateNorm  = /^\d{4}-\d{2}-\d{2}$/.test(paymentDate) ? paymentDate : null;

  // Hash file for duplicate detection.
  const buffer    = Buffer.from(await file.arrayBuffer());
  const fileHash  = createHash("sha256").update(buffer).digest("hex");

  // Build storage path — first folder MUST be auth.uid() for RLS policy.
  const mime      = file.type as AllowedProofMime;
  const timestamp = Date.now();
  const storagePath = `${user.id}/${attemptId}/${timestamp}.${extFor(mime)}`;

  const { error: storeErr } = await supabase.storage
    .from("payment-proofs")
    .upload(storagePath, buffer, { contentType: mime, upsert: false });
  if (storeErr) return NextResponse.json({ error: `Storage upload failed: ${storeErr.message}` }, { status: 500 });

  // Insert proof row.
  const { data: proof, error: insErr } = await supabase
    .from("payment_proofs")
    .insert({
      payment_attempt_id: attemptId,
      invoice_id:         attempt.invoice_id,
      uploaded_by:        user.id,
      file_path:          storagePath,
      file_name:          file.name.slice(0, 200),
      file_mime:          mime,
      file_size_bytes:    file.size,
      file_hash:          fileHash,
      receipt_reference:  receiptReference,
      payment_date:       paymentDateNorm,
    })
    .select()
    .single();

  if (insErr) {
    await supabase.storage.from("payment-proofs").remove([storagePath]);
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  // Status transitions MUST run through the admin (service-role) client.
  // Student RLS on payment_attempts and student_invoices grants SELECT/INSERT
  // only — there is NO student UPDATE policy — so a user-scoped update silently
  // matches 0 rows and the proof would appear stuck on "Initiated" with the
  // invoice stuck on "Awaiting Payment", hiding the institution's verification
  // actions. The student_invoices guard trigger only blocks financial-field
  // changes, so a status-only update is permitted.
  const adminDb = createAdminClient();

  // Advance attempt → proof_submitted (only if currently initiated/info_requested/rejected).
  // 'rejected' attempts can accept a new proof — they go back to proof_submitted.
  if (attempt.status === "initiated" || attempt.status === "info_requested" || attempt.status === "rejected") {
    const { error: attStatusErr } = await adminDb
      .from("payment_attempts")
      .update({ status: "proof_submitted" })
      .eq("id", attemptId);
    if (attStatusErr) {
      // The proof row exists but the attempt is still "initiated" — surface this
      // rather than letting it fail silently, so the queue never goes stale.
      console.error("[Proof] attempt status update failed:", attStatusErr.message);
      return NextResponse.json(
        { error: "Proof uploaded, but the payment status could not be updated. Please contact support." },
        { status: 500 },
      );
    }
  }

  // Advance invoice → under_verification if currently pending or payment_action_required.
  const { data: inv } = await adminDb
    .from("student_invoices").select("status, public_id, currency, amount_cents").eq("id", attempt.invoice_id).single();
  if (inv && (inv.status === "pending" || inv.status === "payment_action_required" || inv.status === "partially_paid")) {
    const { error: invStatusErr } = await adminDb
      .from("student_invoices")
      .update({ status: "under_verification" })
      .eq("id", attempt.invoice_id);
    if (invStatusErr) console.error("[Proof] invoice status update failed:", invStatusErr.message);
  }

  const [{ data: appRow }, { data: studentProfile }] = await Promise.all([
    adminDb.from("applications").select("current_stage").eq("id", attempt.application_id).single(),
    adminDb.from("profiles").select("full_name").eq("id", user.id).single(),
  ]);
  const stage = (appRow?.current_stage as ApplicationStage | null) ?? "fee_payment_pending";

  // Notify each institution user attached to this college, plus admins.
  const { data: institutionUsers } = await adminDb
    .from("profiles")
    .select("id")
    .eq("college_id", attempt.college_id)
    .in("role", ["institution", "admin"]);

  const message = `Payment proof submitted by ${studentProfile?.full_name ?? "student"} (ref ${attempt.payment_reference}).`;
  await Promise.all([
    ...((institutionUsers ?? []) as { id: string }[]).map(u =>
      notifyUser(adminDb, {
        userId:        u.id,
        applicationId: attempt.application_id,
        title:         "Payment proof submitted",
        message,
        type:          "payment_update",
      }),
    ),
    recordTimelineEvent(adminDb, {
      applicationId:    attempt.application_id,
      stage,
      title:            "Payment proof submitted",
      description:      `Ref ${attempt.payment_reference}.`,
      createdBy:        user.id,
      createdByRole:    "student",
      visibleToStudent: true,
    }),
    logAudit(adminDb, {
      applicationId: attempt.application_id,
      actorId:       user.id,
      actorRole:     "student",
      action:        "payment_proof_uploaded",
      toValue:       attempt.payment_reference,
      metadata: {
        proof_id:    (proof as { id: string }).id,
        attempt_id:  attemptId,
        invoice_id:  attempt.invoice_id,
        file_name:   file.name,
        file_size:   file.size,
        file_hash:   fileHash,
      },
    }),
  ]);

  return NextResponse.json({ proof: proof as PaymentProof }, { status: 201 });
}
