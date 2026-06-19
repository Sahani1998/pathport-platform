// ═════════════════════════════════════════════════════════════════════════
// Sprint 20A — Payment verification stage routing
//
// Decides which application stage a successful payment verification should
// advance to, based on the invoice fee_type and the application's current
// stage.
//
// Sprint 19 originally used disjunctive logic:
//   feeType === "tuition_fee" || currentStage === "tuition_fee_payment_pending"
//
// That misrouted application_fee invoices that were (mistakenly) issued
// against an application already at the tuition gate — they advanced
// to arrival_preparation and skipped IPA processing.
//
// Sprint 20A makes fee_type authoritative:
//   1. Explicit fee_type wins.
//   2. Legacy invoices (fee_type=null) fall back to currentStage as a hint.
//   3. Default is the application-fee path so historical behaviour is
//      preserved for invoices that pre-date fee_type entirely.
//
// Pure function with no side effects — kept in lib (not in the route file)
// so it can be reasoned about and re-used without crossing Next.js route
// export restrictions.
// ═════════════════════════════════════════════════════════════════════════

import type { ApplicationStage } from "@/types/timeline";
import type { InvoiceFeeType } from "@/types/payment";

export interface StageAdvanceResult {
  toStage:        ApplicationStage;
  studentMessage: string;
}

const APPLICATION_FEE_RESULT: StageAdvanceResult = {
  toStage:        "ipa_processing",
  studentMessage: "Your payment has been verified. Your college can now begin the IPA (In-Principle Approval) submission to ICA Singapore.",
};

const TUITION_FEE_RESULT: StageAdvanceResult = {
  toStage:        "arrival_preparation",
  studentMessage: "Your tuition fee has been verified. Arrival preparation is now underway.",
};

export function resolveStageAdvance(
  currentStage: ApplicationStage,
  feeType:      InvoiceFeeType | null,
): StageAdvanceResult {
  // 1. Explicit fee_type is authoritative.
  if (feeType === "tuition_fee")     return TUITION_FEE_RESULT;
  if (feeType === "application_fee") return APPLICATION_FEE_RESULT;
  if (feeType === "other")           return APPLICATION_FEE_RESULT;

  // 2. Legacy invoice (fee_type === null): use the current application stage
  //    as a hint. Only the tuition-pending stage points unambiguously to the
  //    tuition path; every other state defaults to the application-fee path
  //    so pre-Sprint-19 invoices continue to behave as they always did.
  if (currentStage === "tuition_fee_payment_pending") return TUITION_FEE_RESULT;
  return APPLICATION_FEE_RESULT;
}
