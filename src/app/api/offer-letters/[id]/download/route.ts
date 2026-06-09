import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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

  // Fetch letter — RLS enforces read access per role
  const { data: letter, error } = await supabase
    .from("offer_letters")
    .select("file_path, file_name")
    .eq("id", id)
    .single();

  if (error || !letter) return NextResponse.json({ error: "Offer letter not found" }, { status: 404 });

  // Generate 60-minute signed URL — file never served directly from storage
  const { data: signed, error: signErr } = await supabase.storage
    .from("offer-letters")
    .createSignedUrl(letter.file_path, 3600, {
      download: letter.file_name,
    });

  if (signErr || !signed?.signedUrl) {
    return NextResponse.json({ error: "Could not generate download link" }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
