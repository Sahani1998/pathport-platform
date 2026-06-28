// ═══════════════════════════════════════════════════════════════════════════
// PathPort — Candidacy Lifecycle Helpers (Sprint E2)
//
// Single source of truth for every candidacy state transition. Wires the full
// quartet of side effects — timeline event, in-app notification, transactional
// email, and audit log — so no API route re-implements them.
//
// All side effects are non-fatal: failures log and continue. The primary
// candidacy update must already have succeeded before these run.
// ═══════════════════════════════════════════════════════════════════════════

import type { SupabaseClient } from "@supabase/supabase-js";
import { notifyUser } from "@/lib/application-timeline";
import { sendTemplatedEmail } from "@/lib/email/send";
import type { EmailTemplate } from "@/lib/email/templates";
import type { NotificationType } from "@/types/timeline";

type Db = SupabaseClient;

// ─── Candidacy status model ──────────────────────────────────────────────────

export type CandidacyStatus =
  | "applied"
  | "under_review"
  | "shortlisted"
  | "interview_scheduled"
  | "interview_completed"
  | "offer_extended"
  | "offer_accepted"
  | "offer_declined"
  | "hired"
  | "started_internship"
  | "completed_internship"
  | "withdrawn"
  | "rejected"
  | "cancelled";

// Employer-driven transitions. Student-driven (withdraw / accept / decline)
// are handled in their own routes with their own guards.
export const EMPLOYER_TRANSITIONS: Record<CandidacyStatus, CandidacyStatus[]> = {
  applied:              ["under_review", "shortlisted", "rejected"],
  under_review:         ["shortlisted", "rejected"],
  shortlisted:          ["interview_scheduled", "rejected"],
  interview_scheduled:  ["interview_completed", "rejected"],
  interview_completed:  ["offer_extended", "rejected"],
  offer_extended:       [],                       // waits on student accept/decline
  offer_accepted:       ["hired"],
  offer_declined:       [],
  hired:                ["started_internship"],
  started_internship:   ["completed_internship"],
  completed_internship: [],
  withdrawn:            [],
  rejected:             [],
  cancelled:            [],
};

export interface CandidacyStatusMeta {
  label:    string;
  step:     number;
  color:    string;   // tailwind class string
  emoji:    string;
  terminal: boolean;
}

export const CANDIDACY_STATUS_META: Record<CandidacyStatus, CandidacyStatusMeta> = {
  applied:              { label: "Applied",               step: 1,  emoji: "📨", color: "text-white/60   bg-white/[0.05]    border-white/[0.10]",  terminal: false },
  under_review:         { label: "Under Review",          step: 2,  emoji: "🔍", color: "text-pathBlue-400 bg-pathBlue-500/10 border-pathBlue-400/25", terminal: false },
  shortlisted:          { label: "Shortlisted",           step: 3,  emoji: "⭐", color: "text-pathBlue-400 bg-pathBlue-500/10 border-pathBlue-400/25", terminal: false },
  interview_scheduled:  { label: "Interview Scheduled",   step: 4,  emoji: "📅", color: "text-gold-400   bg-gold-400/10     border-gold-400/25",   terminal: false },
  interview_completed:  { label: "Interview Completed",   step: 5,  emoji: "✅", color: "text-gold-400   bg-gold-400/10     border-gold-400/25",   terminal: false },
  offer_extended:       { label: "Offer Extended",        step: 6,  emoji: "🎊", color: "text-emerald-400 bg-emerald-500/10  border-emerald-400/25", terminal: false },
  offer_accepted:       { label: "Offer Accepted",        step: 7,  emoji: "🤝", color: "text-emerald-400 bg-emerald-500/10  border-emerald-400/25", terminal: false },
  offer_declined:       { label: "Offer Declined",        step: -1, emoji: "🚫", color: "text-orange-400 bg-orange-500/10   border-orange-400/25", terminal: true  },
  hired:                { label: "Hired",                 step: 8,  emoji: "🎉", color: "text-emerald-400 bg-emerald-500/15  border-emerald-400/30", terminal: false },
  started_internship:   { label: "Internship Started",    step: 9,  emoji: "🚀", color: "text-emerald-400 bg-emerald-500/15  border-emerald-400/30", terminal: false },
  completed_internship: { label: "Internship Completed",  step: 10, emoji: "🏁", color: "text-gold-400   bg-gold-400/15     border-gold-400/35",   terminal: true  },
  withdrawn:            { label: "Withdrawn",             step: -1, emoji: "↩️", color: "text-white/30   bg-white/[0.02]    border-white/[0.05]",  terminal: true  },
  rejected:             { label: "Not Selected",          step: -1, emoji: "—",  color: "text-red-400/60 bg-red-500/[0.05]  border-red-400/15",    terminal: true  },
  cancelled:            { label: "Cancelled",             step: -1, emoji: "✕",  color: "text-white/30   bg-white/[0.02]    border-white/[0.05]",  terminal: true  },
};

// ─── Notification + email mapping per target status ──────────────────────────

interface StudentNotice {
  title:        string;
  message:      string;
  type:         NotificationType;
  emailTemplate: EmailTemplate | null;
}

