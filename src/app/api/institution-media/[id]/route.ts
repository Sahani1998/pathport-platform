import { NextRequest, NextResponse } from "next/server";
import { createClient }      from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { MEDIA_CATEGORIES } from "@/types/institution-media";
import type { InstitutionMedia, MediaStatus, MediaCategory } from "@/types/institution-media";

const VALID_CATEGORIES = MEDIA_CATEGORIES.map(c => c.value);
const VALID_STATUSES: MediaStatus[] = ["draft", "published", "archived"];

interface PatchBody {
  category?:   MediaCategory | null;
  title?:      string | null;
  caption?:    string | null;
  alt_text?:   string | null;
  sort_order?: number;
  status?:     MediaStatus;
}

async function getAuthedProfile(request: NextRequest) {
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
  const rl = checkRateLimit(`media-write:${ip}`, LIMITS.mediaWrite.limit, LIMITS.mediaWrite.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const auth = await getAuthedProfile(request);
  if (!auth) return NextResponse.json({ error: "Not authenticated or forbidden" }, { status: 401 });
  const { profile } = auth;

  const adminDb = createAdminClient();

  // Verify the media row belongs to this institution's college
  const { data: row, error: rowErr } = await adminDb
    .from("institution_media").select("id, college_id, status").eq("id", id).maybeSingle();
  if (rowErr || !row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (profile.role === "institution" && row.college_id !== profile.college_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: PatchBody;
  try { body = await request.json() as PatchBody; }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (body.category !== undefined && body.category !== null && !VALID_CATEGORIES.includes(body.category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }
  if (body.status !== undefined && !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  if (body.sort_order !== undefined && (typeof body.sort_order !== "number" || !Number.isInteger(body.sort_order))) {
    return NextResponse.json({ error: "sort_order must be an integer" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if ("category"   in body) patch.category   = body.category   ?? null;
  if ("title"      in body) patch.title      = body.title      ?? null;
  if ("caption"    in body) patch.caption    = body.caption    ?? null;
  if ("alt_text"   in body) patch.alt_text   = body.alt_text   ?? null;
  if ("sort_order" in body) patch.sort_order = body.sort_order;
  if ("status"     in body) {
    patch.status = body.status;
    if (body.status === "published" && row.status !== "published") {
      patch.published_at = new Date().toISOString();
    }
    if (body.status === "archived" && row.status !== "archived") {
      patch.archived_at = new Date().toISOString();
    }
    if (body.status === "draft") {
      patch.published_at = null;
      patch.archived_at  = null;
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data: updated, error: updateErr } = await adminDb
    .from("institution_media")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (updateErr) {
    console.error("[media PATCH]", updateErr.message);
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ media: updated as InstitutionMedia });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ip = getClientIp(request);
  const rl = checkRateLimit(`media-write:${ip}`, LIMITS.mediaWrite.limit, LIMITS.mediaWrite.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const auth = await getAuthedProfile(request);
  if (!auth) return NextResponse.json({ error: "Not authenticated or forbidden" }, { status: 401 });
  const { profile } = auth;

  const adminDb = createAdminClient();

  const { data: row, error: rowErr } = await adminDb
    .from("institution_media").select("id, college_id, storage_path").eq("id", id).maybeSingle();
  if (rowErr || !row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (profile.role === "institution" && row.college_id !== profile.college_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Delete storage object first, then DB row
  const { error: storageErr } = await adminDb.storage
    .from("institution-media")
    .remove([row.storage_path]);

  if (storageErr) {
    console.error("[media DELETE] storage:", storageErr.message);
    // Non-fatal: proceed to delete DB row even if file was already gone
  }

  const { error: deleteErr } = await adminDb
    .from("institution_media").delete().eq("id", id);

  if (deleteErr) {
    console.error("[media DELETE] db:", deleteErr.message);
    return NextResponse.json({ error: deleteErr.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
