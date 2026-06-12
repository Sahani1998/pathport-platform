-- ═══════════════════════════════════════════════════════════════════════════════
-- PathPort — Sprint 15: Application Processing Engine
-- Safe to re-run. Paste into Supabase Dashboard → SQL Editor → Run.
--
-- Contents:
--   1. document_requests        — institution requests specific documents from a student
--   2. trigger                  — auto-fulfil pending requests when student uploads
--   3. application_notes        — internal notes (institution + admin only)
--   4. ipa_records              — IPA upload + status tracking
--   5. offer_letters            — student accept/decline decision columns
--   6. storage bucket           — ipa-documents (private)
--   7. realtime                 — applications + notifications publications
--
-- Already existing (NOT recreated here — see earlier migrations):
--   application_timeline_events (application_timeline_schema.sql)
--   notifications               (application_timeline_schema.sql)
--   application_audit_log       (sprint8_migrations.sql)
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─── 1. document_requests ─────────────────────────────────────────────────────
-- Institution/admin asks a student for a specific document. Status moves to
-- 'fulfilled' automatically when the student uploads a matching document type
-- (see trigger in section 2).

CREATE TABLE IF NOT EXISTS public.document_requests (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID        NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  student_id      UUID        NOT NULL REFERENCES auth.users(id)          ON DELETE CASCADE,
  requested_by    UUID                 REFERENCES auth.users(id)          ON DELETE SET NULL,
  document_type   TEXT        NOT NULL
                  CHECK (document_type IN ('passport','certificate','transcript','cv','photo','financial','english','other')),
  title           TEXT        NOT NULL,
  description     TEXT,
  deadline        DATE,
  priority        TEXT        NOT NULL DEFAULT 'normal'
                  CHECK (priority IN ('low','normal','high','urgent')),
  status          TEXT        NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','fulfilled','cancelled')),
  fulfilled_at    TIMESTAMPTZ,
  fulfilled_by_document_id UUID REFERENCES public.student_documents(id)   ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS doc_requests_application_idx ON public.document_requests (application_id);
CREATE INDEX IF NOT EXISTS doc_requests_student_idx     ON public.document_requests (student_id);
CREATE INDEX IF NOT EXISTS doc_requests_status_idx      ON public.document_requests (status);
CREATE INDEX IF NOT EXISTS doc_requests_created_idx     ON public.document_requests (created_at DESC);

ALTER TABLE public.document_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "doc_requests: student read own"        ON public.document_requests;
CREATE POLICY "doc_requests: student read own"
  ON public.document_requests FOR SELECT
  USING (student_id = auth.uid());

DROP POLICY IF EXISTS "doc_requests: institution manage"      ON public.document_requests;
CREATE POLICY "doc_requests: institution manage"
  ON public.document_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = document_requests.application_id
        AND public.user_owns_course_college(a.course_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = document_requests.application_id
        AND public.user_owns_course_college(a.course_id)
    )
  );

DROP POLICY IF EXISTS "doc_requests: admin all"               ON public.document_requests;
CREATE POLICY "doc_requests: admin all"
  ON public.document_requests FOR ALL
  USING (public.requesting_user_is_admin())
  WITH CHECK (public.requesting_user_is_admin());


-- ─── 2. Auto-fulfil trigger ──────────────────────────────────────────────────
-- Student uploads happen client-side (direct insert into student_documents),
-- so fulfilment must live in the database to be reliable.

CREATE OR REPLACE FUNCTION public.fulfil_document_requests()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.document_requests
  SET status                   = 'fulfilled',
      fulfilled_at             = NOW(),
      fulfilled_by_document_id = NEW.id,
      updated_at               = NOW()
  WHERE application_id = NEW.application_id
    AND document_type  = NEW.document_type
    AND status         = 'pending';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fulfil_document_requests ON public.student_documents;
CREATE TRIGGER trg_fulfil_document_requests
  AFTER INSERT ON public.student_documents
  FOR EACH ROW EXECUTE FUNCTION public.fulfil_document_requests();


-- updated_at maintenance for document_requests
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_doc_requests_touch ON public.document_requests;
CREATE TRIGGER trg_doc_requests_touch
  BEFORE UPDATE ON public.document_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


-- ─── 3. application_notes ────────────────────────────────────────────────────
-- Internal collaboration notes. Visible to institution (own college) + admin.
-- NEVER visible to students — no student policy exists.

CREATE TABLE IF NOT EXISTS public.application_notes (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID        NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  author_id       UUID                 REFERENCES auth.users(id)          ON DELETE SET NULL,
  author_role     TEXT        NOT NULL DEFAULT 'institution'
                  CHECK (author_role IN ('admin','institution')),
  content         TEXT        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 4000),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS app_notes_application_idx ON public.application_notes (application_id);
