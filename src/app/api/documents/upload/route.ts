import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES, DOCUMENT_TYPES } from "@/types/documents";
import type { StudentDocument, DocumentType } from "@/types/documents";
import { resolveStage } from "@/lib/application-stage-mapping";
import { recordTimelineEvent, notifyUser, logAudit } from "@/lib/application-timeline";

const VALID_DOCUMENT_TYPES = DOCUMENT_TYPES.map(d => d.value);

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`doc-upload:${ip}`, 20, 60_000);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  // Auth — must use user-scoped server client to get the real user
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Parse multipart form data
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file         = formData.get("file") as File | null;
  const applicationId = (formData.get("applicationId") as string | null)?.trim();
  const documentType  = (formData.get("documentType") as string | null)?.trim() as DocumentType | undefined;

  // Validate required fields
  if (!file)          return NextResponse.json({ error: "file is required" },          { status: 400 });
  if (!applicationId) return NextResponse.json({ error: "applicationId is required" }, { status: 400 });
  if (!documentType)  return NextResponse.json({ error: "documentType is required" },  { status: 400 });

  if (!VALID_DOCUMENT_TYPES.includes(documentType)) {
    return NextResponse.json(
      { error: `Invalid document type. Must be one of: ${VALID_DOCUMENT_TYPES.join(", ")}` },
      { status: 400 },
    );
  }

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Only PDF, JPG, JPEG, and PNG files are allowed." },
      { status: 400 },
    );
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: `File too large. Maximum size is 10 MB (received ${(file.size / 1024 / 1024).toFixed(1)} MB).` },
      { status: 400 },
    );
  }

  if (file.size === 0) {
    return NextResponse.json({ error: "File is empty." }, { status: 400 });
  }

  // Verify the application belongs to this student (user-scoped client enforces RLS)
  const { data: app, error: appError } = await supabase
    .from("applications")
    .select("id, current_stage, status")
    .eq("id", applicationId)
    .eq("student_id", user.id)
    .maybeSingle();

  if (appError) {
    console.error("[DocUpload] application lookup error:", appError.message);
    return NextResponse.json({ error: "Failed to verify application" }, { status: 500 });
  }
  if (!app) {
    return NextResponse.json({ error: "Application not found or does not belong to you" }, { status: 403 });
  }

  // Build storage path
  const ext         = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const timestamp   = Date.now();
  const storagePath = `${user.id}/${applicationId}/${documentType}-${timestamp}.${ext}`;

  console.log("[DocUpload] user:", user.id, "| path:", storagePath);

  // Use admin client for storage + DB — bypasses RLS, no session token complications
  const adminDb = createAdminClient();

  // Convert File to ArrayBuffer for server-side upload
  let buffer: ArrayBuffer;
  try {
    buffer = await file.arrayBuffer();
  } catch {
    return NextResponse.json({ error: "Failed to read file" }, { status: 400 });
  }

  // Upload to storage
  const { error: storageError } = await adminDb.storage
    .from("student-documents")
    .upload(storagePath, buffer, {
      contentType:  file.type,
      upsert:       true,
      cacheControl: "3600",
    });

  if (storageError) {
    console.error("[DocUpload] storage error:", storageError.message);
    return NextResponse.json(
      { error: `Storage upload failed: ${storageError.message}` },
      { status: 500 },
    );
  }

  // Deactivate any prior active row for this slot so the partial unique
  // index (application_id, document_type) WHERE is_active=true permits the
  // insert below. Historical rows are retained for audit + document_reviews.
  const { error: deactivateError } = await adminDb
    .from("student_documents")
    .update({ is_active: false })
    .eq("application_id", applicationId)
    .eq("document_type",  documentType)
    .eq("is_active",      true);

  if (deactivateError) {
    await adminDb.storage.from("student-documents").remove([storagePath]);
    console.error("[DocUpload] deactivate prior version error:", deactivateError.message);
    return NextResponse.json(
      { error: `Failed to supersede prior upload: ${deactivateError.message}` },
      { status: 500 },
    );
  }

  // Insert DB record — admin client, no RLS complications
  const { data: inserted, error: dbError } = await adminDb
    .from("student_documents")
    .insert({
      student_id:     user.id,
      application_id: applicationId,
      document_type:  documentType,
      file_name:      file.name,
      file_url:       storagePath,
      file_path:      storagePath,
      mime_type:      file.type,
      file_size:      file.size,
      status:         "pending",
      is_active:      true,
    })
    .select()
    .single();

  if (dbError) {
    // Roll back the storage upload so we don't leave orphan files. Older
    // versions stay deactivated — they're historical records; the student
    // can retry the upload (the next attempt's deactivate step is a no-op).
    await adminDb.storage.from("student-documents").remove([storagePath]);
    console.error("[DocUpload] DB insert error:", dbError.message);
    return NextResponse.json(
      { error: `Database error: ${dbError.message}` },
      { status: 500 },
    );
  }

  // Sprint 20A P1-2: record timeline + notification + audit trio so each
  // upload is observable. All helpers are non-fatal (log on error, never throw).
  const docMeta    = DOCUMENT_TYPES.find(d => d.value === documentType);
  const docLabel   = docMeta?.label ?? documentType;
  const stage      = resolveStage((app as { current_stage?: string }).current_stage, (app as { status?: string }).status);

  await Promise.all([
    recordTimelineEvent(adminDb, {
      applicationId,
      stage,
      title:         `${docLabel} uploaded`,
      description:   `Student uploaded ${docLabel} (${file.name}).`,
      createdBy:     user.id,
      createdByRole: "student",
    }),
    notifyUser(adminDb, {
      userId:        user.id,
      applicationId,
      title:         "Document Uploaded 📤",
      message:       `Your ${docLabel} has been uploaded successfully. Our team will review it shortly.`,
      type:          "document_update",
    }),
    logAudit(adminDb, {
      applicationId,
      actorId:       user.id,
      actorRole:     "student",
      action:        "document_uploaded",
      fromValue:     null,
      toValue:       inserted.id,
      metadata: {
        document_type: documentType,
        document_label: docLabel,
        file_name:     file.name,
        file_size:     file.size,
        mime_type:     file.type,
        document_id:   inserted.id,
      },
    }),
  ]);

  console.log("[DocUpload] success — id:", inserted.id);
  return NextResponse.json({ document: inserted as StudentDocument }, { status: 201 });
}
