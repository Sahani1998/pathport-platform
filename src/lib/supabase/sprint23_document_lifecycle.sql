-- ============================================================================
-- Sprint 23 — Document Lifecycle, Issue Control & Safe Archival
-- ============================================================================
-- Adds the universal document lifecycle (draft → issued → superseded → archived
-- → void) to offer_letters and ipa_records, aligns student_documents enum with
-- the TypeScript union, gives applications an archival/lead-outcome layer, and
-- installs defense-in-depth guard triggers that block hard-delete of records
-- with financial or legal weight (paid invoices, accepted offers, approved
-- IPAs, verified documents, verified payment attempts).
--
-- All statements are idempotent — safe to re-run.
--
-- Companion to:
--   • sprint9_offer_letters.sql
--   • sprint15_application_processing.sql        (ipa_records)
--   • student_documents_schema.sql + sprint17_doc_dedup.sql
--   • sprint17_finance_foundation.sql + sprint22_payment_safety.sql
--
-- Backfill policy (decided with product):
--   • All existing offer_letters rows → status='issued'  (preserve student
--     visibility — these are real letters students already see).
--   • All existing ipa_records rows   → lifecycle_status='issued'
--     (preserve student visibility — the existing `status` column keeps its
--     ICA-decision meaning: submitted/pending/approved/rejected).
--
-- Does NOT:
--   • Add UI for the draft → issue flow (PR B).
--   • Change the create-side of POST /api/offer-letters or POST /api/ipa
--     (they continue to create rows in the visible state; PR B introduces a
--     draft option).
--   • Weaken existing RLS — every policy is replaced with an equally strict
--     or stricter version.
-- ============================================================================


-- ============================================================================
-- 1. offer_letters — full lifecycle column set
-- ============================================================================

ALTER TABLE public.offer_letters
  ADD COLUMN IF NOT EXISTS status            TEXT,
  ADD COLUMN IF NOT EXISTS issued_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS issued_by         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS superseded_by_id  UUID REFERENCES public.offer_letters(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS superseded_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS void_reason       TEXT,
  ADD COLUMN IF NOT EXISTS voided_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS voided_by         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS archived_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS archive_reason    TEXT;

-- Backfill any pre-existing row to 'issued' before we install the NOT NULL
-- constraint and CHECK. Every offer letter that exists today was uploaded
-- under the old "immediate visibility" rule, so 'issued' is the correct state.
UPDATE public.offer_letters
  SET status    = 'issued',
      issued_at = COALESCE(issued_at, created_at)
  WHERE status IS NULL;

ALTER TABLE public.offer_letters
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'issued';

-- Drop any prior CHECK on status to make the migration idempotent.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT constraint_name
      FROM information_schema.table_constraints
     WHERE table_schema    = 'public'
       AND table_name      = 'offer_letters'
       AND constraint_type = 'CHECK'
       AND constraint_name LIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.offer_letters DROP CONSTRAINT %I', r.constraint_name);
  END LOOP;
END;
$$;

ALTER TABLE public.offer_letters
  ADD CONSTRAINT offer_letters_status_check
  CHECK (status IN ('draft', 'issued', 'superseded', 'archived', 'void'));

CREATE INDEX IF NOT EXISTS offer_letters_status_idx ON public.offer_letters (status);

-- Only ONE issued offer letter per application — supersede chain enforced.
CREATE UNIQUE INDEX IF NOT EXISTS offer_letters_one_issued_per_app_idx
  ON public.offer_letters (application_id)
  WHERE status = 'issued';


-- ============================================================================
-- 2. offer_letters — RLS gate on student visibility
-- ============================================================================
-- Students must NEVER see drafts, superseded, archived or void letters. The
-- only exception is a row that still has a recorded decision (so the student
-- can still see their own accepted/declined history if a letter was later
-- voided in error — we keep the audit visible without re-exposing the file).
-- Implementation: hard-gate SELECT to status='issued'. The decision-history UI
-- (PR B) will query through a SECURITY DEFINER helper if needed.

DROP POLICY IF EXISTS "offer_letters: student read own" ON public.offer_letters;

CREATE POLICY "offer_letters: student read own"
  ON public.offer_letters FOR SELECT
  USING (
    status = 'issued'
    AND EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = offer_letters.application_id
        AND a.student_id = auth.uid()
    )
  );

-- Student decision policy must also only accept decisions on currently-issued
-- letters (no decisions on drafts; no resurrecting a voided letter).
DROP POLICY IF EXISTS "offer_letters: student decide own" ON public.offer_letters;

CREATE POLICY "offer_letters: student decide own"
  ON public.offer_letters FOR UPDATE
  USING (
    status = 'issued'
    AND EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = offer_letters.application_id
        AND a.student_id = auth.uid()
    )
  )
  WITH CHECK (
    status = 'issued'
    AND EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = offer_letters.application_id
        AND a.student_id = auth.uid()
    )
  );


