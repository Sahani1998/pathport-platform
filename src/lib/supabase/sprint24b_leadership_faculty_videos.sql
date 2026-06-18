-- Sprint 24B: Institution Videos, Leadership & Faculty
-- Section 3: Videos (YouTube/Vimeo embeds with stored embed URLs)
-- Section 4: Leadership Team person profiles with headshots
-- Section 5: Faculty profiles with department, qualifications, headshots
-- Idempotent — safe to run multiple times.

-- ── 1. institution_videos ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS institution_videos (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id   UUID        NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL,
  description  TEXT,
  video_url    TEXT        NOT NULL,
  embed_url    TEXT,
  status       TEXT        NOT NULL DEFAULT 'draft'
               CHECK (status IN ('draft', 'published', 'archived')),
  sort_order   INT         NOT NULL DEFAULT 0,
  uploaded_by  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  archived_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS institution_videos_college_idx ON institution_videos (college_id);
CREATE INDEX IF NOT EXISTS institution_videos_status_idx  ON institution_videos (college_id, status);
CREATE INDEX IF NOT EXISTS institution_videos_sort_idx    ON institution_videos (college_id, sort_order);

CREATE OR REPLACE FUNCTION set_institution_videos_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS institution_videos_updated_at ON institution_videos;
CREATE TRIGGER institution_videos_updated_at
  BEFORE UPDATE ON institution_videos
  FOR EACH ROW EXECUTE FUNCTION set_institution_videos_updated_at();

-- ── 2. institution_leadership ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS institution_leadership (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id          UUID        NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  name                TEXT        NOT NULL,
  role                TEXT        NOT NULL,
  bio                 TEXT,
  photo_storage_path  TEXT,
  photo_url           TEXT,
  status              TEXT        NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft', 'published', 'archived')),
  sort_order          INT         NOT NULL DEFAULT 0,
  uploaded_by         UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at        TIMESTAMPTZ,
  archived_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS institution_leadership_college_idx ON institution_leadership (college_id);
CREATE INDEX IF NOT EXISTS institution_leadership_status_idx  ON institution_leadership (college_id, status);
CREATE INDEX IF NOT EXISTS institution_leadership_sort_idx    ON institution_leadership (college_id, sort_order);

CREATE OR REPLACE FUNCTION set_institution_leadership_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS institution_leadership_updated_at ON institution_leadership;
CREATE TRIGGER institution_leadership_updated_at
  BEFORE UPDATE ON institution_leadership
  FOR EACH ROW EXECUTE FUNCTION set_institution_leadership_updated_at();

-- ── 3. institution_faculty ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS institution_faculty (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id          UUID        NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  name                TEXT        NOT NULL,
  title               TEXT        NOT NULL,
  department          TEXT,
  qualifications      TEXT,
  bio                 TEXT,
  photo_storage_path  TEXT,
  photo_url           TEXT,
  status              TEXT        NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft', 'published', 'archived')),
  sort_order          INT         NOT NULL DEFAULT 0,
  uploaded_by         UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at        TIMESTAMPTZ,
  archived_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS institution_faculty_college_idx ON institution_faculty (college_id);
CREATE INDEX IF NOT EXISTS institution_faculty_status_idx  ON institution_faculty (college_id, status);
CREATE INDEX IF NOT EXISTS institution_faculty_sort_idx    ON institution_faculty (college_id, sort_order);
CREATE INDEX IF NOT EXISTS institution_faculty_dept_idx    ON institution_faculty (college_id, department);

CREATE OR REPLACE FUNCTION set_institution_faculty_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS institution_faculty_updated_at ON institution_faculty;
CREATE TRIGGER institution_faculty_updated_at
  BEFORE UPDATE ON institution_faculty
  FOR EACH ROW EXECUTE FUNCTION set_institution_faculty_updated_at();

-- ── 4. RLS — institution_videos ──────────────────────────────────────────────────
ALTER TABLE institution_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_published_videos"  ON institution_videos;
DROP POLICY IF EXISTS "institution_manage_own_videos" ON institution_videos;
DROP POLICY IF EXISTS "admin_manage_all_videos"       ON institution_videos;

CREATE POLICY "public_read_published_videos"
  ON institution_videos FOR SELECT USING (status = 'published');

CREATE POLICY "institution_manage_own_videos"
  ON institution_videos FOR ALL
  USING (college_id IN (SELECT college_id FROM profiles WHERE id = auth.uid() AND role = 'institution'))
  WITH CHECK (college_id IN (SELECT college_id FROM profiles WHERE id = auth.uid() AND role = 'institution'));

CREATE POLICY "admin_manage_all_videos"
  ON institution_videos FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── 5. RLS — institution_leadership ─────────────────────────────────────────────
ALTER TABLE institution_leadership ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_published_leadership"  ON institution_leadership;
DROP POLICY IF EXISTS "institution_manage_own_leadership" ON institution_leadership;
DROP POLICY IF EXISTS "admin_manage_all_leadership"       ON institution_leadership;

CREATE POLICY "public_read_published_leadership"
  ON institution_leadership FOR SELECT USING (status = 'published');

CREATE POLICY "institution_manage_own_leadership"
  ON institution_leadership FOR ALL
  USING (college_id IN (SELECT college_id FROM profiles WHERE id = auth.uid() AND role = 'institution'))
  WITH CHECK (college_id IN (SELECT college_id FROM profiles WHERE id = auth.uid() AND role = 'institution'));

CREATE POLICY "admin_manage_all_leadership"
  ON institution_leadership FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── 6. RLS — institution_faculty ─────────────────────────────────────────────────
ALTER TABLE institution_faculty ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_published_faculty"  ON institution_faculty;
DROP POLICY IF EXISTS "institution_manage_own_faculty" ON institution_faculty;
DROP POLICY IF EXISTS "admin_manage_all_faculty"       ON institution_faculty;

CREATE POLICY "public_read_published_faculty"
  ON institution_faculty FOR SELECT USING (status = 'published');

CREATE POLICY "institution_manage_own_faculty"
  ON institution_faculty FOR ALL
  USING (college_id IN (SELECT college_id FROM profiles WHERE id = auth.uid() AND role = 'institution'))
  WITH CHECK (college_id IN (SELECT college_id FROM profiles WHERE id = auth.uid() AND role = 'institution'));

CREATE POLICY "admin_manage_all_faculty"
  ON institution_faculty FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
