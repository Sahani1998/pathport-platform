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
  const rl = checkRateLimit(`ipa-dl:${ip}`, LIMITS.documentDownload.limit, LIMITS.documentDownload.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch with the user-scoped client — RLS enforces that students only see
  // records for their own applications, institutions their college's, admins all.
  const { data: record, error } = await supabase
    .from("ipa_records")
    .select("file_path, file_name")
    .eq("id", id)
    .single();

  if (error || !record) return NextResponse.json({ error: "IPA record not found" }, { status: 404 });

  // Sign with the service role — the ipa-documents bucket has no student read
  // policy by design; access was already authorised by the table RLS check.
  const adminDb = createAdminClient();
  const { data: signed, error: signErr } = await adminDb.storage
    .from("ipa-documents")
    .createSignedUrl(record.file_path, 3600, { download: record.file_name });

  if (signErr || !signed?.signedUrl) {
    console.error("[IpaDownload] sign error:", signErr?.message);
    return NextResponse.json({ error: "Could not generate download link" }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
