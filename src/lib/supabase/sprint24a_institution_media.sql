-- Sprint 24A: Institution Branding & Campus Gallery
-- Section 1: Branding (logo, cover, tagline, colours, descriptions, mission, vision)
-- Section 2: Campus Gallery (institution_media table, draft/published/archived lifecycle)

-- ── 1. Extend colleges with branding columns ────────────────────────────────────
ALTER TABLE colleges
  ADD COLUMN IF NOT EXISTS cover_image_url        TEXT,
  ADD COLUMN IF NOT EXISTS tagline                TEXT,
  ADD COLUMN IF NOT EXISTS brand_colour_primary   TEXT,
  ADD COLUMN IF NOT EXISTS brand_colour_secondary TEXT,
  ADD COLUMN IF NOT EXISTS short_description      TEXT,
  ADD COLUMN IF NOT EXISTS mission                TEXT,
  ADD COLUMN IF NOT EXISTS vision                 TEXT,
  ADD COLUMN IF NOT EXISTS introduction           TEXT;

-- ── 2. institution_media table ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS institution_media (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id      UUID        NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  media_type      TEXT        NOT NULL DEFAULT 'gallery_image',
  category        TEXT,
  title           TEXT,
  caption         TEXT,
  alt_text        TEXT,
  storage_path    TEXT        NOT NULL,
  public_url      TEXT        NOT NULL,
  file_size_bytes BIGINT,
  status          TEXT        NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'published', 'archived')),
  sort_order      INT         NOT NULL DEFAULT 0,
  uploaded_by     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at    TIMESTAMPTZ,
  archived_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS institution_media_college_idx  ON institution_media (college_id);
CREATE INDEX IF NOT EXISTS institution_media_status_idx   ON institution_media (college_id, status);
CREATE INDEX IF NOT EXISTS institution_media_type_idx     ON institution_media (college_id, media_type);
CREATE INDEX IF NOT EXISTS institution_media_sort_idx     ON institution_media (college_id, sort_order);

CREATE OR REPLACE FUNCTION set_institution_media_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS institution_media_updated_at ON institution_media;
CREATE TRIGGER institution_media_updated_at
  BEFORE UPDATE ON institution_media
  FOR EACH ROW EXECUTE FUNCTION set_institution_media_updated_at();

-- ── 3. RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE institution_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_published_media"      ON institution_media;
DROP POLICY IF EXISTS "institution_manage_own_media"     ON institution_media;
DROP POLICY IF EXISTS "admin_manage_all_media"           ON institution_media;

-- Public: read published images (used by public college page)
CREATE POLICY "public_read_published_media"
  ON institution_media FOR SELECT
  USING (status = 'published');

-- Institution: full CRUD on own college's media
CREATE POLICY "institution_manage_own_media"
  ON institution_media FOR ALL
  USING (
    college_id IN (
      SELECT college_id FROM profiles
      WHERE id = auth.uid() AND role = 'institution'
    )
  )
  WITH CHECK (
    college_id IN (
      SELECT college_id FROM profiles
      WHERE id = auth.uid() AND role = 'institution'
    )
  );

-- Admin: full access
CREATE POLICY "admin_manage_all_media"
  ON institution_media FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── 4. Storage bucket: institution-media ────────────────────────────────────────
-- Public bucket — images served on public college pages without signed URLs.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'institution-media',
  'institution-media',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies
DROP POLICY IF EXISTS "institution_media_public_read"           ON storage.objects;
DROP POLICY IF EXISTS "institution_media_institution_insert"    ON storage.objects;
DROP POLICY IF EXISTS "institution_media_institution_update"    ON storage.objects;
DROP POLICY IF EXISTS "institution_media_institution_delete"    ON storage.objects;

-- Anon + authenticated: read any file in this bucket (it's public)
CREATE POLICY "institution_media_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'institution-media');

-- Institution or admin: upload to their own college_id folder
CREATE POLICY "institution_media_institution_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'institution-media'
    AND (storage.foldername(name))[1] IN (
      SELECT college_id::text FROM profiles
      WHERE id = auth.uid() AND role IN ('institution', 'admin')
    )
  );

CREATE POLICY "institution_media_institution_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'institution-media'
    AND (storage.foldername(name))[1] IN (
      SELECT college_id::text FROM profiles
      WHERE id = auth.uid() AND role IN ('institution', 'admin')
    )
  );

CREATE POLICY "institution_media_institution_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'institution-media'
    AND (storage.foldername(name))[1] IN (
      SELECT college_id::text FROM profiles
      WHERE id = auth.uid() AND role IN ('institution', 'admin')
    )
  );
