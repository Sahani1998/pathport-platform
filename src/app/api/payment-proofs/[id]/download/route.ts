// GET /api/payment-proofs/[id]/download
//
// Signed URL for a payment proof. Authorization model:
//   - Student: must be the original uploader.
//   - Institution: must be tied to the proof's college (verification view in PR-D).
//   - Admin: always.
//
// Storage policies allow student + admin reads only — institution reads use the
// admin client because the institution-side queue (PR-D) will need access.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ip = getClientIp(request);
  const rl = checkRateLimit(`proof-dl:${ip}`, LIMITS.invoiceRead.limit, LIMITS.invoiceRead.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role, college_id").eq("id", user.id).single();

  // Read the proof + its parent attempt for the college check.
  // RLS on payment_proofs already filters by role; admin bypasses.
  const adminDb = createAdminClient();
  const { data: proof } = await adminDb
    .from("payment_proofs")
    .select("id, file_path, file_name, file_mime, uploaded_by, payment_attempt_id")
    .eq("id", id)
    .maybeSingle();
  if (!proof) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let authorized = false;
  if (profile?.role === "admin") {
    authorized = true;
  } else if (proof.uploaded_by === user.id) {
    authorized = true;
  } else if (profile?.role === "institution") {
    const { data: attempt } = await adminDb
      .from("payment_attempts").select("college_id").eq("id", proof.payment_attempt_id).single();
    if (attempt && attempt.college_id === profile.college_id) authorized = true;
  }
  if (!authorized) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Admin client for signed URL — handles both student (path-owner) and
  // institution (no storage RLS path match) cases uniformly.
  const { data: signed, error: signErr } = await adminDb.storage
    .from("payment-proofs")
    .createSignedUrl(proof.file_path, 3600, { download: proof.file_name });
  if (signErr || !signed?.signedUrl) {
    return NextResponse.json({ error: "Could not generate download link" }, { status: 500 });
  }
  return NextResponse.redirect(signed.signedUrl);
}
