import { NextRequest, NextResponse } from "next/server";
import { createClient }      from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import type { Facility, FacilityCategory } from "@/types/institution-trust";
import { FACILITY_CATEGORIES } from "@/types/institution-trust";

const VALID_CATEGORIES = FACILITY_CATEGORIES.map(c => c.value) as string[];

interface CreateBody {
  name:        string;
  description?: string;
  category?:   FacilityCategory;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`facility-write:${ip}`, LIMITS.facilityWrite.limit, LIMITS.facilityWrite.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role, college_id").eq("id", user.id).single();
  if (!profile || (profile.role !== "institution" && profile.role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!profile.college_id) return NextResponse.json({ error: "No college linked" }, { status: 403 });

  let body: CreateBody;
  try { body = await request.json() as CreateBody; }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (!body.name?.trim()) return NextResponse.json({ error: "name is required" }, { status: 400 });
  if (body.category !== undefined && !VALID_CATEGORIES.includes(body.category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const adminDb = createAdminClient();
  const { data: inserted, error: dbErr } = await adminDb
    .from("institution_facilities")
    .insert({
      college_id:  profile.college_id,
      name:        body.name.trim(),
      description: body.description?.trim() || null,
      category:    body.category ?? null,
      status:      "draft",
      uploaded_by: user.id,
    })
    .select().single();

  if (dbErr) {
    console.error("[facilities POST]", dbErr.message);
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  return NextResponse.json({ facility: inserted as Facility }, { status: 201 });
}
