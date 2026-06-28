import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { checkRateLimitAsync, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { resolveEmployer } from "@/lib/employer-auth";
import { scanFile } from "@/lib/virus-scan";

const MAX_BYTES = 10 * 1024 * 1024;
const BUCKET    = "employer-docs"; // PRIVATE bucket — verification docs are admin-only

export async function GET(req: NextRequest) {
  const rl = await checkRateLimitAsync(getClientIp(req), LIMITS.profile.limit, LIMITS.profile.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const r = await resolveEmployer();
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  if (!r.ctx.companyId) return NextResponse.json({ docs: [] });

  const db = createAdminClient();
  const { data, error } = await db
    .from("employer_verification_docs")
    .select("id, doc_type, file_name, status, rejection_reason, created_at, reviewed_at")
    .eq("company_id", r.ctx.companyId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ docs: data ?? [] });
}

export async function POST(req: NextRequest) {
  const rl = await checkRateLimitAsync(getClientIp(req), LIMITS.documentReview.limit, LIMITS.documentReview.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const r = await resolveEmployer();
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  if (!r.ctx.companyId) return NextResponse.json({ error: "Create your company profile first" }, { status: 409 });

  let formData: FormData;
  try { formData = await req.formData(); } catch { return NextResponse.json({ error: "Invalid form data" }, { status: 400 }); }

  const file    = formData.get("file") as File | null;
  const docType = (formData.get("doc_type") as string | null)?.trim();
  if (!file) return NextResponse.json({ error: "file is required" }, { status: 400 });
  if (!docType || !["registration_cert","acra","tax_doc","gov_letter","other"].includes(docType)) {
    return NextResponse.json({ error: "Invalid doc_type" }, { status: 400 });
  }
  if (file.type !== "application/pdf") return NextResponse.json({ error: "Verification documents must be PDF." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "File too large. Maximum 10 MB." }, { status: 400 });
  if (file.size === 0) return NextResponse.json({ error: "File is empty." }, { status: 400 });

  let buffer: ArrayBuffer;
  try { buffer = await file.arrayBuffer(); } catch { return NextResponse.json({ error: "Failed to read file" }, { status: 400 }); }

  const scan = await scanFile(buffer, file.name, file.type);
  if (scan.status === "threat") return NextResponse.json({ error: "File rejected by security scanner." }, { status: 422 });

  const db   = createAdminClient();
  const path = `${r.ctx.companyId}/verification/${Date.now()}.pdf`;
  // Private file — verification docs are admin-only
  const { error: upErr } = await db.storage.from(BUCKET).upload(path, buffer, { contentType: "application/pdf", upsert: false });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const { data, error } = await db.from("employer_verification_docs").insert({
    company_id:  r.ctx.companyId,
    doc_type:    docType,
    bucket:      BUCKET,
    path,
    file_name:   file.name,
    mime_type:   file.type,
    file_size:   file.size,
    uploaded_by: r.ctx.userId,
    status:      "pending",
  }).select("id, doc_type, file_name, status, created_at").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ doc: data }, { status: 201 });
}
