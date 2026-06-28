import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimitAsync, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { getStageMeta } from "@/types/timeline";
import { notifyUser } from "@/lib/application-timeline";
import { recordCandidacyTimeline } from "@/lib/candidacy-lifecycle";
import { sendTemplatedEmail } from "@/lib/email/send";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rl = await checkRateLimitAsync(getClientIp(req), LIMITS.apply.limit, LIMITS.apply.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "student") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: postingId } = await params;

  const db = createAdminClient();

  // Check eligibility
  const { data: eligibility } = await db
    .from("posting_eligibility")
    .select("status")
    .eq("student_id", user.id)
    .maybeSingle();

  const { data: appRow } = await db
    .from("applications")
    .select("id, current_stage")
    .eq("student_id", user.id)
    .not("current_stage", "in", '("rejected","withdrawn")')
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const stageStep = appRow ? getStageMeta(appRow.current_stage as Parameters<typeof getStageMeta>[0]).step : 0;
  const eligibleByStage = stageStep >= getStageMeta("internship_eligible").step;
  const isEligible = eligibility?.status === "eligible" || (eligibleByStage && eligibility?.status !== "suspended");

  if (!isEligible) return NextResponse.json({ error: "You are not eligible to apply for internships yet." }, { status: 403 });

  // Verify posting is open
  const { data: posting } = await db
    .from("postings")
    .select("id, status, title, employer_id")
    .eq("id", postingId)
    .maybeSingle();

  if (!posting) return NextResponse.json({ error: "Posting not found" }, { status: 404 });
  if (posting.status !== "open") return NextResponse.json({ error: "This position is no longer accepting applications" }, { status: 409 });

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* cover note is optional */ }

  const { data, error } = await db
    .from("candidacies")
    .insert({
      posting_id:    postingId,
      student_id:    user.id,
      application_id: appRow?.id ?? null,
      cover_note:    (body.cover_note as string | null) ?? null,
      resume_url:    (body.resume_url as string | null) ?? null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "You have already applied to this position" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Record candidacy timeline (applied)
  await recordCandidacyTimeline(db, {
    candidacyId:   data.id,
    status:        "applied",
    createdBy:     user.id,
    createdByRole: "student",
  });

  // Non-fatal: notify the employer in-app
  await notifyUser(db, {
    userId:  posting.employer_id,
    title:   "New Application",
    message: `A student has applied to your posting: ${posting.title}`,
    type:    "application_update",
  });

  // Non-fatal: email the employer
  const { data: employer } = await db
    .from("profiles").select("email, full_name").eq("id", posting.employer_id).maybeSingle();
  const { data: me } = await db
    .from("profiles").select("full_name").eq("id", user.id).maybeSingle();
  if (employer?.email) {
    await sendTemplatedEmail({
      to: employer.email,
      template: "new_applicant_employer",
      context: {
        name:          employer.full_name ?? undefined,
        postingTitle:  posting.title,
        candidateName: me?.full_name ?? "A student",
      },
      userId: posting.employer_id,
    });
  }

  return NextResponse.json({ candidacy: data }, { status: 201 });
}
