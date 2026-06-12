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
  const rl = checkRateLimit(`college-doc-dl:${ip}`, LIMITS.documentDownload.limit, LIMITS.documentDownload.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch with the user-scoped client — RLS enforces that students only see
  // their own rows, institutions only their college's students, admins all.
  const { data: doc, error } = await supabase
    .from("student_downloadable_documents")
    .select("file_path, file_name")
    .eq("id", id)
    .single();

  if (error || !doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  // Sign with the service role — storage RLS has no student read policy by
  // design; access was already authorised by the table RLS check above.
  const adminDb = createAdminClient();
  const { data: signed, error: signErr } = await adminDb.storage
    .from("college-documents")
    .createSignedUrl(doc.file_path, 3600, { download: doc.file_name });

  if (signErr || !signed?.signedUrl) {
    console.error("[CollegeDocDownload] sign error:", signErr?.message);
    return NextResponse.json({ error: "Could not generate download link" }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
