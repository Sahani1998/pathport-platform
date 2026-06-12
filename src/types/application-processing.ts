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

export type IpaStatus = "submitted" | "pending" | "approved" | "rejected";

export interface IpaRecord {
  id:             string;
  application_id: string;
  uploaded_by:    string | null;
  file_path:      string;
  file_name:      string;
  file_size:      number | null;
  status:         IpaStatus;
  notes:          string | null;
  decided_at:     string | null;
  created_at:     string;
  updated_at:     string;
}

export const IPA_STATUS_META: Record<IpaStatus, { label: string; color: string }> = {
  submitted: { label: "Submitted to ICA", color: "text-pathBlue-400 bg-pathBlue-500/10 border-pathBlue-500/25" },
  pending:   { label: "Pending",          color: "text-gold-400     bg-gold-400/10     border-gold-400/25"     },
  approved:  { label: "Approved",         color: "text-emerald-400  bg-emerald-500/10  border-emerald-400/25"  },
  rejected:  { label: "Rejected",         color: "text-red-400      bg-red-500/10      border-red-400/25"      },
};