const STUDENT_NOTICE: Partial<Record<CandidacyStatus, StudentNotice>> = {
  shortlisted: {
    title: "You've been shortlisted! 🎉",
    message: "An employer has shortlisted you for their position.",
    type: "application_update",
    emailTemplate: "candidacy_shortlisted",
  },
  interview_scheduled: {
    title: "Interview Scheduled 📅",
    message: "Your interview has been scheduled. Check the details on your internships page.",
    type: "application_update",
    emailTemplate: "interview_scheduled",
  },
  offer_extended: {
    title: "You've received an offer! 🎊",
    message: "An employer has extended an internship offer. Review and respond on your internships page.",
    type: "application_update",
    emailTemplate: "offer_extended",
  },
  hired: {
    title: "Internship confirmed! 🚀",
    message: "Congratulations! Your internship placement is confirmed.",
    type: "application_update",
    emailTemplate: "hired_welcome",
  },
  rejected: {
    title: "Application update",
    message: "Thank you for your interest. The employer has moved forward with other candidates.",
    type: "application_update",
    emailTemplate: "candidacy_rejected",
  },
  started_internship: {
    title: "Internship started 🚀",
    message: "Your internship has officially started. All the best!",
    type: "application_update",
    emailTemplate: null,
  },
  completed_internship: {
    title: "Internship completed 🏁",
    message: "Congratulations on completing your internship!",
    type: "application_update",
    emailTemplate: null,
  },
};

// ─── Timeline event ──────────────────────────────────────────────────────────

export interface CandidacyTimelineInput {
  candidacyId:    string;
  status:         CandidacyStatus;
  title?:         string;
  description?:   string | null;
  createdBy:      string | null;
  createdByRole:  string | null;
  visibleToStudent?: boolean;
  metadata?:      Record<string, unknown>;
}

export async function recordCandidacyTimeline(db: Db, input: CandidacyTimelineInput): Promise<boolean> {
  const meta = CANDIDACY_STATUS_META[input.status];
  const { error } = await db.from("candidacy_timeline_events").insert({
    candidacy_id:       input.candidacyId,
    status:             input.status,
    title:              input.title ?? meta.label,
    description:        input.description ?? null,
    created_by:         input.createdBy,
    created_by_role:    input.createdByRole,
    visible_to_student: input.visibleToStudent ?? true,
    metadata:           input.metadata ?? {},
  });
  if (error) console.error("[Candidacy] timeline insert failed (non-fatal):", error.message);
  return !error;
}

// ─── Generic employer audit ──────────────────────────────────────────────────

export interface EmployerAuditInput {
  companyId?:   string | null;
  entityType:   "company" | "posting" | "candidacy" | "recruiter" | "office" | "department" | "media" | "verification";
  entityId:     string;
  actorId:      string | null;
  actorRole:    string | null;
  action:       string;
  fromValue?:   string | null;
  toValue?:     string | null;
  reason?:      string | null;
  comments?:    string | null;
  metadata?:    Record<string, unknown>;
}

export async function logEmployerAudit(db: Db, input: EmployerAuditInput): Promise<boolean> {
  const { error } = await db.from("employer_audit_log").insert({
    company_id:  input.companyId ?? null,
    entity_type: input.entityType,
    entity_id:   input.entityId,
    actor_id:    input.actorId,
    actor_role:  input.actorRole,
    action:      input.action,
    from_value:  input.fromValue ?? null,
    to_value:    input.toValue ?? null,
    reason:      input.reason ?? null,
    comments:    input.comments ?? null,
    metadata:    input.metadata ?? {},
  });
  if (error) console.error("[Employer] audit insert failed (non-fatal):", error.message);
  return !error;
}

// ─── Composite: advance a candidacy + all side effects ───────────────────────

export interface AdvanceCandidacyInput {
  candidacyId:   string;
  studentId:     string;
  postingTitle:  string;
  companyName?:  string | null;
  companyId?:    string | null;
  fromStatus:    CandidacyStatus;
  toStatus:      CandidacyStatus;
  actorId:       string | null;
  actorRole:     string | null;
  // optional email context
  studentEmail?: string | null;
  studentName?:  string | null;
  interviewDate?: string | null;
  interviewMode?: string | null;
  interviewLocation?: string | null;
  allowance?:    string | null;
  startDate?:    string | null;
  responseDeadline?: string | null;
  reason?:       string | null;
}

// Fires notification + email + timeline + audit for a transition that has
// ALREADY been written to the candidacies row. Never throws.
export async function fireCandidacyTransition(db: Db, input: AdvanceCandidacyInput): Promise<void> {
  const notice = STUDENT_NOTICE[input.toStatus];

  // 1. Timeline (always)
  await recordCandidacyTimeline(db, {
    candidacyId:   input.candidacyId,
    status:        input.toStatus,
    description:   notice?.message ?? null,
    createdBy:     input.actorId,
    createdByRole: input.actorRole,
  });

  // 2. In-app notification (when there's a student-facing notice)
  if (notice) {
    await notifyUser(db, {
      userId:  input.studentId,
      title:   notice.title,
      message: notice.message,
      type:    notice.type,
    });
  }

  // 3. Transactional email (best effort, only when configured + template exists)
  if (notice?.emailTemplate && input.studentEmail) {
    await sendTemplatedEmail({
      to:       input.studentEmail,
      template: notice.emailTemplate,
      context: {
        name:              input.studentName ?? undefined,
        postingTitle:      input.postingTitle,
        companyName:       input.companyName ?? undefined,
        interviewDate:     input.interviewDate ?? undefined,
        interviewMode:     input.interviewMode ?? undefined,
        interviewLocation: input.interviewLocation ?? undefined,
        allowance:         input.allowance ?? undefined,
        startDate:         input.startDate ?? undefined,
        responseDeadline:  input.responseDeadline ?? undefined,
      },
      userId: input.studentId,
    });
  }

  // 4. Audit log (always)
  await logEmployerAudit(db, {
    companyId:  input.companyId ?? null,
    entityType: "candidacy",
    entityId:   input.candidacyId,
    actorId:    input.actorId,
    actorRole:  input.actorRole,
    action:     "candidacy_status_changed",
    fromValue:  input.fromStatus,
    toValue:    input.toStatus,
    reason:     input.reason ?? null,
  });
}
