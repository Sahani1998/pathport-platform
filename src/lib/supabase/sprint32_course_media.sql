-- ────────────────────────────────────────────────────────────────────────────
-- Sprint 32 — Course Media Upload System
-- Run once in the Supabase SQL Editor (safe to re-run: IF NOT EXISTS / ON CONFLICT).
-- ────────────────────────────────────────────────────────────────────────────

-- ── 1. Storage bucket: course-media ──────────────────────────────────────────
-- Separate from institution-media: supports PDF (brochure) and images up to 10 MB.
-- Path convention: {college_id}/{course_id}/{type}/{filename}
-- where type ∈ { thumbnail, brochure, gallery }
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-media',
  'course-media',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- ── 2. Storage RLS policies ───────────────────────────────────────────────────
-- The first path segment ([1]) is always college_id.

-- Public read
CREATE POLICY "course_media_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'course-media');

-- Institution write: own college folder only
CREATE POLICY "course_media_institution_write"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'course-media'
    AND (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'institution'
          AND p.college_id::text = (storage.foldername(name))[1]
      )
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'admin'
      )
    )
  );

CREATE POLICY "course_media_institution_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'course-media'
    AND (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'institution'
          AND p.college_id::text = (storage.foldername(name))[1]
      )
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'admin'
      )
    )
  );

CREATE POLICY "course_media_institution_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'course-media'
    AND (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'institution'
          AND p.college_id::text = (storage.foldername(name))[1]
      )
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'admin'
      )
    )
  );

-- ── 3. New columns on courses ──────────────────────────────────────────────────
-- Store the storage path alongside the public URL so we can delete the old file
-- when a thumbnail or brochure is replaced.
-- The existing gallery_images JSONB column is retained but superseded by course_gallery.
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS thumbnail_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS brochure_storage_path  TEXT;

-- ── 4. course_gallery table ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS course_gallery (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id        UUID        NOT NULL REFERENCES courses(id)  ON DELETE CASCADE,
  college_id       UUID        NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  storage_path     TEXT        NOT NULL,
  public_url       TEXT        NOT NULL,
  alt_text         TEXT,
  sort_order       INTEGER     NOT NULL DEFAULT 0,
  file_size_bytes  BIGINT,
  uploaded_by      UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_gallery_course_sort
  ON course_gallery(course_id, sort_order);

ALTER TABLE course_gallery ENABLE ROW LEVEL SECURITY;

-- Public read: gallery of published courses
CREATE POLICY "course_gallery_public_read"
  ON course_gallery FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = course_gallery.course_id AND c.is_published = true
    )
  );

-- Institution: full control over own college's gallery
CREATE POLICY "course_gallery_institution_manage"
  ON course_gallery FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'institution'
        AND p.college_id = course_gallery.college_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'institution'
        AND p.college_id = course_gallery.college_id
    )
  );

-- Admin: full control over all galleries
CREATE POLICY "course_gallery_admin_all"
  ON course_gallery FOR ALL
  USING   (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── 5. course_media_audit table ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS course_media_audit (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id        UUID        NOT NULL REFERENCES courses(id)  ON DELETE CASCADE,
  college_id       UUID        NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action           TEXT        NOT NULL,
  storage_path     TEXT,
  file_size_bytes  BIGINT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_media_audit_course
  ON course_media_audit(course_id, created_at DESC);

ALTER TABLE course_media_audit ENABLE ROW LEVEL SECURITY;

-- Admin: read all audit entries
CREATE POLICY "course_media_audit_admin_read"
  ON course_media_audit FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Institution: read audit for own college
CREATE POLICY "course_media_audit_institution_read"
  ON course_media_audit FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'institution'
        AND p.college_id = course_media_audit.college_id
    )
  );
-- Audit inserts are done server-side via service role — no user INSERT policy needed.
