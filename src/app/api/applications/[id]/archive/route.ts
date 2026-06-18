import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { logAudit, notifyUser } from "@/lib/application-timeline";
import type { ApplicationOutcome } from "@/types/courses";

// ─── POST /api/applications/[id]/archive ─────────────────────────────────────
// Institution/admin archives an application as a CRM dead-end.
// This does NOT change current_stage — it adds an `outcome` label and sets
// `archived_at` so the application can be filtered out of active queues.
//
// Required body: { outcome, reason }
//   outcome: not_interested | archived_lead | rejected_by_institution
//   reason:  free text (required, max 2000 chars)
//
// Security:
//   • Institution users can only archive their own college's applications.
//   • Students cannot call this endpoint.
//   • Blocks archive if application has a paid/partially_paid invoice
//     (financial records must stay in active tracking).

const VALID_OUTCOMES: ApplicationOutcome[] = [
  "not_interested",
  "archived_lead",
  "rejected_by_institution",
];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const ip = getClientIp(request);
  const rl = checkRateLimit(`app-archive:${ip}`, LIMITS.appArchive.limit, LIMITS.appArchive.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  let body: { outcome?: string; reason?: string };
  try {
    body = await request.json() as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const outcome = body.outcome as ApplicationOutcome | undefined;
  const reason  = body.reason?.trim().slice(0, 2000) || null;

  if (!outcome || !VALID_OUTCOMES.includes(outcome)) {
    return NextResponse.json(
      { error: `outcome must be one of: ${VALID_OUTCOMES.join(", ")}` },
      { status: 400 },
    );
  }
  if (!reason) {
    return NextResponse.json({ error: "reason is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role, college_id").eq("id", user.id).single();
  if (!profile || !["admin", "institution"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch app + scope guard
  const { data: app } = await supabase
    .from("applications")
    .select("id, student_id, course_id, current_stage, archived_at, courses (college_id, title)")
    .eq("id", id)
    .single();
  if (!app) return NextResponse.json({ error: "Application not found" }, { status: 404 });

  type RawCourse = { college_id: string; title: string };
  const rawCourse = (Array.isArray(app.courses) ? app.courses[0] : app.courses) as RawCourse | null;

  if (profile.role === "institution" && rawCourse?.college_id !== profile.college_id) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  if (app.archived_at) {
    return NextResponse.json({ error: "Application is already archived" }, { status: 409 });
  }

  // Block archive if there's a financially significant invoice
  const { data: blockers } = await supabase
    .from("student_invoices")
    .select("id, status")
    .eq("application_id", id)
    .in("status", ["paid", "partially_paid", "refunded"])
    .limit(1);

  if ((blockers ?? []).length > 0) {
    return NextResponse.json(
      { error: "Cannot archive — this application has financial activity (paid/partially_paid/refunded invoice). Contact admin to manage this record." },
      { status: 409 },
    );
  }

  const now = new Date().toISOString();

  const { error: updateErr } = await supabase
    .from("applications")
    .update({
      outcome:        outcome,
      archived_at:    now,
      archived_by:    user.id,
      archive_reason: reason,
    })
    .eq("id", id);
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  await logAudit(supabase, {
    applicationId: id,
    actorId:       user.id,
    actorRole:     profile.role,
    action:        "application_archived",
    fromValue:     app.current_stage ?? null,
    toValue:       outcome,
    reason,
    metadata:      { course_title: rawCourse?.title ?? null },
  });

  // Notify student that this lead has been closed (non-blocking, informational)
  const OUTCOME_LABELS: Record<ApplicationOutcome, string> = {
    not_interested:          "Not Interested",
    withdrawn:               "Withdrawn",
    archived_lead:           "Archived",
    converted:               "Converted",
    rejected_by_institution: "Not Progressed",
  };
  await notifyUser(supabase, {
    userId:        app.student_id,
    applicationId: id,
    title:         "Application Status Update",
    message:       `Your application for ${rawCourse?.title ?? "this course"} has been marked as ${OUTCOME_LABELS[outcome]}. Please contact the institution if you have questions.`,
    type:          "application_update",
  });

  return NextResponse.json({ success: true, outcome, archived_at: now });
}
