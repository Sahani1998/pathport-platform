import { NextRequest, NextResponse } from "next/server";
import { createClient }      from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import type { LeadershipMember } from "@/types/institution-people";

interface CreateBody {
  name: string;
  role: string;
  bio?: string;
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

  if (!body.name?.trim()) return NextResponse.json({ error: "name is required" }, { status: 400 });
  if (!body.role?.trim()) return NextResponse.json({ error: "role is required" }, { status: 400 });

  const adminDb = createAdminClient();
  const { data: inserted, error: dbErr } = await adminDb
    .from("institution_leadership")
    .insert({
      college_id:  profile.college_id,
      name:        body.name.trim(),
      role:        body.role.trim(),
      bio:         body.bio?.trim() || null,
      status:      "draft",
      uploaded_by: user.id,
    })
    .select().single();

  if (dbErr) {
    console.error("[leadership POST]", dbErr.message);
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  return NextResponse.json({ member: inserted as LeadershipMember }, { status: 201 });
}
