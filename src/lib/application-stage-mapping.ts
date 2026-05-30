import type { ApplicationStage } from "@/types/timeline";

// ─── Stage → legacy status ────────────────────────────────────────────────────
// Keep the old `status` column in sync when `current_stage` changes.
// Single source of truth — import everywhere instead of duplicating.
export const STAGE_TO_STATUS: Record<ApplicationStage, string> = {
  application_submitted:   "submitted",
  documents_pending:       "docs_required",
  documents_uploaded:      "under_review",
  documents_under_review:  "under_review",
  documents_verified:      "under_review",
  offer_letter_processing: "under_review",
  offer_letter_ready:      "offer_ready",
  fee_payment_pending:     "offer_ready",
  ipa_processing:          "ipa_processing",
  approved:                "approved",
  arrival_preparation:     "approved",
  arrived_singapore:       "approved",
  rejected:                "rejected",
  withdrawn:               "rejected",
};

// ─── Legacy status → current_stage ───────────────────────────────────────────
// Used when normalising rows that have status but no current_stage.
export const STATUS_TO_STAGE: Record<string, ApplicationStage> = {
  approved:       "approved",
  rejected:       "rejected",
  ipa_processing: "ipa_processing",
  offer_ready:    "offer_letter_ready",
  docs_required:  "documents_pending",
  under_review:   "documents_under_review",
  submitted:      "application_submitted",
};

// ─── Normalise a row that may have current_stage OR only status ───────────────
export function resolveStage(
  current_stage: string | null | undefined,
  status: string | null | undefined,
): ApplicationStage {
  return (
    (current_stage as ApplicationStage | undefined) ||
    STATUS_TO_STAGE[status ?? "submitted"] ||
    "application_submitted"
  );
}
