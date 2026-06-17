// ═══════════════════════════════════════════════════════════════════════════
// PathPort — Student Journey Mapping Layer
//
// A dedicated, presentational mapping that collapses the 18 internal
// operational stages (see @/types/timeline STAGE_META) into a simplified
// 10-milestone journey shown ONLY in the student portal.
//
// This layer is read-only and side-effect-free. It NEVER mutates internal
// stages, transitions, payments, invoices, notifications, or analytics.
// Institution and admin portals continue to use the full internal stages.
//
//   Internal stage  ──►  Student milestone
//
// Milestones 4 (Application Fee Paid) and 7 (Tuition Fee Paid) intentionally
// have NO internal stage mapped to them yet — they appear as future
// milestones until the payment-workflow enhancement ships. Because no stage
// maps to them, they can never be the "current" milestone; they complete by
// position once the journey advances past them. When the real application-fee
// / tuition-fee workflow is built, ONLY STAGE_TO_MILESTONE below changes — the
// tracker UI never needs to be redesigned.
// ═══════════════════════════════════════════════════════════════════════════

import type { ApplicationStage } from "@/types/timeline";

export interface StudentMilestone {
  step:  number;   // 1..10
  label: string;
  emoji: string;
}

// The 10 student-facing milestones, in order.
export const STUDENT_MILESTONES: StudentMilestone[] = [
  { step: 1,  label: "Application Submitted", emoji: "📋" },
  { step: 2,  label: "Documents Verified",    emoji: "✅" },
  { step: 3,  label: "Offer Letter Accepted", emoji: "🎊" },
  { step: 4,  label: "Application Fee Paid",  emoji: "💳" },
  { step: 5,  label: "IPA Processing",        emoji: "🪪" },
  { step: 6,  label: "IPA Approved",          emoji: "🎉" },
  { step: 7,  label: "Tuition Fee Paid",      emoji: "💰" },
  { step: 8,  label: "Arrival Preparation",   emoji: "✈️" },
  { step: 9,  label: "Arrived Singapore",     emoji: "🇸🇬" },
  { step: 10, label: "Enrolled",              emoji: "🎓" },
];

export const STUDENT_MILESTONE_COUNT = STUDENT_MILESTONES.length; // 10

// Internal stage → active student-milestone step (1..10).
// Sprint 19: fee_payment_pending now correctly maps to milestone 4
// (Application Fee Paid), and the new tuition_fee_payment_pending stage maps
// to milestone 7 (Tuition Fee Paid).
const STAGE_TO_MILESTONE: Partial<Record<ApplicationStage, number>> = {
  application_submitted:        1,

  documents_pending:            2,
  documents_uploaded:           2,
  documents_under_review:       2,
  documents_verified:           2,

  offer_letter_processing:      3,
  offer_letter_ready:           3,
  offer_letter_accepted:        3,

  fee_payment_pending:          4,   // Application Fee Paid (in progress)
  ipa_processing:               5,
  approved:                     6,
  tuition_fee_payment_pending:  7,   // Tuition Fee Paid (in progress)

  arrival_preparation:          8,
  arrived_singapore:            9,

  enrolled:                     10,
  internship_eligible:          10,
  completed:                    10,
};

export type MilestoneState = "completed" | "current" | "upcoming";

export interface MilestoneView extends StudentMilestone {
  state: MilestoneState;
}

// rejected / withdrawn are off the happy path — they have no milestone.
export function isOffPathStage(stage: ApplicationStage): boolean {
  return stage === "rejected" || stage === "withdrawn";
}

// The currently-active milestone step for a given internal stage.
// Returns 0 for off-path stages (no milestone).
export function getActiveMilestone(stage: ApplicationStage): number {
  return STAGE_TO_MILESTONE[stage] ?? 0;
}

// Human-readable label for the active milestone, or null when off-path.
export function getActiveMilestoneLabel(stage: ApplicationStage): string | null {
  const step = getActiveMilestone(stage);
  return STUDENT_MILESTONES.find(m => m.step === step)?.label ?? null;
}

// Builds the full 10-milestone view with per-milestone state for a stage.
// Position-based: completed < current < upcoming.
export function buildJourney(stage: ApplicationStage): MilestoneView[] {
  const active = getActiveMilestone(stage);
  return STUDENT_MILESTONES.map(m => ({
    ...m,
    state:
      m.step <  active ? "completed" :
      m.step === active ? "current"  :
                          "upcoming",
  }));
}
