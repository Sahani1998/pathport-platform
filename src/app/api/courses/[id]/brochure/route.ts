import { NextRequest, NextResponse } from "next/server";
import { createClient }      from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { IMAGE_MIME_TYPES, PDF_MIME_TYPE, MAX_PDF_SIZE_BYTES } from "@/types/institution-media";
import type { CourseMediaAction } from "@/types/course-media";

const ALLOWED_BROCHURE_TYPES = [...IMAGE_MIME_TYPES, PDF_MIME_TYPE] as const;

async function resolveCourse(courseId: string) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { forbidden: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };

  const { data: profile } = await supabase
    .from("profiles").select("role, college_id").eq("id", user.id).single();

  if (!profile || (profile.role !== "institution" && profile.role !== "admin"))
    return { forbidden: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };

  const adminDb = createAdminClient();
  const { data: course } = await adminDb
    .from("courses")
    .select("id, college_id, brochure_url, brochure_storage_path")
    .eq("id", courseId)
    .single();

  if (!course) return { forbidden: NextResponse.json({ error: "Course not found" }, { status: 404 }) };

  if (profile.role === "institution" && profile.college_id !== course.college_id)
    return { forbidden: NextResponse.json({ error: "Forbidden — not your course" }, { status: 403 }) };

  return { forbidden: null, user, profile, course, adminDb };
}

async function writeAudit(
  adminDb: ReturnType<typeof createAdminClient>,
  action: CourseMediaAction,
  courseId: string,
  collegeId: string,
  userId: string,
  storagePath: string | null,
  fileSizeBytes: number | null,
) {
  await adminDb.from("course_media_audit").insert({
    course_id:       courseId,
    college_id:      collegeId,
    user_id:         userId,
    action,
    storage_path:    storagePath,
    file_size_bytes: fileSizeBytes,
  });
}

// ── POST — upload brochure ─────────────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: courseId } = await params;
  const ip = getClientIp(request);
  const rl = checkRateLimit(`brochure-upload:${ip}`, LIMITS.mediaUpload.limit, LIMITS.mediaUpload.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const resolved = await resolveCourse(courseId);
  if (resolved.forbidden) return resolved.forbidden;
  const { user, course, adminDb } = resolved;

  let formData: FormData;
  try { formData = await request.formData(); }
  catch { return NextResponse.json({ error: "Invalid form data" }, { status: 400 }); }

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "file is required" }, { status: 400 });

  if (!(ALLOWED_BROCHURE_TYPES as readonly string[]).includes(file.type))
    return NextResponse.json({ error: "Only PDF or image files are allowed for brochures." }, { status: 400 });
  if (file.size > MAX_PDF_SIZE_BYTES)
    return NextResponse.json({ error: "File too large. Maximum is 10 MB." }, { status: 400 });
  if (file.size === 0)
    return NextResponse.json({ error: "File is empty." }, { status: 400 });

  const ext         = file.name.split(".").pop()?.toLowerCase() ?? "pdf";
  const storagePath = `${course.college_id}/${courseId}/brochure/${Date.now()}.${ext}`;
  const buffer      = await file.arrayBuffer();

  if (course.brochure_storage_path) {
    await adminDb.storage.from("course-media").remove([course.brochure_storage_path]);
  }

  const { error: storageErr } = await adminDb.storage
    .from("course-media")
    .upload(storagePath, buffer, { contentType: file.type, upsert: true, cacheControl: "86400" });

  if (storageErr) {
    console.error("[brochure upload] storage:", storageErr.message);
    return NextResponse.json({ error: `Storage error: ${storageErr.message}` }, { status: 500 });
  }

  const { data: { publicUrl } } = adminDb.storage.from("course-media").getPublicUrl(storagePath);

  const { error: updateErr } = await adminDb
    .from("courses")
    .update({ brochure_url: publicUrl, brochure_storage_path: storagePath })
    .eq("id", courseId);

  if (updateErr) {
    await adminDb.storage.from("course-media").remove([storagePath]);
    console.error("[brochure upload] db:", updateErr.message);
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  await writeAudit(adminDb, "upload_brochure", courseId, course.college_id, user.id, storagePath, file.size);

  return NextResponse.json({ brochure_url: publicUrl }, { status: 200 });
}

// ── DELETE — remove brochure ───────────────────────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: courseId } = await params;

  const resolved = await resolveCourse(courseId);
  if (resolved.forbidden) return resolved.forbidden;
  const { user, course, adminDb } = resolved;

  if (course.brochure_storage_path) {
    await adminDb.storage.from("course-media").remove([course.brochure_storage_path]);
  }

  const { error } = await adminDb
    .from("courses")
    .update({ brochure_url: null, brochure_storage_path: null })
    .eq("id", courseId);

  if (error) {
    console.error("[brochure delete] db:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await writeAudit(adminDb, "delete_brochure", courseId, course.college_id, user.id, null, null);

  return new NextResponse(null, { status: 204 });
}