CREATE INDEX IF NOT EXISTS app_notes_author_idx      ON public.application_notes (author_id);
CREATE INDEX IF NOT EXISTS app_notes_created_idx     ON public.application_notes (created_at DESC);

ALTER TABLE public.application_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_notes: institution manage" ON public.application_notes;
CREATE POLICY "app_notes: institution manage"
  ON public.application_notes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = application_notes.application_id
        AND public.user_owns_course_college(a.course_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = application_notes.application_id
        AND public.user_owns_course_college(a.course_id)
    )
  );

DROP POLICY IF EXISTS "app_notes: admin all" ON public.application_notes;
CREATE POLICY "app_notes: admin all"
  ON public.application_notes FOR ALL
  USING (public.requesting_user_is_admin())
  WITH CHECK (public.requesting_user_is_admin());

DROP TRIGGER IF EXISTS trg_app_notes_touch ON public.application_notes;
CREATE TRIGGER trg_app_notes_touch
  BEFORE UPDATE ON public.application_notes
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


-- ─── 4. ipa_records ──────────────────────────────────────────────────────────
-- In-Principle Approval letters uploaded by institution/admin, with status
-- tracking. Students can read records for their own applications (so they can
-- see status + download the approved IPA letter).

CREATE TABLE IF NOT EXISTS public.ipa_records (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID        NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  uploaded_by     UUID                 REFERENCES auth.users(id)          ON DELETE SET NULL,
  file_path       TEXT        NOT NULL,
  file_name       TEXT        NOT NULL,
  file_size       BIGINT,
  status          TEXT        NOT NULL DEFAULT 'submitted'
                  CHECK (status IN ('submitted','pending','approved','rejected')),
  notes           TEXT,
  decided_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ipa_records_application_idx ON public.ipa_records (application_id);
CREATE INDEX IF NOT EXISTS ipa_records_status_idx      ON public.ipa_records (status);
CREATE INDEX IF NOT EXISTS ipa_records_created_idx     ON public.ipa_records (created_at DESC);

ALTER TABLE public.ipa_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ipa: student read own" ON public.ipa_records;
CREATE POLICY "ipa: student read own"
  ON public.ipa_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = ipa_records.application_id
        AND a.student_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "ipa: institution manage" ON public.ipa_records;
CREATE POLICY "ipa: institution manage"
  ON public.ipa_records FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = ipa_records.application_id
        AND public.user_owns_course_college(a.course_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = ipa_records.application_id
        AND public.user_owns_course_college(a.course_id)
    )
  );

DROP POLICY IF EXISTS "ipa: admin all" ON public.ipa_records;
CREATE POLICY "ipa: admin all"
  ON public.ipa_records FOR ALL
  USING (public.requesting_user_is_admin())
  WITH CHECK (public.requesting_user_is_admin());

DROP TRIGGER IF EXISTS trg_ipa_records_touch ON public.ipa_records;
CREATE TRIGGER trg_ipa_records_touch
  BEFORE UPDATE ON public.ipa_records
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


-- ─── 5. offer_letters: student decision columns ──────────────────────────────

ALTER TABLE public.offer_letters
  ADD COLUMN IF NOT EXISTS student_decision  TEXT
    CHECK (student_decision IN ('accepted','declined')),
  ADD COLUMN IF NOT EXISTS decision_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS decision_comment  TEXT;

-- Students must be able to record their decision on their own offer letters.
DROP POLICY IF EXISTS "offer_letters: student decide own" ON public.offer_letters;
CREATE POLICY "offer_letters: student decide own"
  ON public.offer_letters FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = offer_letters.application_id
        AND a.student_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = offer_letters.application_id
        AND a.student_id = auth.uid()
    )
  );


-- ─── 6. Storage bucket: ipa-documents (private) ──────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('ipa-documents', 'ipa-documents', false, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "ipa-documents: institution upload" ON storage.objects;
CREATE POLICY "ipa-documents: institution upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'ipa-documents'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('institution','admin')
    )
  );

DROP POLICY IF EXISTS "ipa-documents: institution read" ON storage.objects;
CREATE POLICY "ipa-documents: institution read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'ipa-documents'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('institution','admin')
    )
  );

-- Student downloads go through the server API (table RLS check + service-role
-- signed URL), so no student storage policy is required.


-- ─── 7. Realtime publications ────────────────────────────────────────────────
-- Enables live dashboard updates (student application tracker + notifications).
-- Wrapped so re-runs don't fail on duplicate membership.

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;


-- ─── Verification ────────────────────────────────────────────────────────────
SELECT 'document_requests'  AS table_name, COUNT(*) FROM public.document_requests
UNION ALL
SELECT 'application_notes',  COUNT(*) FROM public.application_notes
UNION ALL
SELECT 'ipa_records',        COUNT(*) FROM public.ipa_records;
