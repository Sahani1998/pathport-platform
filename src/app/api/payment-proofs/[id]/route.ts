// DELETE /api/payment-proofs/[id]
//
// Student deletes a proof they uploaded by mistake, BEFORE the institution
// has acted on it. The attempt status must still be 'proof_submitted'
// (proof exists, no verify/reject/info-request yet) or 'initiated' (orphan
// edge case). Once an institution has verified, rejected, or requested info,
// the proof is part of the audit chain and cannot be removed — student must
// open a new attempt for a fresh upload.
//
// Storage file is removed alongside the row. If this was the last proof
// on the attempt, the attempt reverts to 'initiated' so the student can
// upload a corrected proof without creating a new attempt.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { logAudit } from "@/lib/application-timeline";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ip = getClientIp(request);
  const rl = checkRateLimit(`proof-delete:${ip}`, LIMITS.proofUpload.limit, LIMITS.proofUpload.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: proof } = await supabase
    .from("payment_proofs")
    .select("id, file_path, uploaded_by, payment_attempt_id, invoice_id")
    .eq("id", id)
    .maybeSingle();
  if (!proof) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only the original uploader can delete; institution must reject through
  // the dedicated route which keeps the audit trail.
  if (proof.uploaded_by !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const adminDb = createAdminClient();
  const { data: attempt } = await adminDb
    .from("payment_attempts")
    .select("id, status, application_id, verified_at, rejection_reason, info_request_message")
    .eq("id", proof.payment_attempt_id)
    .single();
  if (!attempt) return NextResponse.json({ error: "Attempt not found" }, { status: 404 });

  // Block delete once institution has taken any action.
  if (attempt.status === "verified" || attempt.status === "rejected" || attempt.status === "info_requested" || attempt.status === "expired") {
    return NextResponse.json(
      { error: `Cannot delete proof — attempt is ${attempt.status}. Open a new attempt to retry.` },
      { status: 409 },
    );
  }
  if (attempt.verified_at || attempt.rejection_reason || attempt.info_request_message) {
    return NextResponse.json(
      { error: "Cannot delete proof — institution has already acted on this attempt." },
      { status: 409 },
    );
  }

  // Delete the proof row (RLS allows student delete on own proofs via uploaded_by).
  const { error: rowErr } = await supabase
    .from("payment_proofs").delete().eq("id", id);
  if (rowErr) return NextResponse.json({ error: rowErr.message }, { status: 500 });

  // Remove the file from storage (admin client; user-scoped delete on own
  // path also works but admin keeps the cleanup uniform across paths).
  await adminDb.storage.from("payment-proofs").remove([proof.file_path]).catch(err =>
    console.error("[Proof] storage cleanup failed (non-fatal):", err),
  );

  // If no proofs remain on the attempt, revert status to 'initiated' so the
  // student can upload a replacement against the same attempt.
  const { count: remaining } = await adminDb
    .from("payment_proofs")
    .select("id", { count: "exact", head: true })
    .eq("payment_attempt_id", attempt.id);

  if ((remaining ?? 0) === 0 && attempt.status === "proof_submitted") {
    const { error: revErr } = await adminDb
      .from("payment_attempts")
      .update({ status: "initiated" })
      .eq("id", attempt.id);
    if (revErr) console.error("[Proof] attempt revert failed (non-fatal):", revErr.message);

    // Also revert the invoice from 'under_verification' back to 'pending' if
    // this attempt was the only thing in flight on it.
    const { count: otherSubmitted } = await adminDb
      .from("payment_attempts")
      .select("id", { count: "exact", head: true })
      .eq("invoice_id", proof.invoice_id)
      .in("status", ["proof_submitted", "verified"]);
    if ((otherSubmitted ?? 0) === 0) {
      await adminDb
        .from("student_invoices")
        .update({ status: "pending" })
        .eq("id", proof.invoice_id)
        .eq("status", "under_verification")
        .then(({ error }) => {
          if (error) console.error("[Proof] invoice revert failed (non-fatal):", error.message);
        });
    }
  }

  // Audit (non-fatal).
  await logAudit(adminDb, {
    applicationId: attempt.application_id,
    actorId:       user.id,
    actorRole:     "student",
    action:        "payment_proof_deleted",
    fromValue:     null,
    toValue:       proof.id,
    metadata: {
      attempt_id: attempt.id,
      invoice_id: proof.invoice_id,
      file_path:  proof.file_path,
    },
  }).catch(err => console.error("[Proof] audit failed (non-fatal):", err));

  return NextResponse.json({ ok: true });
}
