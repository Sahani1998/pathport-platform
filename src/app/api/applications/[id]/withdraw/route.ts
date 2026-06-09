import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { sendTemplatedEmail } from "@/lib/email/send";

// Stages from which withdrawal is allowed
const WITHDRAWABLE_STAGES = new Set([
  "application_submitted",
  "documents_pending",
  "documents_uploaded",
  "documents_under_review",
  "documents_verified",
  "offer_letter_processing",
]);

const VALID_REASONS = [
  "financial_constraints",
  "changed_mind",
  "accepted_elsewhere",
  "course_concerns",
  "family_reasons",
  "personal_reasons",
  "other",
] as const;
type WithdrawalReason = typeof VALID_REASONS[number];

const REASON_LABELS: Record<WithdrawalReason, string> = {
  financial_constraints: "Financial constraints",
  changed_mind:          "Changed my mind",
  accepted_elsewhere:    "Accepted at another institution",
  course_concerns:       "Concerns about the course",
  family_reasons:        "Family reasons",
  personal_reasons:      "Personal reasons",
  other:                 "Other",
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const ip = getClientIp(request);
  const rl = checkRateLimit(`withdraw:${ip}`, LIMITS.withdraw.limit, LIMITS.withdraw.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const reason   = String(body.reason ?? "") as WithdrawalReason;
  const comments = body.comments ? String(body.comments).trim().slice(0, 1000) : null;

  if (!reason || !VALID_REASONS.includes(reason)) {
    return NextResponse.json({ error: "A withdrawal reason is required" }, { status: 400 });
  }

  // Fetch application + related context for notifications
  const { data: app } = await supabase
    .from("applications")
    .select(`
      id, student_id, course_id, current_stage,
      courses (
        id, title, college_id,
        colleges (id, name)
      )
    `)
    .eq("id", id)
    .single();

  if (!app)                       return NextResponse.json({ error: "Not found" },  { status: 404 });
  if (app.student_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const stage = (app.current_stage ?? "application_submitted") as string;
  if (!WITHDRAWABLE_STAGES.has(stage)) {
    return NextResponse.json(
      { error: "This application cannot be withdrawn at its current stage" },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  const reasonLabel = REASON_LABELS[reason];

  // Update application
  const { error: updateErr } = await supabase
    .from("applications")
    .update({
      current_stage:       "withdrawn",
      status:              "rejected",
      stage_updated_at:    now,
      updated_at:          now,
      withdrawal_reason:   reason,
      withdrawal_comments: comments,
      withdrawn_at:        now,
    })
    .eq("id", id);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  // Resolve related data once for downstream side effects
  const course   = Array.isArray(app.courses)  ? app.courses[0]  : app.courses;
  const college  = course
    ? (Array.isArray(course.colleges) ? course.colleges[0] : course.colleges)
    : null;
  const courseName  = course?.title ?? "the course";
  const collegeName = college?.name ?? "";
  const collegeId   = college?.id;

  // Student profile (for email + notification context)
  const { data: studentProfile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", user.id)
    .single();
  const studentName = studentProfile?.full_name ?? "A student";

  // Audit log — internal record (separate from student-facing timeline)
  await supabase.from("application_audit_log").insert({
    application_id: id,
    actor_id:       user.id,
    actor_role:     "student",
    action:         "withdrawn",
    from_value:     stage,
    to_value:       "withdrawn",
    reason:         reason,
    comments:       comments,
    metadata: {
      reason_label: reasonLabel,
      course_title: courseName,
      college_name: collegeName,
      college_id:   collegeId ?? null,
    },
  });

  // Student-facing timeline event
  await supabase.from("application_timeline_events").insert({
    application_id:     id,
    stage:              "withdrawn",
    title:              "Application Withdrawn",
    description:        comments
      ? `Withdrawn: ${reasonLabel}. ${comments}`
      : `Withdrawn: ${reasonLabel}.`,
    created_by:         user.id,
    created_by_role:    "student",
    visible_to_student: true,
  });

  // Student in-app notification + confirmation email
  await supabase.from("notifications").insert({
    user_id:        user.id,
    application_id: id,
    title:          "Application Withdrawn",
    message:        `Your application for ${courseName} has been successfully withdrawn.`,
    type:           "application_update",
  });

  if (studentProfile?.email) {
    sendTemplatedEmail({
      to:            studentProfile.email,
      template:      "application_withdrawn",
      context: {
        name:       studentProfile.full_name ?? "Student",
        courseName,
        reason:     reasonLabel,
        message:    comments ?? undefined,
      },
      applicationId: id,
      userId:        user.id,
    }).catch(err => console.error("[Withdraw] student email failed (non-fatal):", err));
  }

  // Notify institution staff that own this college
  if (collegeId) {
    const { data: institutionUsers } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .eq("role", "institution")
      .eq("college_id", collegeId);

    for (const inst of (institutionUsers ?? []) as { id: string; email: string; full_name: string | null }[]) {
      await supabase.from("notifications").insert({
        user_id:        inst.id,
        application_id: id,
        title:          "Student withdrew application",
        message:        `${studentName} withdrew their application for ${courseName}. Reason: ${reasonLabel}.`,
        type:           "application_update",
      });
      if (inst.email) {
        sendTemplatedEmail({
          to:            inst.email,
          template:      "withdrawal_notice_internal",
          context: {
            studentName,
            courseName,
            collegeName,
            reason:  reasonLabel,
            message: comments ?? undefined,
          },
          applicationId: id,
          userId:        inst.id,
          metadata:      { audience: "institution" },
        }).catch(err => console.error("[Withdraw] institution email failed (non-fatal):", err));
      }
    }
  }

  // Notify all admins
  const { data: admins } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("role", "admin");

  for (const admin of (admins ?? []) as { id: string; email: string }[]) {
    await supabase.from("notifications").insert({
      user_id:        admin.id,
      application_id: id,
      title:          "Application Withdrawn",
      message:        `${studentName} withdrew their application for ${courseName}${collegeName ? ` at ${collegeName}` : ""}. Reason: ${reasonLabel}.`,
      type:           "application_update",
    });
    if (admin.email) {
      sendTemplatedEmail({
        to:            admin.email,
        template:      "withdrawal_notice_internal",
        context: {
          studentName,
          courseName,
          collegeName,
          reason:  reasonLabel,
          message: comments ?? undefined,
        },
        applicationId: id,
        userId:        admin.id,
        metadata:      { audience: "admin" },
      }).catch(err => console.error("[Withdraw] admin email failed (non-fatal):", err));
    }
  }

  return NextResponse.json({ success: true });
}
