-- Sprint 25 — Launch Safety Fixes
-- Apply via Supabase SQL editor or migration runner.
-- All statements are safe to run on an existing schema.

-- S25-H8: Prevent zero-amount invoices from being moved out of draft.
-- Allows amount_cents = 0 only while the invoice is still a draft; any other
-- status requires a positive amount. Existing draft rows with amount_cents = 0
-- are unaffected until their status changes.
ALTER TABLE student_invoices
  ADD CONSTRAINT invoices_amount_positive
  CHECK (amount_cents > 0 OR status = 'draft');
