-- ═══════════════════════════════════════════════════════════════════════════════
-- PathPort — Sprint 13: College Documents (institution → student downloads)
-- Safe to re-run. Paste into Supabase Dashboard → SQL Editor → Run.
--
-- Contents:
--   1. student_downloadable_documents table + indexes
--   2. RLS: student read own / institution manage own college / admin all
--   3. Storage bucket "college-documents" policies
--      (create the bucket first: Storage → New Bucket → "college-documents" → Private)
-- ═══════════════════════════════════════════════════════════════════════════════


-- ── 1. student_downloadable_documents ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.student_downloadable_documents (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id     UUID        NOT NULL REFERENCES auth.users(id)            ON DELETE CASCADE,
  application_id UUID                 REFERENCES public.applications(id)   ON DELETE SET NULL,
  uploaded_by    UUID                 REFERENCES auth.users(id)            ON DELETE SET NULL,
  title          TEXT        NOT NULL,
  file_path      TEXT        NOT NULL,
  file_name      TEXT        NOT NULL,
  file_size      BIGINT,
  document_type  TEXT        NOT NULL DEFAULT 'general',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sdd_student_idx     ON public.student_downloadable_documents (student_id);
CREATE INDEX IF NOT EXISTS sdd_application_idx ON public.student_downloadable_documents (application_id);
CREATE INDEX IF NOT EXISTS sdd_created_idx     ON public.student_downloadable_documents (created_at DESC);


-- ── 2. RLS ───────────────────────────────────────────────────────────────────
ALTER TABLE public.student_downloadable_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sdd: student read own"          ON public.student_downloadable_documents;
DROP POLICY IF EXISTS "sdd: institution own college"   ON public.student_downloadable_documents;
DROP POLICY IF EXISTS "sdd: admin all"                 ON public.student_downloadable_documents;

-- Students: read only documents addressed to them
CREATE POLICY "sdd: student read own"
  ON public.student_downloadable_documents FOR SELECT
  USING (student_id = auth.uid());

-- Institutions: full manage, but only for students who have an application
-- to a course belonging to the institution's own college
CREATE POLICY "sdd: institution own college"
  ON public.student_downloadable_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.applications a
      JOIN public.courses      c ON c.id = a.course_id
      JOIN public.profiles     p ON p.id = auth.uid()
      WHERE a.student_id  = student_downloadable_documents.student_id
        AND p.role        = 'institution'
        AND p.college_id  = c.college_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.applications a
      JOIN public.courses      c ON c.id = a.course_id
      JOIN public.profiles     p ON p.id = auth.uid()
      WHERE a.student_id  = student_downloadable_documents.student_id
        AND p.role        = 'institution'
        AND p.college_id  = c.college_id
    )
  );

-- Admin: everything
CREATE POLICY "sdd: admin all"
  ON public.student_downloadable_documents FOR ALL
  USING (public.requesting_user_is_admin());


-- ── 3. Storage bucket "college-documents" policies ───────────────────────────
-- Create the bucket first in the Supabase Dashboard:
--   Storage → New Bucket → Name: "college-documents" → Private (NOT public)
--
-- Downloads go through /api/student-downloadable-documents/[id]/download which
-- verifies table-level access (RLS) and signs the URL with the service role,
-- so no student storage SELECT policy is needed.

DROP POLICY IF EXISTS "college-documents: institution upload" ON storage.objects;
DROP POLICY IF EXISTS "college-documents: institution read"   ON storage.objects;
DROP POLICY IF EXISTS "college-documents: admin all"          ON storage.objects;

CREATE POLICY "college-documents: institution upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'college-documents'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('institution', 'admin')
    )
  );

CREATE POLICY "college-documents: institution read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'college-documents'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('institution', 'admin')
    )
  );

CREATE POLICY "college-documents: admin all"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'college-documents'
    AND public.requesting_user_is_admin()
  );
