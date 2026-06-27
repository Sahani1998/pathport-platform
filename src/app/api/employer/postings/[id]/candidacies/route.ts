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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rl = await checkRateLimitAsync(getClientIp(req), LIMITS.profile.limit, LIMITS.profile.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const auth = await requireEmployer();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { user } = auth;
  const { id: postingId } = await params;

  const db = createAdminClient();
  // Verify employer owns this posting
  const { data: posting } = await db.from("internship_postings").select("id").eq("id", postingId).eq("employer_id", user.id).maybeSingle();
  if (!posting) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data, error } = await db
    .from("internship_candidacies")
    .select(`
      id, status, cover_note, resume_url, interview_date,
      interview_notes, offer_allowance_sgd, offer_start_date,
      rejection_reason, employer_notes, applied_at, updated_at,
      student:profiles!internship_candidacies_student_id_fkey(
        id, full_name, email, country
      )
    `)
    .eq("posting_id", postingId)
    .order("applied_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ candidacies: data ?? [] });
}
