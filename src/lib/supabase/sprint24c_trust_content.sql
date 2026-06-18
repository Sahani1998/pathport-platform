-- Sprint 24C: Facilities, Accreditations, Testimonials & Success Stories
-- Section 6: Facilities (labs, library, sports, accommodation, etc.)
-- Section 7: Accreditations (certifications, awards, recognitions)
-- Section 8: Testimonials (student quotes with photos)
-- Section 9: Success Stories (alumni career outcomes)
-- Idempotent — safe to run multiple times.

-- ── 1. institution_facilities ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS institution_facilities (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id          UUID        NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  name                TEXT        NOT NULL,
  description         TEXT,
  category            TEXT,
  cover_storage_path  TEXT,
  cover_image_url     TEXT,
  status              TEXT        NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft', 'published', 'archived')),
  sort_order          INT         NOT NULL DEFAULT 0,
  uploaded_by         UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at        TIMESTAMPTZ,
  archived_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS institution_facilities_college_idx ON institution_facilities (college_id);
CREATE INDEX IF NOT EXISTS institution_facilities_status_idx  ON institution_facilities (college_id, status);
CREATE INDEX IF NOT EXISTS institution_facilities_sort_idx    ON institution_facilities (college_id, sort_order);

CREATE OR REPLACE FUNCTION set_institution_facilities_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS institution_facilities_updated_at ON institution_facilities;
CREATE TRIGGER institution_facilities_updated_at
  BEFORE UPDATE ON institution_facilities
  FOR EACH ROW EXECUTE FUNCTION set_institution_facilities_updated_at();

-- ── 2. institution_accreditations ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS institution_accreditations (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id          UUID        NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  name                TEXT        NOT NULL,
  issuing_body        TEXT        NOT NULL,
  description         TEXT,
  logo_storage_path   TEXT,
  logo_url            TEXT,
  year_awarded        INT,
  valid_until         INT,
  status              TEXT        NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft', 'published', 'archived')),
  sort_order          INT         NOT NULL DEFAULT 0,
  uploaded_by         UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at        TIMESTAMPTZ,
  archived_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS institution_accreditations_college_idx ON institution_accreditations (college_id);
CREATE INDEX IF NOT EXISTS institution_accreditations_status_idx  ON institution_accreditations (college_id, status);
CREATE INDEX IF NOT EXISTS institution_accreditations_sort_idx    ON institution_accreditations (college_id, sort_order);

CREATE OR REPLACE FUNCTION set_institution_accreditations_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS institution_accreditations_updated_at ON institution_accreditations;
CREATE TRIGGER institution_accreditations_updated_at
  BEFORE UPDATE ON institution_accreditations
  FOR EACH ROW EXECUTE FUNCTION set_institution_accreditations_updated_at();

-- ── 3. institution_testimonials ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS institution_testimonials (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id               UUID        NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  student_name             TEXT        NOT NULL,
  course_name              TEXT,
  graduation_year          INT,
  testimonial_text         TEXT        NOT NULL,
  rating                   INT         CHECK (rating BETWEEN 1 AND 5),
  student_photo_storage_path TEXT,
  student_photo_url        TEXT,
  status                   TEXT        NOT NULL DEFAULT 'draft'
                           CHECK (status IN ('draft', 'published', 'archived')),
  sort_order               INT         NOT NULL DEFAULT 0,
  uploaded_by              UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at             TIMESTAMPTZ,
  archived_at              TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS institution_testimonials_college_idx ON institution_testimonials (college_id);
CREATE INDEX IF NOT EXISTS institution_testimonials_status_idx  ON institution_testimonials (college_id, status);
CREATE INDEX IF NOT EXISTS institution_testimonials_sort_idx    ON institution_testimonials (college_id, sort_order);

CREATE OR REPLACE FUNCTION set_institution_testimonials_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS institution_testimonials_updated_at ON institution_testimonials;
CREATE TRIGGER institution_testimonials_updated_at
  BEFORE UPDATE ON institution_testimonials
  FOR EACH ROW EXECUTE FUNCTION set_institution_testimonials_updated_at();

-- ── 4. institution_success_stories ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS institution_success_stories (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id          UUID        NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  person_name         TEXT        NOT NULL,
  course_name         TEXT,
  graduation_year     INT,
  current_role        TEXT,
  current_company     TEXT,
  story_text          TEXT        NOT NULL,
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

CREATE INDEX IF NOT EXISTS institution_success_stories_college_idx ON institution_success_stories (college_id);
CREATE INDEX IF NOT EXISTS institution_success_stories_status_idx  ON institution_success_stories (college_id, status);
CREATE INDEX IF NOT EXISTS institution_success_stories_sort_idx    ON institution_success_stories (college_id, sort_order);

CREATE OR REPLACE FUNCTION set_institution_success_stories_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS institution_success_stories_updated_at ON institution_success_stories;
CREATE TRIGGER institution_success_stories_updated_at
  BEFORE UPDATE ON institution_success_stories
  FOR EACH ROW EXECUTE FUNCTION set_institution_success_stories_updated_at();

-- ── 5. RLS — institution_facilities ─────────────────────────────────────────────
ALTER TABLE institution_facilities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_published_facilities"  ON institution_facilities;
DROP POLICY IF EXISTS "institution_manage_own_facilities" ON institution_facilities;
DROP POLICY IF EXISTS "admin_manage_all_facilities"       ON institution_facilities;

CREATE POLICY "public_read_published_facilities"
  ON institution_facilities FOR SELECT USING (status = 'published');
CREATE POLICY "institution_manage_own_facilities"
  ON institution_facilities FOR ALL
  USING (college_id IN (SELECT college_id FROM profiles WHERE id = auth.uid() AND role = 'institution'))
  WITH CHECK (college_id IN (SELECT college_id FROM profiles WHERE id = auth.uid() AND role = 'institution'));
CREATE POLICY "admin_manage_all_facilities"
  ON institution_facilities FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── 6. RLS — institution_accreditations ─────────────────────────────────────────
ALTER TABLE institution_accreditations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_published_accreditations"  ON institution_accreditations;
DROP POLICY IF EXISTS "institution_manage_own_accreditations" ON institution_accreditations;
DROP POLICY IF EXISTS "admin_manage_all_accreditations"       ON institution_accreditations;

CREATE POLICY "public_read_published_accreditations"
  ON institution_accreditations FOR SELECT USING (status = 'published');
CREATE POLICY "institution_manage_own_accreditations"
  ON institution_accreditations FOR ALL
  USING (college_id IN (SELECT college_id FROM profiles WHERE id = auth.uid() AND role = 'institution'))
  WITH CHECK (college_id IN (SELECT college_id FROM profiles WHERE id = auth.uid() AND role = 'institution'));
CREATE POLICY "admin_manage_all_accreditations"
  ON institution_accreditations FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── 7. RLS — institution_testimonials ───────────────────────────────────────────
ALTER TABLE institution_testimonials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_published_testimonials"  ON institution_testimonials;
DROP POLICY IF EXISTS "institution_manage_own_testimonials" ON institution_testimonials;
DROP POLICY IF EXISTS "admin_manage_all_testimonials"       ON institution_testimonials;

CREATE POLICY "public_read_published_testimonials"
  ON institution_testimonials FOR SELECT USING (status = 'published');
CREATE POLICY "institution_manage_own_testimonials"
  ON institution_testimonials FOR ALL
  USING (college_id IN (SELECT college_id FROM profiles WHERE id = auth.uid() AND role = 'institution'))
  WITH CHECK (college_id IN (SELECT college_id FROM profiles WHERE id = auth.uid() AND role = 'institution'));
CREATE POLICY "admin_manage_all_testimonials"
  ON institution_testimonials FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── 8. RLS — institution_success_stories ────────────────────────────────────────
ALTER TABLE institution_success_stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_published_success_stories"  ON institution_success_stories;
DROP POLICY IF EXISTS "institution_manage_own_success_stories" ON institution_success_stories;
DROP POLICY IF EXISTS "admin_manage_all_success_stories"       ON institution_success_stories;

CREATE POLICY "public_read_published_success_stories"
  ON institution_success_stories FOR SELECT USING (status = 'published');
CREATE POLICY "institution_manage_own_success_stories"
  ON institution_success_stories FOR ALL
  USING (college_id IN (SELECT college_id FROM profiles WHERE id = auth.uid() AND role = 'institution'))
  WITH CHECK (college_id IN (SELECT college_id FROM profiles WHERE id = auth.uid() AND role = 'institution'));
CREATE POLICY "admin_manage_all_success_stories"
  ON institution_success_stories FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
