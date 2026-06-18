import { NextRequest, NextResponse } from "next/server";
import { createClient }      from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import type { Facility, TrustStatus, FacilityCategory } from "@/types/institution-trust";
import { FACILITY_CATEGORIES } from "@/types/institution-trust";

const VALID_STATUSES:   TrustStatus[]      = ["draft", "published", "archived"];
const VALID_CATEGORIES: string[]           = FACILITY_CATEGORIES.map(c => c.value);

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
  const rl = checkRateLimit(`facility-write:${ip}`, LIMITS.facilityWrite.limit, LIMITS.facilityWrite.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const auth = await resolveAuth(request);
  if (!auth) return NextResponse.json({ error: "Not authenticated or forbidden" }, { status: 401 });
  const { profile } = auth;

  const adminDb = createAdminClient();
  const { data: row, error: rowErr } = await adminDb
    .from("institution_facilities").select("id, college_id, status").eq("id", id).maybeSingle();
  if (rowErr || !row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (profile.role === "institution" && row.college_id !== profile.college_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const status = body.status as TrustStatus | undefined;
  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const category = body.category as FacilityCategory | null | undefined;
  if (category !== undefined && category !== null && !VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if ("name"        in body) patch.name        = (body.name        as string)?.trim() || null;
  if ("description" in body) patch.description = (body.description as string)?.trim() || null;
  if ("category"    in body) patch.category    = category ?? null;
  if ("sort_order"  in body) patch.sort_order  = body.sort_order;

  if (status !== undefined) {
    patch.status = status;
    if (status === "published" && row.status !== "published") patch.published_at = new Date().toISOString();
    if (status === "archived"  && row.status !== "archived")  patch.archived_at  = new Date().toISOString();
    if (status === "draft") { patch.published_at = null; patch.archived_at = null; }
  }

  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "No fields to update" }, { status: 400 });

  const { data: updated, error: updateErr } = await adminDb
    .from("institution_facilities").update(patch).eq("id", id).select().single();
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  return NextResponse.json({ facility: updated as Facility });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ip = getClientIp(request);
  const rl = checkRateLimit(`facility-write:${ip}`, LIMITS.facilityWrite.limit, LIMITS.facilityWrite.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const auth = await resolveAuth(request);
  if (!auth) return NextResponse.json({ error: "Not authenticated or forbidden" }, { status: 401 });
  const { profile } = auth;

  const adminDb = createAdminClient();
  const { data: row, error: rowErr } = await adminDb
    .from("institution_facilities").select("id, college_id, cover_storage_path").eq("id", id).maybeSingle();
  if (rowErr || !row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (profile.role === "institution" && row.college_id !== profile.college_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (row.cover_storage_path) {
    await adminDb.storage.from("institution-media").remove([row.cover_storage_path]);
  }

  const { error: deleteErr } = await adminDb.from("institution_facilities").delete().eq("id", id);
  if (deleteErr) return NextResponse.json({ error: deleteErr.message }, { status: 500 });

  return new NextResponse(null, { status: 204 });
}
