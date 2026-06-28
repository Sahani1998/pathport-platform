import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { checkRateLimitAsync, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { resolveEmployer } from "@/lib/employer-auth";
import { scanFile } from "@/lib/virus-scan";

const IMAGE_MIME = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES  = 5 * 1024 * 1024;
const BUCKET     = "employer-media";

export async function GET(req: NextRequest) {
  const rl = await checkRateLimitAsync(getClientIp(req), LIMITS.profile.limit, LIMITS.profile.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const r = await resolveEmployer();
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  if (!r.ctx.companyId) return NextResponse.json({ media: [] });

  const db = createAdminClient();
  const { data, error } = await db
    .from("employer_company_media")
    .select("*")
    .eq("company_id", r.ctx.companyId)
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Attach public URLs so the client can render previews
  const media = (data ?? []).map(m => ({
    ...m,
    public_url: db.storage.from(m.bucket as string).getPublicUrl(m.path as string).data.publicUrl,
  }));
  return NextResponse.json({ media });
}

// Upload logo / banner / gallery image
export async function POST(req: NextRequest) {
  const rl = await checkRateLimitAsync(getClientIp(req), LIMITS.mediaUpload.limit, LIMITS.mediaUpload.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const r = await resolveEmployer();
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  if (!r.ctx.companyId) return NextResponse.json({ error: "Create your company profile first" }, { status: 409 });

  let formData: FormData;
  try { formData = await req.formData(); } catch { return NextResponse.json({ error: "Invalid form data" }, { status: 400 }); }

  const file      = formData.get("file") as File | null;
  const mediaType = (formData.get("media_type") as string | null)?.trim();
  if (!file) return NextResponse.json({ error: "file is required" }, { status: 400 });
  if (!mediaType || !["logo","banner","gallery"].includes(mediaType)) {
    return NextResponse.json({ error: "media_type must be logo, banner, or gallery" }, { status: 400 });
  }
  if (!IMAGE_MIME.includes(file.type)) return NextResponse.json({ error: "Only JPG, PNG, or WebP images are allowed." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Image too large. Maximum 5 MB." }, { status: 400 });
  if (file.size === 0) return NextResponse.json({ error: "File is empty." }, { status: 400 });

  let buffer: ArrayBuffer;
  try { buffer = await file.arrayBuffer(); } catch { return NextResponse.json({ error: "Failed to read file" }, { status: 400 }); }

  const scan = await scanFile(buffer, file.name, file.type);
  if (scan.status === "threat") return NextResponse.json({ error: "File rejected by security scanner." }, { status: 422 });

  const db = createAdminClient();
  const ext  = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const path = `${r.ctx.companyId}/${mediaType}/${Date.now()}.${ext}`;

  const { error: upErr } = await db.storage.from(BUCKET).upload(path, buffer, { contentType: file.type, upsert: false });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const { data: pub } = db.storage.from(BUCKET).getPublicUrl(path);
  const publicUrl = pub.publicUrl;

  // For logo/banner: single instance — remove prior rows of same type
  if (mediaType === "logo" || mediaType === "banner") {
    await db.from("employer_company_media").delete().eq("company_id", r.ctx.companyId).eq("media_type", mediaType);
  }

  const { data, error } = await db.from("employer_company_media").insert({
    company_id:  r.ctx.companyId,
    media_type:  mediaType,
    bucket:      BUCKET,
    path,
    mime_type:   file.type,
    file_size:   file.size,
    is_public:   true,
    uploaded_by: r.ctx.userId,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Keep employer_companies.logo_url in sync for quick access
  if (mediaType === "logo") {
    await db.from("employer_companies").update({ logo_url: publicUrl }).eq("id", r.ctx.companyId);
  }

  return NextResponse.json({ media: { ...data, public_url: publicUrl } }, { status: 201 });
}
