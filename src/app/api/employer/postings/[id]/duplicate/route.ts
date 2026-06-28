import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimitAsync, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";

async function requireEmployer() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401 };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "employer") return { error: "Forbidden", status: 403 };
  return { user };
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rl = await checkRateLimitAsync(getClientIp(req), LIMITS.courseWrite.limit, LIMITS.courseWrite.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const auth = await requireEmployer();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { user } = auth;
  const { id } = await params;

  const db = createAdminClient();
  const { data: src } = await db
    .from("postings")
    .select("*")
    .eq("id", id)
    .eq("employer_id", user.id)
    .maybeSingle();

  if (!src) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Copy field set, reset status to draft + provenance
  const copyFields = [
    "company_id","posting_type","title","department","description","requirements",
    "location","country_code","currency_code","work_type","monthly_allowance",
    "working_hours_per_week","duration_months","openings","skills_required","benefits",
    "start_date","application_deadline",
  ] as const;
  const payload: Record<string, unknown> = {
    employer_id: user.id,
    status: "draft",
    duplicated_from_id: id,
  };
  for (const k of copyFields) payload[k] = (src as Record<string, unknown>)[k];
  payload.title = `${src.title} (Copy)`;

  const { data, error } = await db.from("postings").insert(payload).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ posting: data }, { status: 201 });
}
