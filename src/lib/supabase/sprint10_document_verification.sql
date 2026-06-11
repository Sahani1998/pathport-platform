-- ─── Sprint 10: Document Verification System ────────────────────────────────
-- Run once in Supabase SQL Editor (project owner).
-- Safe to re-run: all statements are idempotent.

-- ─── 1. Widen student_documents.status to include reupload_required ──────────
--
-- Problem with information_schema approach: PostgreSQL may store NOT NULL
-- constraints as check constraints whose check clause contains the column name
-- (e.g. "status IS NOT NULL"), causing LIKE '%status%' to match them and fail
-- when trying to drop a system-generated constraint like "2200_18067_10_not_null".
--
-- Fix: use pg_catalog.pg_constraint + pg_get_constraintdef() and match against
-- the actual enum values ('pending', 'verified', 'rejected'). These strings
-- only appear in our explicit CHECK constraint, never in NOT NULL constraints.

DO $$ DECLARE _con TEXT; BEGIN
  FOR _con IN (
    SELECT conname
    FROM   pg_catalog.pg_constraint
    WHERE  conrelid = 'public.student_documents'::regclass
      AND  contype  = 'c'
      AND  pg_get_constraintdef(oid) LIKE $s$%'pending'%$s$
      AND  pg_get_constraintdef(oid) LIKE $s$%'verified'%$s$
      AND  pg_get_constraintdef(oid) LIKE $s$%'rejected'%$s$
  ) LOOP
    EXECUTE format('ALTER TABLE public.student_documents DROP CONSTRAINT %I', _con);
  END LOOP;
END $$;

-- Add widened constraint — wrapped in DO so re-runs are safe (duplicate_object ignored)
DO $$ BEGIN
  ALTER TABLE public.student_documents
    ADD CONSTRAINT student_documents_status_check
    CHECK (status IN ('pending', 'verified', 'rejected', 'reupload_required'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── 2. document_reviews table ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.document_reviews (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id  UUID        NOT NULL REFERENCES public.student_documents(id) ON DELETE CASCADE,
  reviewer_id  UUID                    REFERENCES auth.users(id)            ON DELETE SET NULL,
  status       TEXT        NOT NULL
               CHECK (status IN ('verified', 'rejected', 'reupload_required', 'pending')),
  comment      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_reviews_document_id  ON public.document_reviews(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_reviews_reviewer_id  ON public.document_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_doc_reviews_created_at   ON public.document_reviews(created_at DESC);

-- ─── 3. RLS for document_reviews ─────────────────────────────────────────────
ALTER TABLE public.document_reviews ENABLE ROW LEVEL SECURITY;

-- Admins: full access
DROP POLICY IF EXISTS "doc_reviews: admin all" ON public.document_reviews;
CREATE POLICY "doc_reviews: admin all"
  ON public.document_reviews
  FOR ALL
  USING (public.requesting_user_is_admin())
  WITH CHECK (public.requesting_user_is_admin());

-- Institutions: select reviews for documents in their college's applications
DROP POLICY IF EXISTS "doc_reviews: institution read own college" ON public.document_reviews;
CREATE POLICY "doc_reviews: institution read own college"
  ON public.document_reviews
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM   public.student_documents sd
      JOIN   public.applications       a  ON a.id  = sd.application_id
      JOIN   public.courses            c  ON c.id  = a.course_id
      JOIN   public.profiles           p  ON p.id  = auth.uid()
      WHERE  sd.id          = document_reviews.document_id
        AND  c.college_id   = p.college_id
        AND  p.role         = 'institution'
    )
  );

-- Institutions: insert reviews for documents in their college's applications
DROP POLICY IF EXISTS "doc_reviews: institution insert own college" ON public.document_reviews;
CREATE POLICY "doc_reviews: institution insert own college"
  ON public.document_reviews
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM   public.student_documents sd
      JOIN   public.applications       a  ON a.id  = sd.application_id
      JOIN   public.courses            c  ON c.id  = a.course_id
      JOIN   public.profiles           p  ON p.id  = auth.uid()
      WHERE  sd.id          = document_reviews.document_id
        AND  c.college_id   = p.college_id
        AND  p.role         = 'institution'
    )
  );

-- Students: read reviews for their own documents only
DROP POLICY IF EXISTS "doc_reviews: student read own" ON public.document_reviews;
CREATE POLICY "doc_reviews: student read own"
  ON public.document_reviews
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.student_documents sd
      WHERE sd.id         = document_reviews.document_id
        AND sd.student_id = auth.uid()
    )
  );

-- ─── 4. Update student_documents RLS to allow institution to update status ───
-- institution users must be able to update status/reviewed_by/reviewed_at

-- Drop old institution update policy if any
DROP POLICY IF EXISTS "student_documents: institution update status" ON public.student_documents;
DROP POLICY IF EXISTS "student_docs: institution update" ON public.student_documents;

CREATE POLICY "student_docs: institution update"
  ON public.student_documents
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM   public.applications a
      JOIN   public.courses      c ON c.id = a.course_id
      JOIN   public.profiles     p ON p.id = auth.uid()
      WHERE  a.id          = student_documents.application_id
        AND  c.college_id  = p.college_id
        AND  p.role        = 'institution'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM   public.applications a
      JOIN   public.courses      c ON c.id = a.course_id
      JOIN   public.profiles     p ON p.id = auth.uid()
      WHERE  a.id          = student_documents.application_id
        AND  c.college_id  = p.college_id
        AND  p.role        = 'institution'
    )
  );

-- ─── 5. notifications insert policy for institution role ─────────────────────
-- Institution needs to insert notifications when reviewing documents.
DROP POLICY IF EXISTS "notifications: institution insert" ON public.notifications;
CREATE POLICY "notifications: institution insert"
  ON public.notifications
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id   = auth.uid()
        AND p.role IN ('institution', 'admin')
    )
  );

-- ─── 6. application_timeline_events insert for institution ───────────────────
DROP POLICY IF EXISTS "timeline_events: institution insert" ON public.application_timeline_events;
CREATE POLICY "timeline_events: institution insert"
  ON public.application_timeline_events
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.applications  a
      JOIN public.courses       c ON c.id = a.course_id
      JOIN public.profiles      p ON p.id = auth.uid()
      WHERE a.id         = application_timeline_events.application_id
        AND c.college_id = p.college_id
        AND p.role       = 'institution'
    )
  );

-- ─── 7. application_audit_log insert for institution ─────────────────────────
DROP POLICY IF EXISTS "audit_log: institution insert" ON public.application_audit_log;
CREATE POLICY "audit_log: institution insert"
  ON public.application_audit_log
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.applications  a
      JOIN public.courses       c ON c.id = a.course_id
      JOIN public.profiles      p ON p.id = auth.uid()
      WHERE a.id         = application_audit_log.application_id
        AND c.college_id = p.college_id
        AND p.role       = 'institution'
    )
  );
