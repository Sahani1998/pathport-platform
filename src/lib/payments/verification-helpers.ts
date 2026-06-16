// Shared helpers for payment verification actions (PR-D).
//
// Used by:
//   POST /api/payment-attempts/[id]/verify
//   POST /api/payment-attempts/[id]/reject
//   POST /api/payment-attempts/[id]/request-info
//
// Each action updates the payment_attempt row, then fires non-fatal side
// effects (invoice status, stage advancement, notification, audit, email)
// via the admin client.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { PaymentAttempt, StudentInvoice } from "@/types/payment";

export interface AttemptWithContext {
  attempt:     PaymentAttempt;
  invoice:     StudentInvoice;
  applicationId: string;
  studentId:   string;
  collegeId:   string;
  courseId:    string;
}

// Loads attempt + parent invoice in one round-trip.
// Returns null if either row is missing or if the attempt doesn't belong to
// the caller's college (institution guard) — admin always passes.
export async function loadAttemptWithContext(
  db: SupabaseClient,
  attemptId: string,
  callerCollegeId: string | null,  // null = admin (no college filter)
): Promise<AttemptWithContext | null> {
  const { data: attempt } = await db
    .from("payment_attempts").select("*").eq("id", attemptId).maybeSingle();
  if (!attempt) return null;

  // Institution: must own the college
  if (callerCollegeId !== null && attempt.college_id !== callerCollegeId) return null;

  const { data: invoice } = await db
    .from("student_invoices").select("*").eq("id", attempt.invoice_id).maybeSingle();
  if (!invoice) return null;

  return {
    attempt:       attempt as PaymentAttempt,
    invoice:       invoice as StudentInvoice,
    applicationId: attempt.application_id,
    studentId:     attempt.student_id,
    collegeId:     attempt.college_id,
    courseId:      invoice.course_id,
  };
}
