import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendTemplatedEmail } from "@/lib/email/send";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { notifyUser, logAudit } from "@/lib/application-timeline";
import type { OfferLetterStatus } from "@/types/offer-letters";

// ─── POST /api/offer-letters/[id]/lifecycle ───────────────────────────────────
// Institution/admin lifecycle transitions for an offer letter row:
//   action=issue       draft → issued     (notifies student)
//   action=supersede   issued → superseded (must supply new issued letter id)
//   action=archive     issued|superseded → archived
//   action=void        draft|issued|superseded|archived → void (requires reason)
//
// Security:
//   • Institution users are scoped to their own college via RLS + manual check.
//   • Students cannot call this endpoint.
//   • Accepted + issued letters cannot be voided (guard_accepted_offer_delete
//     trigger covers delete; here we guard update to void as well).

type Action = "issue" | "supersede" | "archive" | "void";
const VALID_ACTIONS: Action[] = ["issue", "supersede", "archive", "void"];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const ip = getClientIp(request);
  const rl = checkRateLimit(`offer-lifecycle:${ip}`, LIMITS.offerLifecycle.limit, LIMITS.offerLifecycle.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  let body: { action?: string; reason?: string; new_letter_id?: string };
  try {
    body = await request.json() as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const action = body.action as Action | undefined;
  if (!action || !VALID_ACTIONS.includes(action)) {
    return NextResponse.json({ error: `action must be one of: ${VALID_ACTIONS.join(", ")}` }, { status: 400 });
  }

  const reason = body.reason?.trim().slice(0, 2000) || null;
  if ((action === "void" || action === "archive") && !reason) {
    return NextResponse.json({ error: `reason is required for action: ${action}` }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role, college_id").eq("id", user.id).single();
  if (!profile || !["admin", "institution"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch the offer letter (RLS ensures institution only sees their college)
  const { data: letter } = await supabase
    .from("offer_letters")
    .select("id, application_id, status, version, student_decision, file_name")
    .eq("id", id)
    .single();
  if (!letter) return NextResponse.json({ error: "Offer letter not found" }, { status: 404 });

  const currentStatus = letter.status as OfferLetterStatus;

  // Validate transition
  const ALLOWED_FROM: Record<Action, OfferLetterStatus[]> = {
    issue:     ["draft"],
    supersede: ["issued"],
    archive:   ["issued", "superseded"],
    void:      ["draft", "issued", "superseded", "archived"],
  };
  if (!ALLOWED_FROM[action].includes(currentStatus)) {
    return NextResponse.json(
      { error: `Cannot ${action} a letter in status '${currentStatus}'. Allowed from: ${ALLOWED_FROM[action].join(", ")}` },
      { status: 409 },
    );
  }

  // Block voiding an accepted issued letter
  if (action === "void" && currentStatus === "issued" && letter.student_decision === "accepted") {
    return NextResponse.json(
      { error: "Cannot void an accepted offer letter. Supersede it with a corrected version instead — the accepted status is a legal record." },
      { status: 409 },
    );
  }

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = { updated_at: now };

  switch (action) {
    case "issue":
      // If another issued row exists for this application, supersede it first.
      // (This path is used for draft→issue; the new-upload path in POST /api/offer-letters
      //  handles the more common supersede-on-upload flow.)
      const { data: existingIssued } = await supabase
        .from("offer_letters")
        .select("id")
        .eq("application_id", letter.application_id)
        .eq("status", "issued")
        .neq("id", id)
        .maybeSingle();
      if (existingIssued) {
        await supabase
          .from("offer_letters")
          .update({ status: "superseded", superseded_at: now, superseded_by_id: id, updated_at: now })
          .eq("id", (existingIssued as { id: string }).id);
      }
      updates.status    = "issued";
      updates.issued_at = now;
      updates.issued_by = user.id;
      break;
    case "supersede":
      updates.status         = "superseded";
      updates.superseded_at  = now;
      if (body.new_letter_id) updates.superseded_by_id = body.new_letter_id;
      break;
    case "archive":
      updates.status         = "archived";
      updates.archived_at    = now;
      updates.archived_by    = user.id;
      updates.archive_reason = reason;
      break;
    case "void":
      updates.status     = "void";
      updates.void_reason = reason;
      updates.voided_at  = now;
      updates.voided_by  = user.id;
      break;
  }

  const { error: updateErr } = await supabase
    .from("offer_letters")
    .update(updates)
    .eq("id", id);
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  // Fetch application for side-effects
  const { data: app } = await supabase
    .from("applications")
    .select("id, student_id, course_id, courses (title, colleges (name))")
    .eq("id", letter.application_id)
    .single();

  if (app) {
    type RawCourse = { title: string; colleges: { name: string } | { name: string }[] | null };
    const rawCourse  = (Array.isArray(app.courses) ? app.courses[0] : app.courses) as RawCourse | null;
    const rawCollege = rawCourse ? (Array.isArray(rawCourse.colleges) ? rawCourse.colleges[0] : rawCourse.colleges) : null;

    // Audit log — always
    await logAudit(supabase, {
      applicationId: app.id,
      actorId:       user.id,
      actorRole:     profile.role,
      action:        `offer_letter_${action}`,
      fromValue:     currentStatus,
      toValue:       updates.status as string,
      reason,
      metadata:      { offer_letter_id: id, version: letter.version, file_name: letter.file_name },
    });

    // Notify student on Issue and Supersede (corrected letter available)
    if (action === "issue" || action === "supersede") {
      const title   = action === "issue"
        ? "Offer Letter Available"
        : "Updated Offer Letter Available";
      const message = action === "issue"
        ? `Your offer letter for ${rawCourse?.title ?? "your course"} is ready. Please review and respond.`
        : `An updated offer letter has been issued for ${rawCourse?.title ?? "your course"}. Please review the new version.`;

      await notifyUser(supabase, {
        userId:        app.student_id,
        applicationId: app.id,
        title,
        message,
        type:          "offer_letter",
      });

      // Email (non-fatal)
      const { data: student } = await supabase
        .from("profiles").select("email, full_name").eq("id", app.student_id).single();
      if (student?.email) {
        sendTemplatedEmail({
          to:       student.email,
          template: "offer_letter_available",
          context: {
            name:        student.full_name ?? "Student",
            courseName:  rawCourse?.title  ?? "",
            collegeName: rawCollege?.name  ?? "",
          },
          applicationId: app.id,
          userId:        app.student_id,
        }).catch(err => console.error("[OfferLetter] lifecycle email failed (non-fatal):", err));
      }
    }
  }

  return NextResponse.json({ success: true, action, status: updates.status });
}
