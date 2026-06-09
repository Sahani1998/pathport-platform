import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const ip = getClientIp(request);
  const rl = checkRateLimit(`doc-dl:${ip}`, LIMITS.documentDownload.limit, LIMITS.documentDownload.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch document (RLS will reject if user lacks access)
  const { data: doc, error } = await supabase
    .from("student_documents")
    .select("file_path, file_name, mime_type")
    .eq("id", id)
    .single();

  if (error || !doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  // Generate 60-minute signed URL
  const { data: signed, error: signErr } = await supabase.storage
    .from("student-documents")
    .createSignedUrl(doc.file_path, 3600);

  if (signErr || !signed?.signedUrl) {
    return NextResponse.json({ error: "Could not generate download link" }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
