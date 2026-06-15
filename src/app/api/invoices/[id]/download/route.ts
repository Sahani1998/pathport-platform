// GET /api/invoices/[id]/download
//
// Uploaded source → returns a 1-hour signed URL to the stored PDF.
// Generated source → redirects to the print-friendly HTML invoice view,
//   which the user can save as PDF via the browser's print dialog.
//
// Authorization is RLS-enforced at the row level — student sees only their
// own non-draft invoices, institution sees their college, admin sees all.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ip = getClientIp(request);
  const rl = checkRateLimit(`invoice-dl:${ip}`, LIMITS.invoiceRead.limit, LIMITS.invoiceRead.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: invoice, error } = await supabase
    .from("student_invoices")
    .select("id, source, file_path, public_id")
    .eq("id", id)
    .maybeSingle();
  if (error)   return NextResponse.json({ error: error.message }, { status: 500 });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (invoice.source === "uploaded") {
    if (!invoice.file_path) return NextResponse.json({ error: "No file attached" }, { status: 404 });
    const downloadName = `${invoice.public_id ?? "invoice"}.pdf`;
    const { data: signed, error: signErr } = await supabase.storage
      .from("invoices")
      .createSignedUrl(invoice.file_path, 3600, { download: downloadName });
    if (signErr || !signed?.signedUrl) {
      return NextResponse.json({ error: "Could not generate download link" }, { status: 500 });
    }
    return NextResponse.redirect(signed.signedUrl);
  }

  // Generated: send the user to the printable HTML view.
  const origin = new URL(request.url).origin;
  return NextResponse.redirect(`${origin}/invoices/${id}/print?auto=1`, 302);
}
