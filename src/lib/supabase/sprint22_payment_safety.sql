-- ============================================================================
-- Sprint 22 — Payment Safety & Financial Integrity
-- ============================================================================
-- Schema hardening for the payment system.
-- All statements idempotent — safe to re-run.
--
-- Delivers:
--   1. `partially_paid` status on student_invoices
--   2. Refund columns on student_invoices (refunded_at, refunded_by,
--      refund_reason, refunded_amount_cents)
--   3. guard_paid_invoice_void() trigger — blocks setting void on a paid
--      invoice (paid invoices must go through the /refund route)
--   4. Unique index on official_receipts(payment_attempt_id) — DB-level
--      duplicate receipt guard that closes the concurrent-insert TOCTOU race
--   5. pa_payment_date_not_future CHECK on payment_attempts — no future dates
--   6. pa_paid_amount_positive    CHECK on payment_attempts — amount > 0
--
-- Does NOT:
--   - Change application stage logic
--   - Add new notification types or email templates
--   - Add installment plans or partial-refund splits
-- ============================================================================


-- ============================================================================
-- 1. Add `partially_paid` to student_invoices.status
-- ============================================================================

-- Drop the existing inline CHECK by its auto-generated name.
-- The DO block finds and drops it regardless of exact name.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT constraint_name
      FROM information_schema.table_constraints
     WHERE table_schema    = 'public'
       AND table_name      = 'student_invoices'
       AND constraint_type = 'CHECK'
       AND constraint_name LIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.student_invoices DROP CONSTRAINT %I', r.constraint_name);
  END LOOP;
END;
$$;

-- Re-add with partially_paid included.
ALTER TABLE public.student_invoices
  ADD CONSTRAINT student_invoices_status_check
  CHECK (status IN (
    'draft', 'pending', 'under_verification',
    'paid', 'partially_paid',
    'payment_action_required', 'void', 'refunded'
  ));


-- ============================================================================
-- 2. Refund columns on student_invoices
-- ============================================================================

ALTER TABLE public.student_invoices
  ADD COLUMN IF NOT EXISTS refunded_at              TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refunded_by              UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS refund_reason            TEXT,
  ADD COLUMN IF NOT EXISTS refunded_amount_cents    BIGINT
    CHECK (refunded_amount_cents IS NULL OR refunded_amount_cents > 0);


-- ============================================================================
-- 3. guard_paid_invoice_void() — block void on paid invoices
-- ============================================================================
--
-- Paid invoices have received money and must be processed via the refund
-- route (which sets status → 'refunded'). Setting them to 'void' directly
-- would bypass the refund audit trail.

CREATE OR REPLACE FUNCTION public.guard_paid_invoice_void() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status IN ('paid', 'partially_paid') AND NEW.status = 'void' THEN
    RAISE EXCEPTION
      'Cannot void invoice % — it has received payment (status: %). Use the refund route instead.',
      OLD.id, OLD.status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_paid_invoice_void ON public.student_invoices;
CREATE TRIGGER trg_guard_paid_invoice_void
  BEFORE UPDATE ON public.student_invoices
  FOR EACH ROW EXECUTE FUNCTION public.guard_paid_invoice_void();


-- ============================================================================
-- 4. Unique index on official_receipts(payment_attempt_id)
-- ============================================================================
--
-- Prevents duplicate receipts from concurrent POST requests that both pass
-- the application-level "existing receipt" check before either inserts.
-- The route handles the resulting 23505 unique-violation error as a 409.

CREATE UNIQUE INDEX IF NOT EXISTS or_attempt_unique
  ON public.official_receipts(payment_attempt_id);


-- ============================================================================
-- 5. pa_payment_date_not_future CHECK on payment_attempts
-- ============================================================================
--
-- Payment dates recorded by institutions must not be in the future.
-- NOT VALID skips existing rows (historical data may predate this rule);
-- new inserts and updates are enforced immediately.

ALTER TABLE public.payment_attempts
  DROP CONSTRAINT IF EXISTS pa_payment_date_not_future;

ALTER TABLE public.payment_attempts
  ADD CONSTRAINT pa_payment_date_not_future
  CHECK (payment_date IS NULL OR payment_date <= CURRENT_DATE)
  NOT VALID;


-- ============================================================================
-- 6. pa_paid_amount_positive CHECK on payment_attempts
-- ============================================================================

ALTER TABLE public.payment_attempts
  DROP CONSTRAINT IF EXISTS pa_paid_amount_positive;

ALTER TABLE public.payment_attempts
  ADD CONSTRAINT pa_paid_amount_positive
  CHECK (paid_amount_cents IS NULL OR paid_amount_cents > 0)
  NOT VALID;


-- ============================================================================
-- 7. POST-MIGRATION VERIFICATION QUERIES (commented — run manually)
-- ============================================================================
--
-- -- Partially paid status accepted?
-- UPDATE public.student_invoices SET status = 'partially_paid' WHERE false;  -- expect: ok (no rows)
--
-- -- Refund columns present?
-- SELECT refunded_at, refunded_by, refund_reason, refunded_amount_cents
--   FROM public.student_invoices LIMIT 1;
--
-- -- Void guard fires on paid invoice?
-- -- (run in a transaction and ROLLBACK)
-- BEGIN;
-- UPDATE public.student_invoices SET status = 'void' WHERE status = 'paid' LIMIT 1;
-- -- expect: ERROR: Cannot void invoice … (status: paid). Use the refund route.
-- ROLLBACK;
--
-- -- Unique receipt index present?
-- SELECT indexname FROM pg_indexes
--  WHERE tablename = 'official_receipts' AND indexname = 'or_attempt_unique';
--
-- -- New checks on payment_attempts?
-- SELECT constraint_name FROM information_schema.table_constraints
--  WHERE table_name = 'payment_attempts'
--    AND constraint_name IN ('pa_payment_date_not_future', 'pa_paid_amount_positive');
