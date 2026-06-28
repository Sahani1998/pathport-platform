import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimitAsync, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";

async function requireEmployer() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401 };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "employer") return { error: "Forbidden", status: 403 };
  return { user, supabase };
}

export async function GET(req: NextRequest) {
  const rl = await checkRateLimitAsync(getClientIp(req), LIMITS.profile.limit, LIMITS.profile.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const auth = await requireEmployer();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { user } = auth;

  const db = createAdminClient();
  const { data, error } = await db
    .from("employer_companies")
    .select("*")
    .eq("employer_id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ company: data });
}

export async function PATCH(req: NextRequest) {
  const rl = await checkRateLimitAsync(getClientIp(req), LIMITS.profile.limit, LIMITS.profile.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const auth = await requireEmployer();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { user } = auth;

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const allowed = [
    "company_name","industry","company_size","website_url","logo_url","hq_city","hq_country",
    "description","linkedin_url","registration_number","uen","contact_email","contact_phone",
    "company_culture","benefits","social_facebook","social_instagram","social_x","hiring_contact_name",
  ] as const;
  const patch: Record<string, unknown> = {};
  for (const k of allowed) {
    if (k in body) patch[k] = body[k];
  }
  if (!Object.keys(patch).length) return NextResponse.json({ error: "No valid fields" }, { status: 400 });

  const db = createAdminClient();
  const { data: existing } = await db.from("employer_companies").select("id").eq("employer_id", user.id).maybeSingle();

  let result;
  if (existing) {
    result = await db.from("employer_companies").update(patch).eq("employer_id", user.id).select().single();
  } else {
    if (!patch.company_name) return NextResponse.json({ error: "company_name required" }, { status: 400 });
    result = await db.from("employer_companies").insert({ employer_id: user.id, ...patch }).select().single();
  }

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json({ company: result.data });
}