-- ============================================================================
-- 3. ipa_records — extend status enum + add lifecycle_status
-- ============================================================================
-- The existing `status` column tracks the ICA decision (submitted/pending/
-- approved/rejected). We keep that meaning and add a separate `lifecycle_status`
-- column for the draft → issued → superseded → archived → void axis. Two
-- orthogonal dimensions = two columns; no semantics overloaded.

ALTER TABLE public.ipa_records
  ADD COLUMN IF NOT EXISTS lifecycle_status  TEXT,
  ADD COLUMN IF NOT EXISTS issued_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS issued_by         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS superseded_by_id  UUID REFERENCES public.ipa_records(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS superseded_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS void_reason       TEXT,
  ADD COLUMN IF NOT EXISTS voided_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS voided_by         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS archived_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS archive_reason    TEXT;

-- Backfill: every existing IPA row was visible to students under the old rule,
-- so it is 'issued' in lifecycle terms regardless of ICA decision.
UPDATE public.ipa_records
  SET lifecycle_status = 'issued',
      issued_at        = COALESCE(issued_at, created_at)
  WHERE lifecycle_status IS NULL;

ALTER TABLE public.ipa_records
  ALTER COLUMN lifecycle_status SET NOT NULL,
  ALTER COLUMN lifecycle_status SET DEFAULT 'issued';

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT constraint_name
      FROM information_schema.table_constraints
     WHERE table_schema    = 'public'
       AND table_name      = 'ipa_records'
       AND constraint_type = 'CHECK'
       AND constraint_name LIKE '%lifecycle%'
  LOOP
    EXECUTE format('ALTER TABLE public.ipa_records DROP CONSTRAINT %I', r.constraint_name);
  END LOOP;
END;
$$;

ALTER TABLE public.ipa_records
  ADD CONSTRAINT ipa_records_lifecycle_status_check
  CHECK (lifecycle_status IN ('draft', 'issued', 'superseded', 'archived', 'void'));

CREATE INDEX IF NOT EXISTS ipa_records_lifecycle_status_idx
  ON public.ipa_records (lifecycle_status);

-- Only ONE non-terminal (draft or issued) IPA per application.
-- Superseded/archived/void rows are retained but excluded.
CREATE UNIQUE INDEX IF NOT EXISTS ipa_records_one_active_per_app_idx
  ON public.ipa_records (application_id)
  WHERE lifecycle_status IN ('draft', 'issued');


-- ============================================================================
-- 4. ipa_records — RLS gate on student visibility
-- ============================================================================
-- Students see ONLY issued IPAs (i.e. ones the institution has finalized).
-- Drafts, superseded, archived, void → invisible.

DROP POLICY IF EXISTS "ipa: student read own" ON public.ipa_records;

CREATE POLICY "ipa: student read own"
  ON public.ipa_records FOR SELECT
  USING (
    lifecycle_status = 'issued'
    AND EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = ipa_records.application_id
        AND a.student_id = auth.uid()
    )
  );


-- ============================================================================
-- 5. student_documents — align SQL enum with TypeScript + add archive columns
-- ============================================================================
-- TS already exposes `reupload_required`; SQL did not allow it. Bring them
-- into agreement. Also add archive_at + void_reason for future use; today the
-- supersede chain is driven by `is_active=false`, which we leave intact.

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT constraint_name
      FROM information_schema.table_constraints
     WHERE table_schema    = 'public'
       AND table_name      = 'student_documents'
       AND constraint_type = 'CHECK'
       AND constraint_name LIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.student_documents DROP CONSTRAINT %I', r.constraint_name);
  END LOOP;
END;
$$;

ALTER TABLE public.student_documents
  ADD CONSTRAINT student_documents_status_check
  CHECK (status IN ('pending', 'verified', 'rejected', 'reupload_required'));

ALTER TABLE public.student_documents
  ADD COLUMN IF NOT EXISTS archived_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS void_reason  TEXT,
  ADD COLUMN IF NOT EXISTS voided_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS voided_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL;


-- ============================================================================
-- 6. applications — archival / lead-outcome columns
-- ============================================================================
-- Institutions need a way to archive applications cleanly. Today they can only
-- set current_stage='withdrawn' (student-initiated) or current_stage='rejected'
-- (decision-driven). Neither captures "lead went cold" or "student picked
-- another institution" — both of which are real CRM states.
--
-- We add a separate `outcome` axis so the institution can mark an outcome
-- WITHOUT inventing a new stage value (which would cascade into stage logic).
-- archived_at/restored_at carry the lifecycle.

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS outcome        TEXT,
  ADD COLUMN IF NOT EXISTS archived_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS archive_reason TEXT,
  ADD COLUMN IF NOT EXISTS restored_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS restored_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT constraint_name
      FROM information_schema.table_constraints
     WHERE table_schema    = 'public'
       AND table_name      = 'applications'
       AND constraint_type = 'CHECK'
       AND constraint_name LIKE '%outcome%'
  LOOP
    EXECUTE format('ALTER TABLE public.applications DROP CONSTRAINT %I', r.constraint_name);
  END LOOP;
