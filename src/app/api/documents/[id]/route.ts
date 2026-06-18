// DELETE /api/documents/[id]
//
// Student deletes a document they uploaded by mistake, BEFORE any review.
// Allowed only when the document is still 'pending' and the document has
// not been touched in document_reviews. Verified / rejected / superseded
// documents stay for audit — a fresh upload via /upload supersedes the
// active version via the existing is_active flag.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { logAudit } from "@/lib/application-timeline";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ip = getClientIp(request);
  const rl = checkRateLimit(`doc-delete:${ip}`, 20, 60_000);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: doc } = await supabase
    .from("student_documents")
    .select("id, student_id, application_id, document_type, status, file_path, file_name, is_active")
    .eq("id", id)
    .maybeSingle();
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only the owner can delete; institution must use the document review route.
  if (doc.student_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Only pending, currently-active documents can be hard-deleted. Reviewed
  // (verified/rejected) docs stay for audit — student must re-upload via the
  // upload route, which supersedes the active version.
  if (doc.status !== "pending") {
    return NextResponse.json(
      { error: `Cannot delete a ${doc.status} document. Upload a replacement to supersede it instead.` },
      { status: 409 },
    );
  }
  if (!doc.is_active) {
    return NextResponse.json(
      { error: "Cannot delete a superseded document — it remains for audit history." },
      { status: 409 },
    );
  }

  const adminDb = createAdminClient();

  // Guard: if a review row exists for this document, it has been touched —
  // refuse delete (status check above should already catch this; this is
  // defense-in-depth).
  const { count: reviewCount } = await adminDb
    .from("document_reviews")
    .select("id", { count: "exact", head: true })
    .eq("document_id", id);
  if ((reviewCount ?? 0) > 0) {
    return NextResponse.json(
      { error: "Cannot delete — this document has already been reviewed." },
      { status: 409 },
    );
  }

  const { error: rowErr } = await supabase
    .from("student_documents").delete().eq("id", id);
  if (rowErr) return NextResponse.json({ error: rowErr.message }, { status: 500 });

  // Storage cleanup.
  if (doc.file_path) {
    await adminDb.storage.from("student-documents").remove([doc.file_path]).catch(err =>
      console.error("[Doc] storage cleanup failed (non-fatal):", err),
    );
  }

  // Audit (non-fatal).
  await logAudit(adminDb, {
    applicationId: doc.application_id,
    actorId:       user.id,
    actorRole:     "student",
    action:        "document_deleted",
    fromValue:     doc.id,
    toValue:       null,
    metadata: {
      document_type: doc.document_type,
      file_name:     doc.file_name,
      file_path:     doc.file_path,
    },
  }).catch(err => console.error("[Doc] audit failed (non-fatal):", err));

  return NextResponse.json({ ok: true });
}
