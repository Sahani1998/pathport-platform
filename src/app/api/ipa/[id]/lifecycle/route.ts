import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from "@/lib/rate-limit";
import { notifyUser, logAudit } from "@/lib/application-timeline";
import type { IpaLifecycleStatus } from "@/types/application-processing";

// ─── POST /api/ipa/[id]/lifecycle ─────────────────────────────────────────────
// Institution/admin lifecycle transitions for an IPA record's lifecycle_status
// (orthogonal to the ICA decision `status` column):
//
//   action=issue      draft → issued     (notifies student)
//   action=supersede  issued → superseded
//   action=archive    issued|superseded → archived
//   action=void       draft|issued|superseded|archived → void (requires reason)
//
// The ICA decision (`status`: submitted/pending/approved/rejected) is managed
// separately via PATCH /api/ipa/[id].
//
// Security: institution-scoped via RLS; students cannot call this endpoint.

type Action = "issue" | "supersede" | "archive" | "void";
const VALID_ACTIONS: Action[] = ["issue", "supersede", "archive", "void"];

const ALLOWED_FROM: Record<Action, IpaLifecycleStatus[]> = {
  issue:     ["draft"],
  supersede: ["issued"],
  archive:   ["issued", "superseded"],
  void:      ["draft", "issued", "superseded", "archived"],
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const ip = getClientIp(request);
  const rl = checkRateLimit(`ipa-lifecycle:${ip}`, LIMITS.ipaLifecycle.limit, LIMITS.ipaLifecycle.windowMs);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  let body: { action?: string; reason?: string };
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

  // RLS restricts institution users to their own college's records
  const { data: record } = await supabase
    .from("ipa_records")
    .select("id, application_id, lifecycle_status, status, file_name")
    .eq("id", id)
    .single();
  if (!record) return NextResponse.json({ error: "IPA record not found" }, { status: 404 });

  const currentLifecycle = record.lifecycle_status as IpaLifecycleStatus;

  if (!ALLOWED_FROM[action].includes(currentLifecycle)) {
    return NextResponse.json(
      { error: `Cannot ${action} an IPA in lifecycle_status '${currentLifecycle}'. Allowed from: ${ALLOWED_FROM[action].join(", ")}` },
      { status: 409 },
    );
  }

  // Block voiding an approved IPA — it's a legal/immigration record
  if (action === "void" && record.status === "approved") {
    return NextResponse.json(
      { error: "Cannot void an ICA-approved IPA. Supersede it with a corrected version instead." },
      { status: 409 },
    );
  }

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = { updated_at: now };

  switch (action) {
    case "issue":
      // Supersede any other active (draft|issued) IPA for this application first
      const { data: existingActive } = await supabase
        .from("ipa_records")
        .select("id")
        .eq("application_id", record.application_id)
        .in("lifecycle_status", ["draft", "issued"])
        .neq("id", id)
        .maybeSingle();
      if (existingActive) {
        await supabase
          .from("ipa_records")
          .update({ lifecycle_status: "superseded", superseded_at: now, superseded_by_id: id, updated_at: now })
          .eq("id", (existingActive as { id: string }).id);
      }
      updates.lifecycle_status = "issued";
      updates.issued_at        = now;
      updates.issued_by        = user.id;
      break;
    case "supersede":
      updates.lifecycle_status  = "superseded";
      updates.superseded_at     = now;
      break;
    case "archive":
      updates.lifecycle_status = "archived";
      updates.archived_at      = now;
      updates.archived_by      = user.id;
      updates.archive_reason   = reason;
      break;
    case "void":
      updates.lifecycle_status = "void";
      updates.void_reason      = reason;
      updates.voided_at        = now;
      updates.voided_by        = user.id;
      break;
  }

  const { error: updateErr } = await supabase
    .from("ipa_records")
    .update(updates)
    .eq("id", id);
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  // Side effects: audit + student notification on issue
  const { data: app } = await supabase
    .from("applications")
    .select("id, student_id, courses (title, colleges (name))")
    .eq("id", record.application_id)
    .single();

  if (app) {
    type RawCourse = { title: string; colleges: { name: string } | { name: string }[] | null };
    const rawCourse  = (Array.isArray(app.courses) ? app.courses[0] : app.courses) as RawCourse | null;
    const rawCollege = rawCourse ? (Array.isArray(rawCourse.colleges) ? rawCourse.colleges[0] : rawCourse.colleges) : null;
    void rawCollege;

    await logAudit(supabase, {
      applicationId: app.id,
      actorId:       user.id,
      actorRole:     profile.role,
      action:        `ipa_lifecycle_${action}`,
      fromValue:     currentLifecycle,
      toValue:       updates.lifecycle_status as string,
      reason,
      metadata:      { ipa_record_id: id, file_name: record.file_name },
    });

    if (action === "issue" || action === "supersede") {
      const title   = action === "issue"
        ? "IPA Update"
        : "Updated IPA Available";
      const message = action === "issue"
        ? `Your In-Principle Approval document for ${rawCourse?.title ?? "your course"} has been issued. You can view and download it from your application.`
        : `An updated IPA has been issued for ${rawCourse?.title ?? "your course"}. Please check your application for the latest version.`;

      await notifyUser(supabase, {
        userId:        app.student_id,
        applicationId: app.id,
        title,
        message,
        type:          "application_update",
      });
    }
  }

  return NextResponse.json({ success: true, action, lifecycle_status: updates.lifecycle_status });
}
