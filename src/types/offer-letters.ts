// ─── Lifecycle ────────────────────────────────────────────────────────────────
// Universal document lifecycle: draft → issued → superseded / archived / void.
// Students only see status='issued'. Anything else is institution-internal.

export type OfferLetterStatus =
  | "draft"
  | "issued"
  | "superseded"
  | "archived"
  | "void";

export const OFFER_LETTER_STATUS_META: Record<
  OfferLetterStatus,
  { label: string; color: string; description: string }
> = {
  draft: {
    label:       "Draft",
    color:       "text-white/55     bg-white/[0.05]    border-white/[0.12]",
    description: "Internal only. Student cannot see this version yet.",
  },
  issued: {
    label:       "Issued",
    color:       "text-emerald-400  bg-emerald-500/10  border-emerald-400/25",
    description: "Visible to the student. The active letter for this application.",
  },
  superseded: {
    label:       "Superseded",
    color:       "text-white/40     bg-white/[0.04]    border-white/[0.10]",
    description: "Replaced by a newer issued letter. Retained for audit.",
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

export interface OfferLetter {
  id:                string;
  application_id:    string;
  uploaded_by:       string | null;
  file_path:         string;
  file_name:         string;
  file_size:         number | null;
  version:           number;
  notes:             string | null;
  expiry_date:       string | null;
  // Lifecycle
  status:            OfferLetterStatus;
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
  // Student decision (orthogonal to lifecycle)
  student_decision:  "accepted" | "declined" | null;
  decision_at:       string | null;
  decision_comment:  string | null;
  created_at:        string;
  updated_at:        string;
}

// Joined with uploader profile name for display
export interface OfferLetterWithUploader extends OfferLetter {
  uploader_name: string | null;
}
