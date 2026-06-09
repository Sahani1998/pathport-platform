-- ═══════════════════════════════════════════════════════════════════════════════
-- PathPort — Sprint 9: Offer Letters
-- Safe to re-run. Paste into Supabase Dashboard → SQL Editor → Run.
--
-- Contents:
--   1. offer_letters table + indexes + RLS
--   2. Storage bucket "offer-letters" policies
-- ═══════════════════════════════════════════════════════════════════════════════


-- ── 1. offer_letters table ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.offer_letters (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID        NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  uploaded_by    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  file_path      TEXT        NOT NULL,
  file_name      TEXT        NOT NULL,
  file_size      BIGINT,
  version        INTEGER     NOT NULL DEFAULT 1,
  notes          TEXT,
  expiry_date    DATE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS offer_letters_application_idx
  ON public.offer_letters (application_id);

CREATE INDEX IF NOT EXISTS offer_letters_uploaded_by_idx
  ON public.offer_letters (uploaded_by);

CREATE INDEX IF NOT EXISTS offer_letters_created_idx
  ON public.offer_letters (created_at DESC);

ALTER TABLE public.offer_letters ENABLE ROW LEVEL SECURITY;

-- Student: read their own offer letters (via application ownership)
DROP POLICY IF EXISTS "offer_letters: student read own"      ON public.offer_letters;
-- Institution: read + insert for their college's applications
DROP POLICY IF EXISTS "offer_letters: institution scoped"    ON public.offer_letters;
-- Admin: full access
DROP POLICY IF EXISTS "offer_letters: admin all"             ON public.offer_letters;

CREATE POLICY "offer_letters: student read own"
  ON public.offer_letters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = offer_letters.application_id
        AND a.student_id = auth.uid()
    )
  );

CREATE POLICY "offer_letters: institution scoped"
  ON public.offer_letters FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.applications a
      JOIN public.courses     c ON c.id = a.course_id
      JOIN public.profiles    p ON p.id = auth.uid()
      WHERE a.id = offer_letters.application_id
        AND p.role = 'institution'
        AND p.college_id = c.college_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.applications a
      JOIN public.courses     c ON c.id = a.course_id
      JOIN public.profiles    p ON p.id = auth.uid()
      WHERE a.id = offer_letters.application_id
        AND p.role = 'institution'
        AND p.college_id = c.college_id
    )
  );

CREATE POLICY "offer_letters: admin all"
  ON public.offer_letters FOR ALL
  USING (public.requesting_user_is_admin());


-- ── 2. Storage: offer-letters bucket policies ─────────────────────────────────
-- Create the bucket first in the Supabase Dashboard:
--   Storage → New Bucket → Name: "offer-letters" → Private (NOT public)
--
-- Then run the storage policies below.
-- All downloads must go through signed URLs generated server-side.

-- Allow institution + admin users to upload files
DROP POLICY IF EXISTS "offer-letters: institution upload"  ON storage.objects;
DROP POLICY IF EXISTS "offer-letters: institution read"    ON storage.objects;
DROP POLICY IF EXISTS "offer-letters: admin all"           ON storage.objects;

CREATE POLICY "offer-letters: institution upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'offer-letters'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('institution', 'admin')
    )
  );

CREATE POLICY "offer-letters: institution read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'offer-letters'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('institution', 'admin')
    )
  );

CREATE POLICY "offer-letters: admin all"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'offer-letters'
    AND public.requesting_user_is_admin()
  );
