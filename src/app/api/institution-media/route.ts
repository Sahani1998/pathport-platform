import { NextRequest, NextResponse } from "next/server";
import { createClient }      from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { scanFile } from "@/lib/virus-scan";
import {
  IMAGE_MIME_TYPES, MAX_IMAGE_SIZE_BYTES, MEDIA_CATEGORIES,
} from "@/types/institution-media";
import type { InstitutionMedia, MediaCategory } from "@/types/institution-media";

const VALID_CATEGORIES = MEDIA_CATEGORIES.map(c => c.value);

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`media-upload:${ip}`, LIMITS.mediaUpload.limit, LIMITS.mediaUpload.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role, college_id").eq("id", user.id).single();

  if (!profile || (profile.role !== "institution" && profile.role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!profile.college_id) {
    return NextResponse.json({ error: "No college linked to your account" }, { status: 403 });
  }

  let formData: FormData;
  try { formData = await request.formData(); }
  catch { return NextResponse.json({ error: "Invalid form data" }, { status: 400 }); }

  const file     = formData.get("file")     as File   | null;
  const category = (formData.get("category") as string | null)?.trim() as MediaCategory | undefined;
  const title    = (formData.get("title")    as string | null)?.trim() || null;
  const caption  = (formData.get("caption")  as string | null)?.trim() || null;
  const altText  = (formData.get("alt_text") as string | null)?.trim() || null;

  if (!file) return NextResponse.json({ error: "file is required" }, { status: 400 });

  if (!(IMAGE_MIME_TYPES as readonly string[]).includes(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, or WebP images are allowed." }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return NextResponse.json({ error: "File too large. Maximum is 5 MB." }, { status: 400 });
  }
  if (file.size === 0) return NextResponse.json({ error: "File is empty." }, { status: 400 });

  if (category && !VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}` }, { status: 400 });
  }

  const ext         = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const storagePath = `${profile.college_id}/gallery/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;

  const adminDb = createAdminClient();
  const buffer  = await file.arrayBuffer();

  // Virus / magic-byte scan before storage write
  const scan = await scanFile(buffer, file.name, file.type);
  if (scan.status === "threat") {
    console.warn(`[InstitutionMedia] scan blocked file: ${file.name} threat=${scan.threat} user=${user.id}`);
    return NextResponse.json(
      { error: "File was rejected by the security scanner. Please ensure the image is not corrupted and try again." },
      { status: 422 },
    );
  }

  const { error: storageErr } = await adminDb.storage
    .from("institution-media")
    .upload(storagePath, buffer, { contentType: file.type, upsert: false, cacheControl: "86400" });

  if (storageErr) {
    console.error("[media upload] storage:", storageErr.message);
    return NextResponse.json({ error: `Storage error: ${storageErr.message}` }, { status: 500 });
  }

  const { data: { publicUrl } } = adminDb.storage
    .from("institution-media")
    .getPublicUrl(storagePath);

  const { data: inserted, error: dbErr } = await adminDb
    .from("institution_media")
    .insert({
      college_id:      profile.college_id,
      media_type:      "gallery_image",
      category:        category ?? null,
      title,
      caption,
      alt_text:        altText,
      storage_path:    storagePath,
      public_url:      publicUrl,
      file_size_bytes: file.size,
      status:          "draft",
      uploaded_by:     user.id,
    })
    .select()
    .single();

  if (dbErr) {
    await adminDb.storage.from("institution-media").remove([storagePath]);
    console.error("[media upload] db:", dbErr.message);
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  return NextResponse.json({ media: inserted as InstitutionMedia }, { status: 201 });
}
