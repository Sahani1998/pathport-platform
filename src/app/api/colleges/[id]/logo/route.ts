import { NextRequest, NextResponse } from "next/server";
import { createClient }      from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { IMAGE_MIME_TYPES, MAX_IMAGE_SIZE_BYTES } from "@/types/institution-media";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: collegeId } = await params;
  const ip = getClientIp(request);
  const rl = checkRateLimit(`logo-upload:${ip}`, LIMITS.mediaUpload.limit, LIMITS.mediaUpload.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role, college_id").eq("id", user.id).single();

  if (!profile || (profile.role !== "institution" && profile.role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (profile.role === "institution" && profile.college_id !== collegeId) {
    return NextResponse.json({ error: "Forbidden — not your college" }, { status: 403 });
  }

  let formData: FormData;
  try { formData = await request.formData(); }
  catch { return NextResponse.json({ error: "Invalid form data" }, { status: 400 }); }

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "file is required" }, { status: 400 });

  if (!(IMAGE_MIME_TYPES as readonly string[]).includes(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, or WebP images are allowed." }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return NextResponse.json({ error: `File too large. Maximum is 5 MB.` }, { status: 400 });
  }
  if (file.size === 0) return NextResponse.json({ error: "File is empty." }, { status: 400 });

  const ext         = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const storagePath = `${collegeId}/logo/${Date.now()}.${ext}`;

  const adminDb = createAdminClient();
  const buffer  = await file.arrayBuffer();

  const { error: storageErr } = await adminDb.storage
    .from("institution-media")
    .upload(storagePath, buffer, { contentType: file.type, upsert: true, cacheControl: "86400" });

  if (storageErr) {
    console.error("[logo upload] storage:", storageErr.message);
    return NextResponse.json({ error: `Storage error: ${storageErr.message}` }, { status: 500 });
  }

  const { data: { publicUrl } } = adminDb.storage
    .from("institution-media")
    .getPublicUrl(storagePath);

  const { error: updateErr } = await adminDb
    .from("colleges")
    .update({ logo_url: publicUrl })
    .eq("id", collegeId);

  if (updateErr) {
    await adminDb.storage.from("institution-media").remove([storagePath]);
    console.error("[logo upload] db:", updateErr.message);
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ logo_url: publicUrl }, { status: 200 });
}
