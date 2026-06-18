// Sprint 17 — Finance & Payment domain types.
//
// Scope (PR-A foundation):
//   - Invoice (generated or uploaded)
//   - Invoice line items
//   - Payment attempt (bank_transfer or wise)
//   - Payment proof (student-uploaded transfer evidence)
//   - Official receipt (generated or uploaded — distinct from payment proof)
//   - College payment settings
//   - Course fee schedule template
//
// Phase 2 (Stripe / installments / refunds) is schema-reserved on
// PaymentAttempt and StudentInvoice but not active in Sprint 17.

// ─── Enums ────────────────────────────────────────────────────────────────────

export type PaymentMethod = "bank_transfer" | "wise";

export type PaymentProvider = "manual" | "stripe"; // 'stripe' reserved for Phase 2

export type Currency = "SGD" | "USD" | "INR" | "GBP" | "EUR" | "AUD";

export type InvoiceSource = "generated" | "uploaded";

// Invoice-level fee category (Sprint 19). Distinct from InvoiceLineType, which
// is line-level. fee_type is the source of truth for stage routing on the
// payment-verify route. Nullable on legacy rows (treated as application_fee).
export type InvoiceFeeType = "application_fee" | "tuition_fee" | "other";

export const INVOICE_FEE_TYPE_LABEL: Record<InvoiceFeeType, string> = {
  application_fee: "Application Fee",
  tuition_fee:     "Tuition Fee",
  other:           "Other",
};

export const INVOICE_FEE_TYPE_META: Record<
  InvoiceFeeType,
  { label: string; short: string; color: string }
> = {
  application_fee: { label: "Application Fee", short: "APP FEE", color: "text-pathBlue-400 bg-pathBlue-500/10 border-pathBlue-500/25" },
  tuition_fee:     { label: "Tuition Fee",     short: "TUITION", color: "text-gold-400 bg-gold-400/10 border-gold-400/25" },
  other:           { label: "Other",           short: "OTHER",   color: "text-white/50 bg-white/[0.05] border-white/[0.10]" },
};

export type InvoiceStatus =
  | "draft"
  | "pending"
  | "under_verification"
  | "paid"
  | "partially_paid"
  | "payment_action_required"
  | "void"
  | "refunded";

export type InvoiceLineType =
  | "tuition"
  | "application_fee"
  | "enrollment_fee"
  | "other"
  // Reserved for Phase 2 — accepted by schema, no UI in Sprint 17.
  | "scholarship"
  | "discount"
  | "late_fee"
  | "tax";

export type PaymentAttemptStatus =
  | "initiated"
  | "proof_submitted"
  | "verified"
  | "rejected"
  | "info_requested"
  | "expired";

export type OfficialReceiptSource = "generated" | "uploaded";

// ─── Constants ────────────────────────────────────────────────────────────────

export const ALLOWED_PROOF_MIME = [
  "application/pdf",
  "image/png",
  "image/jpeg",
] as const;

export type AllowedProofMime = typeof ALLOWED_PROOF_MIME[number];

export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

// ─── Status metadata (label + colour only; no emojis) ────────────────────────

export const INVOICE_STATUS_META: Record<
  InvoiceStatus,
  { label: string; color: string }
> = {
  draft:                   { label: "Draft",              color: "text-white/40 bg-white/[0.05] border-white/[0.10]" },
  pending:                 { label: "Awaiting Payment",   color: "text-orange-400 bg-orange-500/10 border-orange-400/25" },
  under_verification:      { label: "Under Verification", color: "text-pathBlue-400 bg-pathBlue-500/10 border-pathBlue-500/25" },
  paid:                    { label: "Paid",               color: "text-emerald-400 bg-emerald-500/10 border-emerald-400/25" },
  partially_paid:          { label: "Partially Paid",     color: "text-amber-400 bg-amber-500/10 border-amber-400/25" },
  payment_action_required: { label: "Action Required",    color: "text-red-400 bg-red-500/10 border-red-400/25" },
  void:                    { label: "Voided",             color: "text-white/40 bg-white/[0.05] border-white/[0.09]" },
  refunded:                { label: "Refunded",           color: "text-white/40 bg-white/[0.05] border-white/[0.09]" },
};

export const PAYMENT_ATTEMPT_STATUS_META: Record<
  PaymentAttemptStatus,
  { label: string; color: string }
> = {
  initiated:       { label: "Initiated",       color: "text-white/50 bg-white/[0.05] border-white/[0.10]" },
  proof_submitted: { label: "Proof Submitted", color: "text-pathBlue-400 bg-pathBlue-500/10 border-pathBlue-500/25" },
  verified:        { label: "Verified",        color: "text-emerald-400 bg-emerald-500/10 border-emerald-400/25" },
  rejected:        { label: "Rejected",        color: "text-red-400 bg-red-500/10 border-red-400/25" },
  info_requested:  { label: "Info Requested",  color: "text-gold-400 bg-gold-400/10 border-gold-400/25" },
  expired:         { label: "Expired",         color: "text-white/40 bg-white/[0.05] border-white/[0.09]" },
};

export const INVOICE_LINE_TYPE_LABEL: Record<InvoiceLineType, string> = {
  tuition:         "Tuition Fee",
  application_fee: "Application Fee",
  enrollment_fee:  "Enrollment Fee",
  other:           "Other",
  scholarship:     "Scholarship",
  discount:        "Discount",
  late_fee:        "Late Fee",
  tax:             "Tax",
};

