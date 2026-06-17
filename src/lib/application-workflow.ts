// ═══════════════════════════════════════════════════════════════════════════
// PathPort — Application Workflow Engine (Sprint 15)
//
// Single source of truth for the admissions pipeline. Stage definitions live
// in @/types/timeline (STAGE_META) and the legacy-status sync lives in
// @/lib/application-stage-mapping — both are re-exported here so consumers
// import ONE module instead of duplicating mappings.
//
// Pipeline (happy path):
//   application_submitted → documents_pending → documents_uploaded
//   → documents_under_review → documents_verified → offer_letter_processing
//   → offer_letter_ready → offer_letter_accepted → fee_payment_pending
//   → ipa_processing → approved (IPA approved) → arrival_preparation
//   → arrived_singapore → enrolled → internship_eligible → completed
// Off-path: rejected, withdrawn
// ═══════════════════════════════════════════════════════════════════════════

import type { ApplicationStage } from "@/types/timeline";
import type { EmailTemplate } from "@/lib/email/templates";

export type { ApplicationStage, StageMeta } from "@/types/timeline";
export { STAGE_META, TIMELINE_STAGES, getStageMeta, STAGE_NOTIFICATION } from "@/types/timeline";
export { STAGE_TO_STATUS, STATUS_TO_STAGE, resolveStage } from "@/lib/application-stage-mapping";

// ─── Progress percentage per stage ───────────────────────────────────────────
// Anchors: Submitted 10 · Review 25 · Documents 40 · Offer 60 · IPA 80 · Enrolled 100
export const STAGE_PROGRESS: Record<ApplicationStage, number> = {
  application_submitted:        10,
  documents_pending:            25,
  documents_uploaded:           30,
  documents_under_review:       35,
  documents_verified:           40,
  offer_letter_processing:      50,
  offer_letter_ready:           60,
  offer_letter_accepted:        65,
  fee_payment_pending:          70,
  ipa_processing:               80,
  approved:                     85,
  tuition_fee_payment_pending:  88,
  arrival_preparation:          90,
  arrived_singapore:            95,
  enrolled:                     100,
  internship_eligible:          100,
  completed:                    100,
  rejected:                     0,
  withdrawn:                    0,
};

export function getStageProgress(stage: ApplicationStage): number {
  return STAGE_PROGRESS[stage] ?? 0;
}

// ─── Allowed transitions ─────────────────────────────────────────────────────
// Forward moves plus controlled back-steps (e.g. re-requesting documents).
// rejected is reachable from every active stage; withdrawn is student-driven
// and handled by the withdraw endpoint.
export const ALLOWED_TRANSITIONS: Record<ApplicationStage, ApplicationStage[]> = {
  application_submitted:        ["documents_pending", "documents_uploaded", "documents_under_review", "rejected", "withdrawn"],
  documents_pending:            ["documents_uploaded", "documents_under_review", "rejected", "withdrawn"],
  documents_uploaded:           ["documents_under_review", "documents_pending", "rejected", "withdrawn"],
  documents_under_review:       ["documents_verified", "documents_pending", "rejected", "withdrawn"],
  documents_verified:           ["offer_letter_processing", "offer_letter_ready", "documents_pending", "rejected", "withdrawn"],
  offer_letter_processing:      ["offer_letter_ready", "documents_pending", "rejected", "withdrawn"],
  offer_letter_ready:           ["offer_letter_accepted", "offer_letter_processing", "rejected", "withdrawn"],
  offer_letter_accepted:        ["fee_payment_pending", "ipa_processing", "rejected", "withdrawn"],
  fee_payment_pending:          ["ipa_processing", "rejected", "withdrawn"],
  ipa_processing:               ["approved", "fee_payment_pending", "rejected", "withdrawn"],
  // approved → tuition gate (new) OR direct arrival (legacy / admin override)
  approved:                     ["tuition_fee_payment_pending", "arrival_preparation", "arrived_singapore", "rejected"],
  tuition_fee_payment_pending:  ["arrival_preparation", "approved", "rejected", "withdrawn"],
  arrival_preparation:          ["arrived_singapore", "rejected"],
  arrived_singapore:            ["enrolled", "rejected"],
  enrolled:                     ["internship_eligible", "completed"],
  internship_eligible:          ["completed"],
  completed:                    [],
  rejected:                     ["application_submitted"],   // admin re-open
  withdrawn:                    ["application_submitted"],   // admin re-open
};

export function canTransition(from: ApplicationStage, to: ApplicationStage): boolean {
  if (from === to) return false;
  return (ALLOWED_TRANSITIONS[from] ?? []).includes(to);
}

// ─── Terminal / activity helpers ─────────────────────────────────────────────
export const TERMINAL_STAGES: ApplicationStage[] = ["completed", "rejected", "withdrawn"];
// Stages that count as "IPA approved" or later. `tuition_fee_payment_pending`
// is post-IPA-approval (student has been approved, is now paying tuition) and
// MUST be included in approval/conversion metrics. Mirrored in
// sprint20a_analytics_fix.sql — keep in sync.
export const APPROVED_STAGES: ApplicationStage[] = [
  "approved", "tuition_fee_payment_pending", "arrival_preparation",
  "arrived_singapore", "enrolled", "internship_eligible", "completed",
];

export function isTerminalStage(stage: ApplicationStage): boolean {
  return TERMINAL_STAGES.includes(stage);
}

export function isApprovedStage(stage: ApplicationStage): boolean {
  return APPROVED_STAGES.includes(stage);
}

// Stages where a student may still withdraw their application.
export function isWithdrawableStage(stage: ApplicationStage): boolean {
  return ![
    ...APPROVED_STAGES, "rejected", "withdrawn",
    "offer_letter_ready", "offer_letter_accepted", "fee_payment_pending", "ipa_processing",
  ].includes(stage);
}

// ─── Stage → specific email template ─────────────────────────────────────────
// Stages with a dedicated template send it; all others fall back to the
// generic application-update email. Centralised so the stage route, the
// offer-letter routes, and the IPA routes never duplicate this mapping.
export const STAGE_EMAIL: Partial<Record<ApplicationStage, EmailTemplate>> = {
  documents_pending:            "documents_requested",
  documents_verified:           "documents_approved",
  offer_letter_ready:           "offer_letter_available",
  offer_letter_accepted:        "offer_letter_accepted",
  fee_payment_pending:          "fee_payment_reminder",
  ipa_processing:               "ipa_processing",
  approved:                     "ipa_approved",
  tuition_fee_payment_pending:  "fee_payment_reminder",   // reuse for now; dedicated template in a later sprint
  arrival_preparation:          "arrival_preparation",
  enrolled:                     "enrollment_completed",
};

// ─── Display helper: short application number from UUID ──────────────────────
export function formatApplicationNumber(id: string): string {
  return `PP-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}
