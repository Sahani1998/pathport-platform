// ─── Sprint 15: Application Processing types ──────────────────────────────────

export type DocumentRequestStatus   = "pending" | "fulfilled" | "cancelled";
export type DocumentRequestPriority = "low" | "normal" | "high" | "urgent";

export interface DocumentRequest {
  id:                       string;
  application_id:           string;
  student_id:               string;
  requested_by:             string | null;
  document_type:            string;
  title:                    string;
  description:              string | null;
  deadline:                 string | null;
  priority:                 DocumentRequestPriority;
  status:                   DocumentRequestStatus;
  fulfilled_at:             string | null;
  fulfilled_by_document_id: string | null;
  created_at:               string;
  updated_at:               string;
}

export const PRIORITY_META: Record<DocumentRequestPriority, { label: string; color: string }> = {
  low:    { label: "Low",    color: "text-white/40     bg-white/[0.05]   border-white/[0.10]"   },
  normal: { label: "Normal", color: "text-pathBlue-400 bg-pathBlue-500/10 border-pathBlue-500/25" },
  high:   { label: "High",   color: "text-orange-400   bg-orange-500/10  border-orange-400/25"  },
  urgent: { label: "Urgent", color: "text-red-400      bg-red-500/10     border-red-400/25"     },
};

// ─── Application notes ────────────────────────────────────────────────────────

export interface ApplicationNote {
  id:             string;
  application_id: string;
  author_id:      string | null;
  author_role:    "admin" | "institution";
  content:        string;
  created_at:     string;
  updated_at:     string;
}

export interface ApplicationNoteWithAuthor extends ApplicationNote {
  author_name: string | null;
}

// ─── IPA records ──────────────────────────────────────────────────────────────
// Two orthogonal dimensions:
//   • `status`           — ICA decision (submitted/pending/approved/rejected)
//   • `lifecycle_status` — document lifecycle (draft/issued/superseded/archived/void)
// Students only see rows where lifecycle_status='issued'.

export type IpaStatus = "submitted" | "pending" | "approved" | "rejected";

export type IpaLifecycleStatus =
  | "draft"
  | "issued"
  | "superseded"
  | "archived"
  | "void";

export interface IpaRecord {
  id:                string;
  application_id:    string;
  uploaded_by:       string | null;
  file_path:         string;
  file_name:         string;
  file_size:         number | null;
  status:            IpaStatus;
  lifecycle_status:  IpaLifecycleStatus;
  notes:             string | null;
  decided_at:        string | null;
  issued_at:         string | null;
  issued_by:         string | null;
  superseded_by_id:  string | null;
  superseded_at:     string | null;
  void_reason:       string | null;
  voided_at:         string | null;
  voided_by:         string | null;
  archived_at:       string | null;
  archived_by:       string | null;
  archive_reason:    string | null;
  created_at:        string;
  updated_at:        string;
}

export const IPA_STATUS_META: Record<IpaStatus, { label: string; color: string }> = {
  submitted: { label: "Submitted to ICA", color: "text-pathBlue-400 bg-pathBlue-500/10 border-pathBlue-500/25" },
  pending:   { label: "Pending",          color: "text-gold-400     bg-gold-400/10     border-gold-400/25"     },
  approved:  { label: "Approved",         color: "text-emerald-400  bg-emerald-500/10  border-emerald-400/25"  },
  rejected:  { label: "Rejected",         color: "text-red-400      bg-red-500/10      border-red-400/25"      },
};

export const IPA_LIFECYCLE_META: Record<
  IpaLifecycleStatus,
  { label: string; color: string; description: string }
> = {
  draft: {
    label:       "Draft",
    color:       "text-white/55     bg-white/[0.05]    border-white/[0.12]",
    description: "Internal only. Student cannot see this IPA yet.",
  },
  issued: {
    label:       "Issued",
    color:       "text-emerald-400  bg-emerald-500/10  border-emerald-400/25",
    description: "Visible to the student. The active IPA for this application.",
  },
  superseded: {
    label:       "Superseded",
    color:       "text-white/40     bg-white/[0.04]    border-white/[0.10]",
    description: "Replaced by a newer issued IPA. Retained for audit.",
  },
  archived: {
    label:       "Archived",
    color:       "text-white/35     bg-white/[0.03]    border-white/[0.08]",
    description: "Historical record. Not currently active.",
  },
  void: {
    label:       "Void",
    color:       "text-red-400      bg-red-500/10      border-red-400/25",
    description: "Withdrawn as incorrect. Retained for audit.",
  },
};
