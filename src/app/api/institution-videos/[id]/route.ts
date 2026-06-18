import { NextRequest, NextResponse } from "next/server";
import { createClient }      from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { toEmbedUrl } from "@/lib/video-embed";
import type { InstitutionVideo, VideoStatus } from "@/types/institution-videos";

const VALID_STATUSES: VideoStatus[] = ["draft", "published", "archived"];

interface PatchBody {
  title?:       string;
  description?: string | null;
  video_url?:   string;
  status?:      VideoStatus;
  sort_order?:  number;
}

async function resolveAuth(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const { data: profile } = await supabase
    .from("profiles").select("role, college_id").eq("id", user.id).single();
  if (!profile || (profile.role !== "institution" && profile.role !== "admin")) return null;
  return { user, profile };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ip = getClientIp(request);
  const rl = checkRateLimit(`video-write:${ip}`, LIMITS.videoWrite.limit, LIMITS.videoWrite.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const auth = await resolveAuth(request);
  if (!auth) return NextResponse.json({ error: "Not authenticated or forbidden" }, { status: 401 });
  const { profile } = auth;

  const adminDb = createAdminClient();
  const { data: row, error: rowErr } = await adminDb
    .from("institution_videos").select("id, college_id, status").eq("id", id).maybeSingle();
  if (rowErr || !row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (profile.role === "institution" && row.college_id !== profile.college_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: PatchBody;
  try { body = await request.json() as PatchBody; }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (body.status !== undefined && !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  if (body.sort_order !== undefined && !Number.isInteger(body.sort_order)) {
    return NextResponse.json({ error: "sort_order must be an integer" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (body.title       !== undefined) patch.title       = body.title?.trim()       || null;
  if (body.description !== undefined) patch.description = body.description?.trim() || null;
  if (body.sort_order  !== undefined) patch.sort_order  = body.sort_order;

  if (body.video_url !== undefined) {
    const url = body.video_url.trim();
    const embed = toEmbedUrl(url);
    if (!embed) return NextResponse.json({ error: "Only YouTube and Vimeo URLs are supported." }, { status: 400 });
    patch.video_url = url;
    patch.embed_url = embed;
  }

  if (body.status !== undefined) {
    patch.status = body.status;
    if (body.status === "published" && row.status !== "published") patch.published_at = new Date().toISOString();
    if (body.status === "archived"  && row.status !== "archived")  patch.archived_at  = new Date().toISOString();
    if (body.status === "draft") { patch.published_at = null; patch.archived_at = null; }
  }

  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "No fields to update" }, { status: 400 });

  const { data: updated, error: updateErr } = await adminDb
    .from("institution_videos").update(patch).eq("id", id).select().single();
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  return NextResponse.json({ video: updated as InstitutionVideo });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ip = getClientIp(request);
  const rl = checkRateLimit(`video-write:${ip}`, LIMITS.videoWrite.limit, LIMITS.videoWrite.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const auth = await resolveAuth(request);
  if (!auth) return NextResponse.json({ error: "Not authenticated or forbidden" }, { status: 401 });
  const { profile } = auth;

  const adminDb = createAdminClient();
  const { data: row, error: rowErr } = await adminDb
    .from("institution_videos").select("id, college_id").eq("id", id).maybeSingle();
  if (rowErr || !row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (profile.role === "institution" && row.college_id !== profile.college_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error: deleteErr } = await adminDb.from("institution_videos").delete().eq("id", id);
  if (deleteErr) return NextResponse.json({ error: deleteErr.message }, { status: 500 });

  return new NextResponse(null, { status: 204 });
}
