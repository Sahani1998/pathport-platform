import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimitAsync, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { notifyUser } from "@/lib/application-timeline";
import { recordCandidacyTimeline, logEmployerAudit } from "@/lib/candidacy-lifecycle";
import { sendTemplatedEmail } from "@/lib/email/send";

export async function GET(req: NextRequest) {
  const rl = await checkRateLimitAsync(getClientIp(req), LIMITS.profile.limit, LIMITS.profile.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "student") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = createAdminClient();
  const { data, error } = await db
    .from("candidacies")
    .select(`
      id, status, cover_note, offer_allowance, offer_currency, offer_start_date,
      offer_response_deadline, offer_terms, interview_date, interview_mode,
      interview_location, applied_at, updated_at,
      postings(
        id, title, department, location, work_type, monthly_allowance, currency_code, duration_months,
        employer_companies(company_name, logo_url)
      )
    `)
    .eq("student_id", user.id)
    .order("applied_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ candidacies: data ?? [] });
}

// Student-driven transitions: withdraw, accept offer, decline offer
export async function PATCH(req: NextRequest) {
  const rl = await checkRateLimitAsync(getClientIp(req), LIMITS.withdraw.limit, LIMITS.withdraw.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single();
  if (profile?.role !== "student") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { candidacy_id, action } = body as { candidacy_id?: string; action?: string };
  if (!candidacy_id) return NextResponse.json({ error: "candidacy_id required" }, { status: 400 });

  const act = action ?? "withdraw";
  if (!["withdraw", "accept_offer", "decline_offer"].includes(act)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const db = createAdminClient();

  // Fetch the candidacy (own) with posting + employer for notification
  const { data: cand } = await db
    .from("candidacies")
    .select(`
      id, status, student_id,
      postings!inner(employer_id, title, company_id)
    `)
    .eq("id", candidacy_id)
    .eq("student_id", user.id)
    .maybeSingle();

  if (!cand) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const posting = Array.isArray(cand.postings) ? cand.postings[0] : cand.postings as Record<string, unknown> | null;
  const fromStatus = cand.status as string;

  // Validate action against current status
  let newStatus: string;
  if (act === "withdraw") {
    if (["hired", "offer_accepted", "started_internship", "completed_internship"].includes(fromStatus)) {
      return NextResponse.json({ error: "This application can no longer be withdrawn." }, { status: 409 });
    }
    newStatus = "withdrawn";
  } else if (act === "accept_offer") {
    if (fromStatus !== "offer_extended") {
      return NextResponse.json({ error: "No active offer to accept." }, { status: 409 });
    }
    newStatus = "offer_accepted";
  } else {
    if (fromStatus !== "offer_extended") {
      return NextResponse.json({ error: "No active offer to decline." }, { status: 409 });
    }
    newStatus = "offer_declined";
  }

  const patch: Record<string, unknown> = { status: newStatus };
  if (act === "decline_offer") patch.student_decline_reason = (body.reason as string) ?? null;

  const { data, error } = await db
    .from("candidacies")
    .update(patch)
    .eq("id", candidacy_id)
    .eq("student_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: error.code === "PGRST116" ? 404 : 500 });

  // Timeline (always)
  await recordCandidacyTimeline(db, {
    candidacyId:   candidacy_id,
    status:        newStatus as Parameters<typeof recordCandidacyTimeline>[1]["status"],
    createdBy:     user.id,
    createdByRole: "student",
  });

  // Notify the employer of the student's decision
  if (posting?.employer_id) {
    const studentName = (profile?.full_name as string) ?? "A student";
    const postingTitle = (posting.title as string) ?? "your posting";
    const map: Record<string, { title: string; message: string }> = {
      withdrawn:      { title: "Candidate withdrew", message: `${studentName} withdrew their application for ${postingTitle}.` },
      offer_accepted: { title: "Offer accepted! 🎉", message: `${studentName} accepted your offer for ${postingTitle}.` },
      offer_declined: { title: "Offer declined", message: `${studentName} declined your offer for ${postingTitle}.` },
    };
    const m = map[newStatus];
    if (m) {
      await notifyUser(db, {
        userId: posting.employer_id as string,
        title:  m.title,
        message: m.message,
        type:   "application_update",
      });
    }
  }

  // Audit
  await logEmployerAudit(db, {
    companyId:  (posting?.company_id as string) ?? null,
    entityType: "candidacy",
    entityId:   candidacy_id,
    actorId:    user.id,
    actorRole:  "student",
    action:     "candidacy_status_changed",
    fromValue:  fromStatus,
    toValue:    newStatus,
    reason:     (body.reason as string) ?? null,
  });

  // Confirmation email to student on accept
  if (newStatus === "offer_accepted") {
    const { data: me } = await db.from("profiles").select("email, full_name").eq("id", user.id).single();
    if (me?.email) {
      await sendTemplatedEmail({
        to: me.email,
        template: "offer_accepted_confirmation",
        context: { name: me.full_name ?? undefined, postingTitle: (posting?.title as string) ?? undefined },
        userId: user.id,
      });
    }
  }

  return NextResponse.json({ candidacy: data });
}
