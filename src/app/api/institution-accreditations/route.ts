import { NextRequest, NextResponse } from "next/server";
import { createClient }      from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import type { Accreditation } from "@/types/institution-trust";

interface CreateBody {
  name:          string;
  issuing_body:  string;
  description?:  string;
  year_awarded?: number;
  valid_until?:  number;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`accreditation-write:${ip}`, LIMITS.accreditationWrite.limit, LIMITS.accreditationWrite.windowMs);
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

  if (!body.name?.trim())         return NextResponse.json({ error: "name is required" },         { status: 400 });
  if (!body.issuing_body?.trim()) return NextResponse.json({ error: "issuing_body is required" }, { status: 400 });

  if (body.year_awarded !== undefined && (typeof body.year_awarded !== "number" || body.year_awarded < 1900 || body.year_awarded > 2100)) {
    return NextResponse.json({ error: "year_awarded must be a valid year" }, { status: 400 });
  }
  if (body.valid_until !== undefined && (typeof body.valid_until !== "number" || body.valid_until < 1900 || body.valid_until > 2100)) {
    return NextResponse.json({ error: "valid_until must be a valid year" }, { status: 400 });
  }

  const adminDb = createAdminClient();
  const { data: inserted, error: dbErr } = await adminDb
    .from("institution_accreditations")
    .insert({
      college_id:   profile.college_id,
      name:         body.name.trim(),
      issuing_body: body.issuing_body.trim(),
      description:  body.description?.trim() || null,
      year_awarded: body.year_awarded ?? null,
      valid_until:  body.valid_until  ?? null,
      status:       "draft",
      uploaded_by:  user.id,
    })
    .select().single();

  if (dbErr) {
    console.error("[accreditations POST]", dbErr.message);
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  return NextResponse.json({ accreditation: inserted as Accreditation }, { status: 201 });
}
