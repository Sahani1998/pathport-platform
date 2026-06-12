import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { sendTemplatedEmail } from "@/lib/email/send";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { recordTimelineEvent, notifyUser, logAudit, advanceApplicationStage } from "@/lib/application-timeline";
import type { ApplicationStage } from "@/types/timeline";

// ─── POST /api/offer-letters/[id]/decision ───────────────────────────────────
// Student accepts or declines their offer letter.
//
// Ownership is verified with the user-scoped client (RLS), then side effects
// (stage advance, timeline, notifications, audit) run on the admin client —
// students have no direct write access to those tables by design.

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const ip = getClientIp(request);
  const rl = checkRateLimit(`offer-decision:${ip}`, LIMITS.offerDecision.limit, LIMITS.offerDecision.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  try {
    let decision: "accepted" | "declined";
    let comment:  string | null;

    try {
      const body = await request.json() as { decision?: string; comment?: string | null };
      decision = body.decision as "accepted" | "declined";
      comment  = body.comment?.trim().slice(0, 2000) || null;
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (!["accepted", "declined"].includes(decision)) {
      return NextResponse.json({ error: "decision must be 'accepted' or 'declined'" }, { status: 400 });
    }
    if (decision === "declined" && !comment) {
      return NextResponse.json({ error: "A comment is required when declining an offer" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    // ── Load letter through RLS (student only sees own) ──────────────────────
    const { data: letter } = await supabase
      .from("offer_letters")
      .select("id, application_id, uploaded_by, version, expiry_date, student_decision")
      .eq("id", id)
      .single();
    if (!letter) return NextResponse.json({ error: "Offer letter not found" }, { status: 404 });

    const { data: app } = await supabase
      .from("applications")
      .select("id, student_id, course_id, current_stage, courses (title, colleges (name))")
      .eq("id", letter.application_id)
      .single();
    if (!app || app.student_id !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (letter.student_decision) {
      return NextResponse.json({ error: `Offer already ${letter.student_decision}` }, { status: 409 });
    }
    if (decision === "accepted" && letter.expiry_date && new Date(letter.expiry_date) < new Date()) {
      return NextResponse.json(
        { error: "This offer letter has expired. Please contact the institution for a new one." },
        { status: 409 },
      );
    }

    type RawCourse = { title: string; colleges: { name: string } | { name: string }[] | null };
    const rawCourse  = (Array.isArray(app.courses) ? app.courses[0] : app.courses) as RawCourse | null;
    const rawCollege = rawCourse ? (Array.isArray(rawCourse.colleges) ? rawCourse.colleges[0] : rawCourse.colleges) : null;
    const courseName  = rawCourse?.title ?? "your course";
    const collegeName = rawCollege?.name ?? "";

    // ── Record the decision (user-scoped — RLS "student decide own") ─────────
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("offer_letters")
      .update({ student_decision: decision, decision_at: now, decision_comment: comment, updated_at: now })
      .eq("id", id);
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    // ── Side effects via admin client ─────────────────────────────────────────
    let adminDb: ReturnType<typeof createAdminClient>;
    try {
      adminDb = createAdminClient();
    } catch (e) {
      console.error("[OfferDecision] admin client unavailable — side effects skipped:", e instanceof Error ? e.message : e);
      return NextResponse.json({ success: true, decision, warning: "Decision saved; downstream updates pending" });
    }

    if (decision === "accepted") {
      await advanceApplicationStage(adminDb, {
        applicationId:  app.id,
        studentId:      user.id,
        fromStage:      app.current_stage ?? null,
        toStage:        "offer_letter_accepted",
        actorId:        user.id,
        actorRole:      "student",
        auditAction:    "offer_letter_accepted",
        auditMetadata:  { offer_letter_id: id, version: letter.version, comment },
      });
    } else {
      await recordTimelineEvent(adminDb, {
        applicationId: app.id,
        stage:         (app.current_stage ?? "offer_letter_ready") as ApplicationStage,
        title:         "Offer Letter Declined",
        description:   `The student declined offer letter v${letter.version}.${comment ? ` Reason: ${comment}` : ""}`,
        createdBy:     user.id,
        createdByRole: "student",
      });
      await logAudit(adminDb, {
        applicationId: app.id,
        actorId:       user.id,
        actorRole:     "student",
        action:        "offer_letter_declined",
        fromValue:     `v${letter.version}`,
        toValue:       "declined",
        reason:        comment,
        metadata:      { offer_letter_id: id, version: letter.version },
      });
    }

    // Notify the institution uploader
    if (letter.uploaded_by) {
      await notifyUser(adminDb, {
        userId:        letter.uploaded_by,
        applicationId: app.id,
        title:         decision === "accepted" ? "Offer Letter Accepted 🎊" : "Offer Letter Declined",
        message:       `The student has ${decision} offer letter v${letter.version} for ${courseName}.${comment ? ` Comment: ${comment}` : ""}`,
        type:          "offer_letter",
      });
    }

    // ── Emails (non-fatal) ────────────────────────────────────────────────────
    const [{ data: student }, { data: uploader }] = await Promise.all([
      adminDb.from("profiles").select("email, full_name").eq("id", user.id).single(),
      letter.uploaded_by
        ? adminDb.from("profiles").select("email").eq("id", letter.uploaded_by).single()
        : Promise.resolve({ data: null }),
    ]);

    if (decision === "accepted" && student?.email) {
      sendTemplatedEmail({
        to:       student.email,
        template: "offer_letter_accepted",
        context:  { name: student.full_name ?? "there", courseName, collegeName },
        applicationId: app.id,
        userId:   user.id,
        metadata: { offer_letter_id: id },
      }).catch(err => console.error("[OfferDecision] student email failed (non-fatal):", err));
    }

    if (uploader?.email) {
      sendTemplatedEmail({
        to:       uploader.email,
        template: "offer_letter_decision_internal",
        context: {
          studentName: student?.full_name ?? "A student",
          decision,
          courseName,
          collegeName,
          comment,
        },
        applicationId: app.id,
        userId:   letter.uploaded_by,
        metadata: { offer_letter_id: id, decision },
      }).catch(err => console.error("[OfferDecision] uploader email failed (non-fatal):", err));
    }

    console.log("[OfferDecision]", id, "→", decision, "by student:", user.id);
    return NextResponse.json({ success: true, decision }, { status: 200 });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[OfferDecision] unexpected error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