END;
$$;

ALTER TABLE public.applications
  ADD CONSTRAINT applications_outcome_check
  CHECK (
    outcome IS NULL
    OR outcome IN ('not_interested', 'withdrawn', 'archived_lead', 'converted', 'rejected_by_institution')
  );

CREATE INDEX IF NOT EXISTS applications_outcome_idx     ON public.applications (outcome);
CREATE INDEX IF NOT EXISTS applications_archived_at_idx ON public.applications (archived_at);


-- ============================================================================
-- 7. Guard triggers — block hard-delete of records with weight
-- ============================================================================
-- Defense-in-depth. Even if a bug or admin tool tries to DELETE a row that
-- represents real financial/legal state, the database refuses. Cascade
-- deletes from courses/colleges also fire row-level triggers in PostgreSQL,
-- so this also protects against accidental cascade wipes.

-- ---- 7a. student_invoices: no delete if paid/partially_paid/refunded -------
CREATE OR REPLACE FUNCTION public.guard_paid_invoice_delete()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status IN ('paid', 'partially_paid', 'refunded') THEN
    RAISE EXCEPTION
      'Cannot delete invoice in status % — financial records must be preserved. Use refund/void with reason.',
      OLD.status
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_paid_invoice_delete ON public.student_invoices;
CREATE TRIGGER trg_guard_paid_invoice_delete
  BEFORE DELETE ON public.student_invoices
  FOR EACH ROW EXECUTE FUNCTION public.guard_paid_invoice_delete();


-- ---- 7b. payment_attempts: no delete if verified ---------------------------
CREATE OR REPLACE FUNCTION public.guard_verified_payment_attempt_delete()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'verified' THEN
    RAISE EXCEPTION
      'Cannot delete a verified payment attempt — financial records must be preserved.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_verified_attempt_delete ON public.payment_attempts;
CREATE TRIGGER trg_guard_verified_attempt_delete
  BEFORE DELETE ON public.payment_attempts
  FOR EACH ROW EXECUTE FUNCTION public.guard_verified_payment_attempt_delete();


-- ---- 7c. offer_letters: no delete if issued AND accepted -------------------
-- An issued offer letter that the student has already accepted is a contract
-- artifact — never delete. Other states (draft, issued-but-undecided,
-- superseded, archived, void) remain deletable through the institution flow.
CREATE OR REPLACE FUNCTION public.guard_accepted_offer_delete()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'issued' AND OLD.student_decision = 'accepted' THEN
    RAISE EXCEPTION
      'Cannot delete an accepted offer letter — supersede or void it instead so the audit chain is preserved.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_accepted_offer_delete ON public.offer_letters;
CREATE TRIGGER trg_guard_accepted_offer_delete
  BEFORE DELETE ON public.offer_letters
  FOR EACH ROW EXECUTE FUNCTION public.guard_accepted_offer_delete();


-- ---- 7d. ipa_records: no delete if ICA-approved ----------------------------
CREATE OR REPLACE FUNCTION public.guard_approved_ipa_delete()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'approved' THEN
    RAISE EXCEPTION
      'Cannot delete an approved IPA — supersede or void it instead so the audit chain is preserved.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_approved_ipa_delete ON public.ipa_records;
CREATE TRIGGER trg_guard_approved_ipa_delete
  BEFORE DELETE ON public.ipa_records
  FOR EACH ROW EXECUTE FUNCTION public.guard_approved_ipa_delete();


-- ---- 7e. student_documents: no delete if verified --------------------------
CREATE OR REPLACE FUNCTION public.guard_verified_document_delete()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'verified' THEN
    RAISE EXCEPTION
      'Cannot delete a verified document. Mark the new version active (is_active=true) and supersede instead.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_verified_document_delete ON public.student_documents;
CREATE TRIGGER trg_guard_verified_document_delete
  BEFORE DELETE ON public.student_documents
  FOR EACH ROW EXECUTE FUNCTION public.guard_verified_document_delete();


-- ============================================================================
-- 8. Backfill verification
-- ============================================================================
-- Sanity counts to inspect after running. These are SELECTs, not DDL — paste
-- them in a separate tab to verify.
--
--   SELECT status, COUNT(*) FROM public.offer_letters GROUP BY status;
--   SELECT lifecycle_status, COUNT(*) FROM public.ipa_records GROUP BY lifecycle_status;
--   SELECT status, COUNT(*) FROM public.student_documents GROUP BY status;
--   SELECT outcome, COUNT(*) FROM public.applications GROUP BY outcome;
