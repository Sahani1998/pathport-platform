-- Sprint 17 Stabilization: performance & correctness fixes
-- Run in Supabase SQL Editor: Project → SQL Editor → New Query

-- Index: student_invoices(course_id) — added as FK in Sprint 17 but missing index.
-- Required for queries that filter invoices by course (admin reports, course archiving checks).
CREATE INDEX IF NOT EXISTS invoices_course_idx
  ON public.student_invoices(course_id);

-- Index: payment_attempts(college_id, status) — supports institution payment queue page
-- which filters by college_id (institution RLS) and status tab simultaneously.
CREATE INDEX IF NOT EXISTS payment_attempts_college_status_idx
  ON public.payment_attempts(college_id, status);

-- Index: payment_attempts(student_id) — supports student invoice detail page
-- which fetches all attempts for a given student's invoice.
CREATE INDEX IF NOT EXISTS payment_attempts_student_idx
  ON public.payment_attempts(student_id);
