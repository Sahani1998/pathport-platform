import { NextResponse }      from "next/server";
import { createClient }      from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const ip = getClientIp(request);
  const rl = checkRateLimit(`offer-dl:${ip}`, LIMITS.offerLetterDownload.limit, LIMITS.offerLetterDownload.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch letter — RLS enforces access per role (students: status='issued' only)
  const { data: letter, error } = await supabase
    .from("offer_letters")
    .select("file_path, file_name")
    .eq("id", id)
    .single();

  if (error || !letter) return NextResponse.json({ error: "Offer letter not found" }, { status: 404 });
  if (!letter.file_path) return NextResponse.json({ error: "No file attached to this offer letter" }, { status: 422 });

  // Use service role for signed URL — the offer-letters bucket has no student
  // storage policy by design; access was already authorised by the table RLS
  // check above. This mirrors the pattern used in /api/ipa/[id]/download.
  const adminDb = createAdminClient();
  const { data: signed, error: signErr } = await adminDb.storage
    .from("offer-letters")
    .createSignedUrl(letter.file_path, 3600, {
      download: letter.file_name ?? "offer-letter.pdf",
    });

  if (signErr || !signed?.signedUrl) {
    console.error("[OfferLetterDownload] sign error:", signErr?.message, "path:", letter.file_path);
    return NextResponse.json({ error: "Could not generate download link" }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
