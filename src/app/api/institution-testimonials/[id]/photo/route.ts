import { NextRequest, NextResponse } from "next/server";
import { createClient }      from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { IMAGE_MIME_TYPES, MAX_IMAGE_SIZE_BYTES } from "@/types/institution-media";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ip = getClientIp(request);
  const rl = checkRateLimit(`trust-photo:${ip}`, LIMITS.trustPhotoUpload.limit, LIMITS.trustPhotoUpload.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role, college_id").eq("id", user.id).single();
  if (!profile || (profile.role !== "institution" && profile.role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const adminDb = createAdminClient();
  const { data: row, error: rowErr } = await adminDb
    .from("institution_testimonials").select("id, college_id, student_photo_storage_path").eq("id", id).maybeSingle();
  if (rowErr || !row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (profile.role === "institution" && row.college_id !== profile.college_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let formData: FormData;
  try { formData = await request.formData(); }
  catch { return NextResponse.json({ error: "Invalid form data" }, { status: 400 }); }

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "file is required" }, { status: 400 });
  if (!(IMAGE_MIME_TYPES as readonly string[]).includes(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, or WebP images are allowed." }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) return NextResponse.json({ error: "Max 5 MB." }, { status: 400 });
  if (file.size === 0) return NextResponse.json({ error: "File is empty." }, { status: 400 });

  const ext         = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const storagePath = `${row.college_id}/testimonials/${id}/${Date.now()}.${ext}`;
  const buffer      = await file.arrayBuffer();

  const { error: storageErr } = await adminDb.storage
    .from("institution-media")
    .upload(storagePath, buffer, { contentType: file.type, upsert: true, cacheControl: "86400" });
  if (storageErr) return NextResponse.json({ error: storageErr.message }, { status: 500 });

  const { data: { publicUrl } } = adminDb.storage.from("institution-media").getPublicUrl(storagePath);

  if (row.student_photo_storage_path && row.student_photo_storage_path !== storagePath) {
    await adminDb.storage.from("institution-media").remove([row.student_photo_storage_path]);
  }

  const { error: updateErr } = await adminDb
    .from("institution_testimonials")
    .update({ student_photo_storage_path: storagePath, student_photo_url: publicUrl })
    .eq("id", id);
  if (updateErr) {
    await adminDb.storage.from("institution-media").remove([storagePath]);
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ student_photo_url: publicUrl });
}
