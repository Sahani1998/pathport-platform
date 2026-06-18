import { NextRequest, NextResponse } from "next/server";
import { createClient }      from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";

interface BrandingBody {
  tagline?:                string;
  brand_colour_primary?:   string;
  brand_colour_secondary?: string;
  short_description?:      string;
  mission?:                string;
  vision?:                 string;
  introduction?:           string;
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: collegeId } = await params;
  const ip = getClientIp(request);
  const rl = checkRateLimit(`branding:${ip}`, LIMITS.brandingWrite.limit, LIMITS.brandingWrite.windowMs);
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

  let body: BrandingBody;
  try {
    body = await request.json() as BrandingBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validate colour hex values if provided
  if (body.brand_colour_primary !== undefined && body.brand_colour_primary !== null && body.brand_colour_primary !== "") {
    if (!HEX_RE.test(body.brand_colour_primary)) {
      return NextResponse.json({ error: "brand_colour_primary must be a valid hex colour (#rrggbb)" }, { status: 400 });
    }
  }
  if (body.brand_colour_secondary !== undefined && body.brand_colour_secondary !== null && body.brand_colour_secondary !== "") {
    if (!HEX_RE.test(body.brand_colour_secondary)) {
      return NextResponse.json({ error: "brand_colour_secondary must be a valid hex colour (#rrggbb)" }, { status: 400 });
    }
  }

  const patch: Record<string, string | null> = {};
  const fields: (keyof BrandingBody)[] = [
    "tagline", "brand_colour_primary", "brand_colour_secondary",
    "short_description", "mission", "vision", "introduction",
  ];
  for (const f of fields) {
    if (f in body) {
      const v = body[f];
      patch[f] = (v === "" || v === undefined) ? null : (v ?? null);
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const adminDb = createAdminClient();
  const { data: updated, error: updateErr } = await adminDb
    .from("colleges")
    .update(patch)
    .eq("id", collegeId)
    .select("id, tagline, brand_colour_primary, brand_colour_secondary, short_description, mission, vision, introduction")
    .single();

  if (updateErr) {
    console.error("[branding PATCH]", updateErr.message);
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ college: updated });
}
