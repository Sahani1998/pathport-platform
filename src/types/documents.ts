// ─── Document types ────────────────────────────────────────────────────────────

export type DocumentStatus = "pending" | "verified" | "rejected" | "reupload_required";

export type DocumentType =
  | "passport"
  | "certificate"
  | "transcript"
  | "cv"
  | "photo"
  | "financial"
  | "english"
  | "other";

export interface DocumentTypeMeta {
  value:       DocumentType;
  label:       string;
  description: string;
  required:    boolean;
  accept:      string;   // HTML file input accept attribute
}

export const DOCUMENT_TYPES: DocumentTypeMeta[] = [
  { value: "passport",    label: "Passport",              description: "Valid passport — photo page clearly visible",             required: true,  accept: ".pdf,.jpg,.jpeg,.png" },
  { value: "certificate", label: "Education Certificate", description: "10th / 12th school leaving certificate",                 required: true,  accept: ".pdf,.jpg,.jpeg,.png" },
  { value: "transcript",  label: "Transcript / Marksheet",description: "Official academic transcripts or marksheets",            required: true,  accept: ".pdf,.jpg,.jpeg,.png" },
  { value: "cv",          label: "Resume / CV",           description: "Updated curriculum vitae or resume",                     required: true,  accept: ".pdf,.jpg,.jpeg,.png" },
  { value: "photo",       label: "Passport-size Photo",   description: "Recent white-background passport-size photograph",       required: true,  accept: ".jpg,.jpeg,.png"      },
  { value: "financial",   label: "Financial Proof",       description: "Bank statement or sponsorship letter (last 3 months)",   required: true,  accept: ".pdf,.jpg,.jpeg,.png" },
  { value: "english",     label: "English Test Result",   description: "IELTS / TOEFL / Duolingo — if available (optional)",    required: false, accept: ".pdf,.jpg,.jpeg,.png" },
  { value: "other",       label: "Other Supporting Doc",  description: "Any additional document requested by the institution",   required: false, accept: ".pdf,.jpg,.jpeg,.png" },
];

export const REQUIRED_DOC_TYPES = DOCUMENT_TYPES.filter(d => d.required).map(d => d.value);

// ─── Database row ──────────────────────────────────────────────────────────────

export interface StudentDocument {
  id:               string;
  student_id:       string;
  application_id:   string | null;
  document_type:    DocumentType;
  file_name:        string;
  file_url:         string;   // storage path
  file_path:        string;
  mime_type:        string | null;
  file_size:        number | null;
  status:           DocumentStatus;
  rejection_reason: string | null;
  uploaded_at:      string;
  reviewed_at:      string | null;
  reviewed_by:      string | null;
  // Dedup: only the latest upload per (application_id, document_type) is
  // is_active=true. Historical rows retained for audit + review history.
  is_active:        boolean;
}

// With reviewer profile joined
export interface StudentDocumentWithReviewer extends StudentDocument {
  reviewer?: { full_name: string | null; email: string } | null;
}

// ─── Status metadata ──────────────────────────────────────────────────────────

export const DOCUMENT_STATUS_META: Record<DocumentStatus, { label: string; color: string }> = {
  pending:           { label: "Pending Review",    color: "text-gold-400    bg-gold-400/10    border-gold-400/25"    },
  verified:          { label: "Verified",          color: "text-emerald-400 bg-emerald-500/10 border-emerald-400/25" },
  rejected:          { label: "Rejected",          color: "text-red-400     bg-red-500/10     border-red-400/25"      },
  reupload_required: { label: "Re-upload Required",color: "text-orange-400  bg-orange-500/10  border-orange-400/25"  },
};

// ─── Review history row ───────────────────────────────────────────────────────

export interface DocumentReview {
  id:          string;
  document_id: string;
  reviewer_id: string | null;
  status:      DocumentStatus;
  comment:     string | null;
  created_at:  string;
  reviewer?:   { full_name: string | null } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function fmtFileSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
