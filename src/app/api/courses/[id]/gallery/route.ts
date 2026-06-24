import { NextRequest, NextResponse } from "next/server";
import { createClient }      from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { IMAGE_MIME_TYPES, MAX_IMAGE_SIZE_BYTES } from "@/types/institution-media";

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
    .select("id, college_id")
    .eq("id", courseId)
    .single();

  if (!course) return { forbidden: NextResponse.json({ error: "Course not found" }, { status: 404 }) };

  if (profile.role === "institution" && profile.college_id !== course.college_id)
    return { forbidden: NextResponse.json({ error: "Forbidden — not your course" }, { status: 403 }) };

  return { forbidden: null, user, profile, course, adminDb };
}

// ── GET — list gallery images ──────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: courseId } = await params;

  const resolved = await resolveCourse(courseId);
  if (resolved.forbidden) return resolved.forbidden;
  const { adminDb } = resolved;

  const { data, error } = await adminDb
    .from("course_gallery")
    .select("id, public_url, alt_text, sort_order, file_size_bytes, created_at")
    .eq("course_id", courseId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[gallery GET]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ images: data ?? [] });
}

// ── POST — upload gallery image ────────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: courseId } = await params;
  const ip = getClientIp(request);
  const rl = checkRateLimit(`gallery-upload:${ip}`, LIMITS.mediaUpload.limit, LIMITS.mediaUpload.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const resolved = await resolveCourse(courseId);
  if (resolved.forbidden) return resolved.forbidden;
  const { user, course, adminDb } = resolved;

  let formData: FormData;
  try { formData = await request.formData(); }
  catch { return NextResponse.json({ error: "Invalid form data" }, { status: 400 }); }

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "file is required" }, { status: 400 });

  if (!(IMAGE_MIME_TYPES as readonly string[]).includes(file.type))
    return NextResponse.json({ error: "Only JPEG, PNG, or WebP images are allowed." }, { status: 400 });
  if (file.size > MAX_IMAGE_SIZE_BYTES)
    return NextResponse.json({ error: "File too large. Maximum is 5 MB." }, { status: 400 });
  if (file.size === 0)
    return NextResponse.json({ error: "File is empty." }, { status: 400 });

  // Determine next sort_order
  const { data: maxRow } = await adminDb
    .from("course_gallery")
    .select("sort_order")
    .eq("course_id", courseId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sortOrder = (maxRow?.sort_order ?? -1) + 1;

  const ext         = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const storagePath = `${course.college_id}/${courseId}/gallery/${Date.now()}.${ext}`;
  const buffer      = await file.arrayBuffer();

  const { error: storageErr } = await adminDb.storage
    .from("course-media")
    .upload(storagePath, buffer, { contentType: file.type, upsert: false, cacheControl: "86400" });

  if (storageErr) {
    console.error("[gallery upload] storage:", storageErr.message);
    return NextResponse.json({ error: `Storage error: ${storageErr.message}` }, { status: 500 });
  }

  const { data: { publicUrl } } = adminDb.storage.from("course-media").getPublicUrl(storagePath);

  const { data: inserted, error: insertErr } = await adminDb
    .from("course_gallery")
    .insert({
      course_id:       courseId,
      college_id:      course.college_id,
      storage_path:    storagePath,
      public_url:      publicUrl,
      sort_order:      sortOrder,
      file_size_bytes: file.size,
      uploaded_by:     user.id,
    })
    .select()
    .single();

  if (insertErr) {
    await adminDb.storage.from("course-media").remove([storagePath]);
    console.error("[gallery upload] db insert:", insertErr.message);
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  await adminDb.from("course_media_audit").insert({
    course_id:       courseId,
    college_id:      course.college_id,
    user_id:         user.id,
    action:          "upload_gallery_image",
    storage_path:    storagePath,
    file_size_bytes: file.size,
  });

  return NextResponse.json({ image: inserted }, { status: 201 });
}
