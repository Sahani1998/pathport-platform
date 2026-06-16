-- Sprint 17 — Document Deduplication (active/latest strategy)
--
-- Problem: student_documents allows multiple rows per (application_id, document_type),
-- causing the institution review queue, student documents page, and dashboard
-- counts to show stale duplicates whenever a student re-uploads.
--
-- Strategy: ONE active row per slot enforced by partial unique index; older
-- versions kept with is_active=false so document_reviews history and storage
-- objects remain intact. No row deletion, no data loss.
--
-- Safe to re-run.

-- 1. Add the column (default TRUE so legacy rows are treated as active)
ALTER TABLE public.student_documents
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- 2. Backfill: for each (application_id, document_type) slot, keep only the
--    newest row active. Older rows marked inactive. Rows with NULL
--    application_id (orphaned after app deletion) are left as-is.
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY application_id, document_type
      ORDER BY uploaded_at DESC, id DESC
    ) AS rn
  FROM public.student_documents
  WHERE application_id IS NOT NULL
)
UPDATE public.student_documents sd
SET is_active = FALSE
FROM ranked
WHERE sd.id = ranked.id
  AND ranked.rn > 1;

-- 3. Partial unique index: ONE active row per (application_id, document_type)
--    DROP + CREATE pattern ensures we overwrite any partial/corrupt index from
--    a failed previous run. IF NOT EXISTS is intentionally omitted on CREATE
--    because DROP IF EXISTS immediately precedes it — safe to run twice.
DROP INDEX IF EXISTS public.student_docs_active_per_slot_idx;
CREATE UNIQUE INDEX student_docs_active_per_slot_idx
  ON public.student_documents (application_id, document_type)
  WHERE is_active = TRUE AND application_id IS NOT NULL;

-- 4. Covering index for review-queue filters
CREATE INDEX IF NOT EXISTS student_docs_active_status_idx
  ON public.student_documents (application_id, status)
  WHERE is_active = TRUE;
