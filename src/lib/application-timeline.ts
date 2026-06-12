// ═══════════════════════════════════════════════════════════════════════════
// PathPort — Application Timeline Helpers (Sprint 15)
//
// Reusable server-side helpers so every workflow action records the same
// trio of side effects — timeline event, in-app notification, audit log —
// without each API route re-implementing the inserts.
//
// All helpers are non-fatal by design: a failed side effect logs a console
// error and returns false, it never throws. The primary mutation (stage
// update, document review, …) must already have succeeded before these run.
// ═══════════════════════════════════════════════════════════════════════════

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ApplicationStage, NotificationType } from "@/types/timeline";
import { getStageMeta, STAGE_NOTIFICATION } from "@/types/timeline";
import { STAGE_TO_STATUS } from "@/lib/application-stage-mapping";

// Any Supabase client — user-scoped (RLS enforced) or admin (service role).
// Callers pick the right one: user-scoped wherever RLS allows the insert,
// admin only where the writer differs from the notification target.
type Db = SupabaseClient;

// ─── Timeline event ──────────────────────────────────────────────────────────

export interface TimelineEventInput {
  applicationId:    string;
  stage:            ApplicationStage;
  title?:           string;          // defaults to the stage label
  description?:     string | null;   // defaults to the stage description
  createdBy:        string | null;
  createdByRole:    string | null;   // 'admin' | 'institution' | 'student' | 'system'
  visibleToStudent?: boolean;        // default true
}

export async function recordTimelineEvent(db: Db, input: TimelineEventInput): Promise<boolean> {
  const meta = getStageMeta(input.stage);
  const { error } = await db.from("application_timeline_events").insert({
    application_id:     input.applicationId,
    stage:              input.stage,
    title:              input.title ?? meta.label,
    description:        input.description ?? meta.description,
    created_by:         input.createdBy,
    created_by_role:    input.createdByRole,
    visible_to_student: input.visibleToStudent ?? true,
  });
  if (error) console.error("[Timeline] event insert failed (non-fatal):", error.message);
  return !error;
}

// ─── In-app notification ─────────────────────────────────────────────────────

export interface NotificationInput {
  userId:         string;
  applicationId?: string | null;
  title:          string;
  message:        string;
  type:           NotificationType;
}

export async function notifyUser(db: Db, input: NotificationInput): Promise<boolean> {
  const { error } = await db.from("notifications").insert({
    user_id:        input.userId,
    application_id: input.applicationId ?? null,
    title:          input.title,
    message:        input.message,
    type:           input.type,
  });
  if (error) console.error("[Timeline] notification insert failed (non-fatal):", error.message);
  return !error;
}

// ─── Audit log ───────────────────────────────────────────────────────────────

export interface AuditInput {
  applicationId: string;
  actorId:       string | null;
  actorRole:     string | null;
  action:        string;
  fromValue?:    string | null;
  toValue?:      string | null;
  reason?:       string | null;
  comments?:     string | null;
  metadata?:     Record<string, unknown>;
}

export async function logAudit(db: Db, input: AuditInput): Promise<boolean> {
  const { error } = await db.from("application_audit_log").insert({
    application_id: input.applicationId,
    actor_id:       input.actorId,
    actor_role:     input.actorRole,
    action:         input.action,
    from_value:     input.fromValue ?? null,
    to_value:       input.toValue ?? null,
    reason:         input.reason ?? null,
    comments:       input.comments ?? null,
    metadata:       input.metadata ?? {},
  });
  if (error) console.error("[Timeline] audit insert failed (non-fatal):", error.message);
  return !error;
}

// ─── Composite: advance the application stage ────────────────────────────────
// Updates applications.current_stage (+legacy status sync), then records the
// timeline event, student notification, and audit entry in one call.

export interface AdvanceStageInput {
  applicationId:   string;
  studentId:       string;
  fromStage:       ApplicationStage | null;
  toStage:         ApplicationStage;
  actorId:         string | null;
  actorRole:       string | null;
  studentMessage?: string | null;
  auditAction?:    string;            // defaults to "stage_changed"
  auditMetadata?:  Record<string, unknown>;
}

export async function advanceApplicationStage(
  db: Db,
  input: AdvanceStageInput,
): Promise<{ success: boolean; error?: string }> {
  const newStatus = STAGE_TO_STATUS[input.toStage] ?? "submitted";

  const { error: updateError } = await db
    .from("applications")
    .update({
      current_stage:    input.toStage,
      status:           newStatus,
      stage_updated_at: new Date().toISOString(),
    })
    .eq("id", input.applicationId);

  if (updateError) {
    console.error("[Timeline] stage update failed:", updateError.message);
    return { success: false, error: updateError.message };
  }

  await recordTimelineEvent(db, {
    applicationId: input.applicationId,
    stage:         input.toStage,
    description:   input.studentMessage ?? undefined,
    createdBy:     input.actorId,
    createdByRole: input.actorRole,
  });

  const notif = STAGE_NOTIFICATION[input.toStage];
  if (notif) {
    await notifyUser(db, {
      userId:        input.studentId,
      applicationId: input.applicationId,
      title:         notif.title,
      message:       input.studentMessage || notif.message,
      type:          notif.type,
    });
  }

  await logAudit(db, {
    applicationId: input.applicationId,
    actorId:       input.actorId,
    actorRole:     input.actorRole,
    action:        input.auditAction ?? "stage_changed",
    fromValue:     input.fromStage,
    toValue:       input.toStage,
    comments:      input.studentMessage ?? null,
    metadata:      input.auditMetadata,
  });

  return { success: true };
}