// ─── Row shapes (mirrors public.* tables) ────────────────────────────────────

export interface CollegePaymentSettings {
  id:                              string;
  college_id:                      string;

  bank_transfer_enabled:           boolean;
  bank_name:                       string | null;
  bank_account_name:               string | null;
  bank_account_number:             string | null;
  bank_swift_code:                 string | null;
  bank_branch_code:                string | null;
  bank_country:                    string | null;
  bank_currency:                   string | null;
  bank_payment_instructions:       string | null;

  wise_enabled:                    boolean;
  wise_recipient_name:             string | null;
  wise_recipient_email:            string | null;
  wise_currency:                   string | null;
  wise_instructions:               string | null;

  finance_contact_name:            string | null;
  finance_email:                   string | null;
  finance_phone:                   string | null;
  finance_whatsapp:                string | null;
  finance_notes:                   string | null;

  // Phase 2 schema slots — present but not used in Sprint 17.
  stripe_enabled:                  boolean;
  stripe_connected_account_id:     string | null;
  stripe_charges_enabled:          boolean;
  stripe_payouts_enabled:          boolean;
  accounting_webhook_url:          string | null;

  updated_by:                      string | null;
  created_at:                      string;
  updated_at:                      string;
}

export interface CourseFeeScheduleLine {
  type:         InvoiceLineType;
  amount_cents: number;
  currency:     Currency;
  description?: string;
}

export interface CourseFeeSchedule {
  id:              string;
  course_id:       string;
  name:            string;
  is_default:      boolean;
  line_items:      CourseFeeScheduleLine[];
  due_offset_days: number;
  created_by:      string | null;
  created_at:      string;
  updated_at:      string;
}

export interface StudentInvoice {
  id:                       string;
  public_id:                string;        // e.g. "DIM-INV-2026-0001"
  application_id:           string;
  student_id:               string;
  college_id:               string;
  course_id:                string;
  source:                   InvoiceSource;
  fee_type:                 InvoiceFeeType | null;   // Sprint 19; null on legacy rows
  status:                   InvoiceStatus;
  amount_cents:             number;        // sum of line items (denormalised)
  currency:                 Currency;
  due_date:                 string | null;
  description:              string | null;
  file_path:                string | null; // bucket: invoices
  external_invoice_number:  string | null; // for uploaded source — college's own ref
  payment_methods_allowed:  PaymentMethod[];
  issued_at:                string | null;
  paid_at:                  string | null;
  voided_at:                string | null;
  voided_by:                string | null;
  void_reason:              string | null;

  // Sprint 22 — refund columns
  refunded_at:              string | null;
  refunded_by:              string | null;
  refund_reason:            string | null;
  refunded_amount_cents:    number | null;

  // Schema slots for future re-issue chain + installments.
  supersedes_invoice_id:    string | null;
  payment_plan_id:          string | null;

  created_by:               string;
  metadata:                 Record<string, unknown>;
  created_at:               string;
  updated_at:               string;
}

export interface InvoiceLineItem {
  id:           string;
  invoice_id:   string;
  line_type:    InvoiceLineType;
  description:  string;
  amount_cents: number;    // negative allowed for scholarship/discount
  currency:     Currency;
  sort_order:   number;
  metadata:     Record<string, unknown>;
  created_at:   string;
}

export interface PaymentAttempt {
  id:                     string;
  invoice_id:             string;
  application_id:         string;
  student_id:             string;
  college_id:             string;

  payment_method:         PaymentMethod;
  provider:               PaymentProvider;
  status:                 PaymentAttemptStatus;
  payment_reference:      string;  // e.g. "DIM-INV-2026-0001-01-K"

  invoice_amount_cents:   number | null;
  invoice_currency:       string | null;
  paid_amount_cents:      number | null;
  paid_currency:          string | null;
  received_amount_cents:  number | null;
  received_currency:      string | null;
  fx_rate:                number | null;
  payment_date:           string | null;

  verified_by:            string | null;
  verified_at:            string | null;
  rejection_reason:       string | null;
  info_request_message:   string | null;
  reconciliation_memo:    string | null;
  assigned_to:            string | null;

  // Phase 2 schema slots.
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id:   string | null;

  metadata:               Record<string, unknown>;
  created_at:             string;
  updated_at:             string;
}

export interface PaymentProof {
  id:                  string;
  payment_attempt_id:  string;
  invoice_id:          string;
  uploaded_by:         string;
  file_path:           string;
  file_name:           string;
  file_mime:           AllowedProofMime;
  file_size_bytes:     number;
  file_hash:           string | null;     // SHA-256 — for duplicate detection
  receipt_reference:   string | null;
  receipt_amount_cents:number | null;
  receipt_currency:    string | null;
  payment_date:        string | null;
  created_at:          string;
}

export interface OfficialReceipt {
  id:                 string;
  public_id:          string;            // e.g. "DIM-RCP-2026-0001"
  invoice_id:         string;
  payment_attempt_id: string;
  source:             OfficialReceiptSource;
  file_path:          string;            // bucket: official-receipts
  amount_cents:       number;
  currency:           Currency;
  issued_by:          string | null;
  issued_at:          string;
  notes:              string | null;
  metadata:           Record<string, unknown>;
  created_at:         string;
}
