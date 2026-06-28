import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimitAsync, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import {
  EMPLOYER_TRANSITIONS, fireCandidacyTransition,
  type CandidacyStatus,
} from "@/lib/candidacy-lifecycle";

async function requireEmployer() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401 };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "employer") return { error: "Forbidden", status: 403 };
  return { user };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rl = await checkRateLimitAsync(getClientIp(req), LIMITS.stage.limit, LIMITS.stage.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const auth = await requireEmployer();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { user } = auth;
  const { id } = await params;

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const db = createAdminClient();
  // Fetch candidacy + posting (ownership) + student (email) + company (name)
  const { data: candidacy } = await db
    .from("candidacies")
    .select(`
      id, status, student_id, application_id,
      postings!inner(employer_id, title, company_id, company:employer_companies(company_name)),
      student:profiles!student_id(email, full_name)
    `)
    .eq("id", id)
    .maybeSingle();

  if (!candidacy) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const posting = Array.isArray(candidacy.postings) ? candidacy.postings[0] : candidacy.postings as Record<string, unknown> | null;
  if ((posting?.employer_id as string) !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const student = Array.isArray(candidacy.student) ? candidacy.student[0] : candidacy.student as Record<string, unknown> | null;
  const company = posting?.company
    ? (Array.isArray(posting.company) ? posting.company[0] : posting.company as Record<string, unknown>)
    : null;

  const fromStatus = candidacy.status as CandidacyStatus;
  const newStatus  = body.status as CandidacyStatus | undefined;

  if (newStatus) {
    const allowed = EMPLOYER_TRANSITIONS[fromStatus] ?? [];
    if (!allowed.includes(newStatus)) {
      return NextResponse.json({
        error: `Cannot transition from '${fromStatus}' to '${newStatus}'`,
      }, { status: 409 });
    }
  }

  const allowed = [
    "status", "interview_date", "interview_location", "interview_mode", "interview_notes",
    "offer_allowance", "offer_currency", "offer_start_date", "offer_response_deadline", "offer_terms",
    "rejection_reason", "rejection_category", "employer_notes",
  ] as const;
  const patch: Record<string, unknown> = {};
  for (const k of allowed) {
    if (k in body) patch[k] = body[k];
  }
  if (!Object.keys(patch).length) return NextResponse.json({ error: "No valid fields" }, { status: 400 });

  const { data, error } = await db
    .from("candidacies")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fire full side-effect quartet on a status change
  if (newStatus && newStatus !== fromStatus) {
    await fireCandidacyTransition(db, {
      candidacyId:  id,
      studentId:    candidacy.student_id as string,
      postingTitle: (posting?.title as string) ?? "the position",
      companyName:  (company?.company_name as string) ?? null,
      companyId:    (posting?.company_id as string) ?? null,
      fromStatus,
      toStatus:     newStatus,
      actorId:      user.id,
      actorRole:    "employer",
      studentEmail: (student?.email as string) ?? null,
      studentName:  (student?.full_name as string) ?? null,
      interviewDate: data.interview_date ?? null,
      interviewMode: data.interview_mode ?? null,
      interviewLocation: data.interview_location ?? null,
      allowance:    data.offer_allowance != null ? `${data.offer_currency ?? "SGD"} ${data.offer_allowance}` : null,
      startDate:    data.offer_start_date ?? null,
      responseDeadline: data.offer_response_deadline ?? null,
      reason:       (body.rejection_reason as string) ?? null,
    });
  }

  return NextResponse.json({ candidacy: data });
}
