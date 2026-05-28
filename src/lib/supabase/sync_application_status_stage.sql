-- ═══════════════════════════════════════════════════════════════════════════════
-- PathPort — Sync applications.status ↔ applications.current_stage
-- Paste into Supabase Dashboard → SQL Editor → Run ONCE
-- Safe to re-run: UPDATE only changes rows where the fields are out of sync.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── 1. Backfill current_stage from status (for rows with no stage set) ───────
--    Rows created before the timeline system only have the old status field.
UPDATE public.applications
SET current_stage = CASE status
  WHEN 'submitted'     THEN 'application_submitted'
  WHEN 'under_review'  THEN 'documents_under_review'
  WHEN 'docs_required' THEN 'documents_pending'
  WHEN 'offer_ready'   THEN 'offer_letter_ready'
  WHEN 'ipa_processing' THEN 'ipa_processing'
  WHEN 'approved'      THEN 'approved'
  WHEN 'rejected'      THEN 'rejected'
  ELSE 'application_submitted'
END
WHERE current_stage IS NULL
   OR current_stage = 'application_submitted';   -- treat default-value rows as unset


-- ── 2. Fix rows where status is ahead of current_stage ───────────────────────
--    e.g. institution clicked Approved in the old dropdown → status=approved
--    but current_stage was never updated.
UPDATE public.applications
SET current_stage = CASE status
  WHEN 'approved'       THEN 'approved'
  WHEN 'rejected'       THEN 'rejected'
  WHEN 'ipa_processing' THEN 'ipa_processing'
  WHEN 'offer_ready'    THEN 'offer_letter_ready'
  WHEN 'docs_required'  THEN 'documents_pending'
  WHEN 'under_review'   THEN 'documents_under_review'
  ELSE current_stage
END
WHERE
  -- status says approved/rejected/ipa but current_stage doesn't reflect it
  (status = 'approved'       AND current_stage NOT IN ('approved','arrival_preparation','arrived_singapore'))
  OR (status = 'rejected'      AND current_stage != 'rejected')
  OR (status = 'ipa_processing' AND current_stage NOT IN ('ipa_processing','approved','arrival_preparation','arrived_singapore'))
  OR (status = 'offer_ready'   AND current_stage NOT IN ('offer_letter_ready','fee_payment_pending','ipa_processing','approved','arrival_preparation','arrived_singapore'));


-- ── 3. Fix rows where current_stage is ahead of status ───────────────────────
--    e.g. stage was moved to offer_letter_ready but status is still submitted.
UPDATE public.applications
SET status = CASE current_stage
  WHEN 'application_submitted'   THEN 'submitted'
  WHEN 'documents_pending'       THEN 'docs_required'
  WHEN 'documents_uploaded'      THEN 'under_review'
  WHEN 'documents_under_review'  THEN 'under_review'
  WHEN 'documents_verified'      THEN 'under_review'
  WHEN 'offer_letter_processing' THEN 'under_review'
  WHEN 'offer_letter_ready'      THEN 'offer_ready'
  WHEN 'fee_payment_pending'     THEN 'offer_ready'
  WHEN 'ipa_processing'          THEN 'ipa_processing'
  WHEN 'approved'                THEN 'approved'
  WHEN 'arrival_preparation'     THEN 'approved'
  WHEN 'arrived_singapore'       THEN 'approved'
  WHEN 'rejected'                THEN 'rejected'
  WHEN 'withdrawn'               THEN 'rejected'
  ELSE status
END
WHERE current_stage IS NOT NULL;


-- ── 4. Verify result ──────────────────────────────────────────────────────────
SELECT id, status, current_stage
FROM public.applications
ORDER BY submitted_at DESC
LIMIT 20;
