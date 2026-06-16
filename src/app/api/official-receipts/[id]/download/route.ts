// GET /api/official-receipts/[id]/download
//
// Streams or redirects to a signed URL for an official receipt file.
// Authorization:
//   - Student: must be the invoice owner (student_id === user.id)
//   - Institution: must own the receipt's college
//   - Admin: always allowed
//
// Uploaded receipts: 1-hour signed URL from official-receipts bucket (admin client).
// Generated receipts: redirect to /receipts/{id}/print?auto=1 (browser-PDF).

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { checkRateLimitAsync, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import type { OfficialReceipt } from "@/types/payment";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ip = getClientIp(request);
  const rl = await checkRateLimitAsync(`invoice-read:${ip}`, LIMITS.invoiceRead.limit, LIMITS.invoiceRead.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role, college_id").eq("id", user.id).single();

  const adminDb = createAdminClient();

  // Load receipt + parent invoice via admin client (RLS on official_receipts
  // allows institution reads, but admin client avoids per-request RLS join overhead)
  const { data: receipt } = await adminDb
    .from("official_receipts").select("*").eq("id", id).maybeSingle();
  if (!receipt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: invoice } = await adminDb
    .from("student_invoices").select("student_id, college_id").eq("id", (receipt as OfficialReceipt).invoice_id).maybeSingle();
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Authorization
  const role = profile?.role;
  if (role === "student"      && invoice.student_id  !== user.id)             return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (role === "institution"  && invoice.college_id  !== profile?.college_id)  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (role !== "student" && role !== "institution" && role !== "admin")         return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const r = receipt as OfficialReceipt;

  if (r.source === "generated") {
    // Browser renders the print page as PDF
    return NextResponse.redirect(new URL(`/receipts/${id}/print?auto=1`, request.url));
  }

  // Uploaded: signed URL via admin client (bypasses storage RLS path constraints)
  const { data: signed, error: signErr } = await adminDb.storage
    .from("official-receipts")
    .createSignedUrl(r.file_path, 3600);
  if (signErr || !signed?.signedUrl) {
    return NextResponse.json({ error: signErr?.message ?? "Failed to generate download link" }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
