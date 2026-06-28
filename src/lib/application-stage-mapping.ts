import type { ApplicationStage } from "@/types/timeline";
import { getStageMeta } from "@/types/timeline";

// ─── Stage → legacy status ────────────────────────────────────────────────────
// Keep the old `status` column in sync when `current_stage` changes.
// Single source of truth — import everywhere instead of duplicating.
export const STAGE_TO_STATUS: Record<ApplicationStage, string> = {
  application_submitted:        "submitted",
  documents_pending:            "docs_required",
  documents_uploaded:           "under_review",
  documents_under_review:       "under_review",
  documents_verified:           "under_review",
  offer_letter_processing:      "under_review",
  offer_letter_ready:           "offer_ready",
  offer_letter_accepted:        "offer_ready",
  fee_payment_pending:          "offer_ready",
  ipa_processing:               "ipa_processing",
  approved:                     "approved",
  tuition_fee_payment_pending:  "approved",
  arrival_preparation:          "approved",
  arrived_singapore:            "approved",
  enrolled:                     "approved",
  internship_eligible:          "approved",
  completed:                    "approved",
  rejected:                     "rejected",
  withdrawn:                    "rejected",
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

// ─── Internship lifecycle gate ───────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH for "is this student at/past the point where internship
// placement applies". A student becomes internship-relevant once ENROLLED, and
// stays relevant through internship_eligible and completed. Off-path stages
// (rejected/withdrawn → step -1) are never relevant.
//
// Every module — institution Internship Access, student Internship Hub,
// employer eligibility checks, analytics, future reports/AI — MUST derive
// internship relevance from this helper instead of hardcoding stage lists.
export const INTERNSHIP_GATE_STAGE: ApplicationStage = "enrolled";

export function isInternshipRelevant(
  current_stage: string | null | undefined,
  status: string | null | undefined,
): boolean {
  const step     = getStageMeta(resolveStage(current_stage, status)).step;
  const gateStep = getStageMeta(INTERNSHIP_GATE_STAGE).step;
  return step >= gateStep; // gateStep = 15 (enrolled); off-path stages are step -1
}

// ─── Student internship-hub access ───────────────────────────────────────────
// SINGLE SOURCE OF TRUTH for whether a STUDENT may browse/apply to internship
// postings. Distinct from isInternshipRelevant (institution management gate at
// `enrolled`): the student-facing hub opens at `internship_eligible`, but the
// institution's posting_eligibility record overrides — an explicit `eligible`
// grants access early, and `suspended` always revokes it.
export const STUDENT_HUB_GATE_STAGE: ApplicationStage = "internship_eligible";

export function isStudentInternshipEligible(
  eligibilityStatus: string | null | undefined,
  current_stage: string | null | undefined,
  status: string | null | undefined,
): boolean {
  if (eligibilityStatus === "suspended") return false; // explicit suspension always wins
  if (eligibilityStatus === "eligible")  return true;  // explicit grant
  const step     = getStageMeta(resolveStage(current_stage, status)).step;
  const gateStep = getStageMeta(STUDENT_HUB_GATE_STAGE).step;
  return step >= gateStep;
}
