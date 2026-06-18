import { NextRequest, NextResponse } from "next/server";
import { createClient }      from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import type { FacultyMember } from "@/types/institution-people";

interface CreateBody {
  name:           string;
  title:          string;
  department?:    string;
  qualifications?: string;
  bio?:           string;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`people-write:${ip}`, LIMITS.peopleWrite.limit, LIMITS.peopleWrite.windowMs);
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

  if (!body.name?.trim())  return NextResponse.json({ error: "name is required"  }, { status: 400 });
  if (!body.title?.trim()) return NextResponse.json({ error: "title is required" }, { status: 400 });

  const adminDb = createAdminClient();
  const { data: inserted, error: dbErr } = await adminDb
    .from("institution_faculty")
    .insert({
      college_id:     profile.college_id,
      name:           body.name.trim(),
      title:          body.title.trim(),
      department:     body.department?.trim()     || null,
      qualifications: body.qualifications?.trim() || null,
      bio:            body.bio?.trim()            || null,
      status:         "draft",
      uploaded_by:    user.id,
    })
    .select().single();

  if (dbErr) {
    console.error("[faculty POST]", dbErr.message);
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  return NextResponse.json({ member: inserted as FacultyMember }, { status: 201 });
}
