-- ═══════════════════════════════════════════════════════════════════════════
-- Sprint 19 — Payment Workflow Alignment (Phase 1: DDL only)
--
-- Paste into Supabase Dashboard → SQL Editor → Run.
-- Safe to re-run (IF NOT EXISTS / CHECK guard).
--
-- DELIVERS:
--   1. student_invoices.fee_type — nullable TEXT, CHECK in
--      ('application_fee','tuition_fee','other'). Existing rows stay NULL
--      and continue to behave exactly as before.
--
-- DOES NOT INTRODUCE:
--   - Any change to applications.current_stage (already plain TEXT with no
--     CHECK constraint — new stage values like 'tuition_fee_payment_pending'
--     are immediately valid without DDL).
--   - Any change to existing tables, indexes, RLS, or triggers.
--   - Any data mutation. Existing invoices, payments, receipts unchanged.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.student_invoices
  ADD COLUMN IF NOT EXISTS fee_type TEXT;

-- Add CHECK constraint idempotently.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'student_invoices_fee_type_check'
      AND conrelid = 'public.student_invoices'::regclass
  ) THEN
    ALTER TABLE public.student_invoices
      ADD CONSTRAINT student_invoices_fee_type_check
      CHECK (fee_type IS NULL OR fee_type IN ('application_fee','tuition_fee','other'));
  END IF;
END;
$$;

-- Optional: index for institution queries that filter by fee_type.
-- Partial index — only non-null rows.
CREATE INDEX IF NOT EXISTS invoices_fee_type_idx
  ON public.student_invoices(college_id, fee_type)
  WHERE fee_type IS NOT NULL;
