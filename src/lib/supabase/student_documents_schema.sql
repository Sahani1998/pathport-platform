-- ═══════════════════════════════════════════════════════════════════════════════
-- PathPort — Student Document Upload System
-- Paste into Supabase Dashboard → SQL Editor → Run
-- Safe to re-run: IF NOT EXISTS / OR REPLACE / ON CONFLICT throughout
-- ═══════════════════════════════════════════════════════════════════════════════


-- ── 1. Table ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.student_documents (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       UUID        NOT NULL REFERENCES auth.users(id)         ON DELETE CASCADE,
  application_id   UUID                    REFERENCES public.applications(id) ON DELETE SET NULL,
  document_type    TEXT        NOT NULL,   -- passport | certificate | transcript | cv | photo | financial | english | other
  file_name        TEXT        NOT NULL,   -- original file name shown to user
  file_url         TEXT        NOT NULL,   -- storage path (used to generate signed URLs)
  file_path        TEXT        NOT NULL,   -- same as file_url — kept for clarity
  mime_type        TEXT,
  file_size        BIGINT,                 -- bytes
  status           TEXT        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending', 'verified', 'rejected')),
  rejection_reason TEXT,
  uploaded_at      TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at      TIMESTAMPTZ,
  reviewed_by      UUID                    REFERENCES auth.users(id) ON DELETE SET NULL
);


-- ── 2. Indexes ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS student_docs_student_idx     ON public.student_documents (student_id);
CREATE INDEX IF NOT EXISTS student_docs_application_idx ON public.student_documents (application_id);
CREATE INDEX IF NOT EXISTS student_docs_status_idx      ON public.student_documents (status);
CREATE INDEX IF NOT EXISTS student_docs_type_idx        ON public.student_documents (document_type);
CREATE INDEX IF NOT EXISTS student_docs_uploaded_idx    ON public.student_documents (uploaded_at DESC);


-- ── 3. updated_at on reviewed_at trigger ─────────────────────────────────
-- (set_updated_at already exists from courses_schema.sql — reuse it)
-- No trigger needed here; reviewed_at is set explicitly in UPDATE statements.


-- ── 4. SECURITY DEFINER helper ──────────────────────────────────────────────
-- Returns TRUE when the calling user manages the college that owns the course
-- linked to the document's application.  Used in institution SELECT/UPDATE policies.
CREATE OR REPLACE FUNCTION public.user_can_review_document(p_document_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_application_id UUID;
  v_course_id      UUID;
  v_college_id     UUID;
BEGIN
  SELECT application_id INTO v_application_id
  FROM public.student_documents WHERE id = p_document_id;

  IF v_application_id IS NULL THEN RETURN FALSE; END IF;

  SELECT course_id INTO v_course_id
  FROM public.applications WHERE id = v_application_id;

  IF v_course_id IS NULL THEN RETURN FALSE; END IF;

  SELECT college_id INTO v_college_id
  FROM public.courses WHERE id = v_course_id;

  RETURN public.user_owns_college(v_college_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.user_can_review_document(UUID) TO authenticated;


-- ── 5. Row Level Security ────────────────────────────────────────────────────
ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "docs: student select own"        ON public.student_documents;
DROP POLICY IF EXISTS "docs: student insert own"        ON public.student_documents;
DROP POLICY IF EXISTS "docs: student delete own"        ON public.student_documents;
DROP POLICY IF EXISTS "docs: institution select"        ON public.student_documents;
DROP POLICY IF EXISTS "docs: institution update status" ON public.student_documents;
DROP POLICY IF EXISTS "docs: admin all"                 ON public.student_documents;

-- Students: full access to their own documents
CREATE POLICY "docs: student select own"
  ON public.student_documents FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "docs: student insert own"
  ON public.student_documents FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "docs: student delete own"
  ON public.student_documents FOR DELETE
  USING (student_id = auth.uid());

-- Institutions: read + update documents for their college's applications
CREATE POLICY "docs: institution select"
  ON public.student_documents FOR SELECT
  USING (public.user_can_review_document(id));

CREATE POLICY "docs: institution update status"
  ON public.student_documents FOR UPDATE
  USING (public.user_can_review_document(id));

-- Admin: everything
CREATE POLICY "docs: admin all"
  ON public.student_documents FOR ALL
  USING (public.requesting_user_is_admin());


-- ── 6. Storage bucket ────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'student-documents',
  'student-documents',
  false,          -- private bucket
  10485760,       -- 10 MB
  ARRAY['application/pdf','image/jpeg','image/jpg','image/png']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;


-- ── 7. Storage RLS ───────────────────────────────────────────────────────────
-- Path format: {student_id}/{application_id}/{doc_type}-{timestamp}.{ext}
-- First path segment = student_id, so we can verify ownership.

DROP POLICY IF EXISTS "storage: student upload own"  ON storage.objects;
DROP POLICY IF EXISTS "storage: student read own"    ON storage.objects;
DROP POLICY IF EXISTS "storage: student delete own"  ON storage.objects;
DROP POLICY IF EXISTS "storage: admin read all"      ON storage.objects;
DROP POLICY IF EXISTS "storage: institution read"    ON storage.objects;

-- Authenticated students can upload to their own folder
CREATE POLICY "storage: student upload own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'student-documents'
    AND (string_to_array(name, '/'))[1] = auth.uid()::text
  );

-- Students can read their own files
CREATE POLICY "storage: student read own"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'student-documents'
    AND (string_to_array(name, '/'))[1] = auth.uid()::text
  );

-- Students can delete/replace their own files
CREATE POLICY "storage: student delete own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'student-documents'
    AND (string_to_array(name, '/'))[1] = auth.uid()::text
  );

-- Admins can read all files in the bucket
CREATE POLICY "storage: admin read all"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'student-documents'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Institutions can read files for their students
-- (Allow read of any file in the bucket; DB-level RLS on student_documents
--  ensures they can only see document metadata for their college's students.)
CREATE POLICY "storage: institution read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'student-documents'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'institution'
    )
  );
