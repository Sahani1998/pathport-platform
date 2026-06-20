-- Sprint 31: Admin-Controlled Public Content
-- Tables: public_destinations, public_qualification_levels,
--         public_pathway_cards, public_page_sections
-- Idempotent — safe to run multiple times.
-- Apply in: Supabase Dashboard → SQL Editor

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. public_destinations
--    Controls the DestinationPathway section on the homepage.
--    destination_status: 'live' shows green chip; 'coming_soon' shows grey chip;
--    'hidden' removes the card from public display entirely.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public_destinations (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                TEXT        NOT NULL UNIQUE,
  name                TEXT        NOT NULL,
  flag                TEXT        NOT NULL,
  headline            TEXT        NOT NULL,
  destination_status  TEXT        NOT NULL DEFAULT 'coming_soon'
                      CHECK (destination_status IN ('live', 'coming_soon', 'hidden')),
  display_order       INT         NOT NULL DEFAULT 0,
  status              TEXT        NOT NULL DEFAULT 'published'
                      CHECK (status IN ('draft', 'published')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS public_destinations_order_idx  ON public_destinations (display_order);
CREATE INDEX IF NOT EXISTS public_destinations_status_idx ON public_destinations (status);

CREATE OR REPLACE FUNCTION set_public_destinations_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS public_destinations_updated_at ON public_destinations;
CREATE TRIGGER public_destinations_updated_at
  BEFORE UPDATE ON public_destinations
  FOR EACH ROW EXECUTE FUNCTION set_public_destinations_updated_at();

ALTER TABLE public_destinations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_destinations"   ON public_destinations;
DROP POLICY IF EXISTS "admin_manage_destinations"  ON public_destinations;

CREATE POLICY "public_read_destinations"
  ON public_destinations FOR SELECT
  USING (status = 'published' AND destination_status != 'hidden');

CREATE POLICY "admin_manage_destinations"
  ON public_destinations FOR ALL
  USING  (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. public_qualification_levels
--    Controls the DiplomaProgressionPathway section on /colleges.
--    Ordered by display_order. is_highlighted adds the gold ring accent card.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public_qualification_levels (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT        NOT NULL UNIQUE,
  label           TEXT        NOT NULL,
  duration        TEXT        NOT NULL,
  body            TEXT        NOT NULL,
  is_highlighted  BOOLEAN     NOT NULL DEFAULT false,
  display_order   INT         NOT NULL DEFAULT 0,
  status          TEXT        NOT NULL DEFAULT 'published'
                  CHECK (status IN ('draft', 'published', 'archived')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS public_qual_levels_order_idx  ON public_qualification_levels (display_order);
CREATE INDEX IF NOT EXISTS public_qual_levels_status_idx ON public_qualification_levels (status);

CREATE OR REPLACE FUNCTION set_public_qual_levels_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS public_qual_levels_updated_at ON public_qualification_levels;
CREATE TRIGGER public_qual_levels_updated_at
  BEFORE UPDATE ON public_qualification_levels
  FOR EACH ROW EXECUTE FUNCTION set_public_qual_levels_updated_at();

ALTER TABLE public_qualification_levels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_qual_levels"  ON public_qualification_levels;
DROP POLICY IF EXISTS "admin_manage_qual_levels" ON public_qualification_levels;

CREATE POLICY "public_read_qual_levels"
  ON public_qualification_levels FOR SELECT
  USING (status = 'published');

CREATE POLICY "admin_manage_qual_levels"
  ON public_qualification_levels FOR ALL
  USING  (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. public_pathway_cards
--    Controls the DiplomaTypesExplained section on /courses.
--    icon_name: Lucide icon component name (e.g. "BookOpen", "Award").
--    subjects: JSONB array of subject strings.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public_pathway_cards (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  icon_name        TEXT        NOT NULL DEFAULT 'BookOpen',
  level            TEXT        NOT NULL,
  badge            TEXT        NOT NULL,
  what_it_is       TEXT        NOT NULL,
  who_its_for      TEXT        NOT NULL,
  typical_duration TEXT        NOT NULL,
  subjects         JSONB       NOT NULL DEFAULT '[]',
  whats_next       TEXT        NOT NULL,
  filter_param     TEXT        NOT NULL,
  display_order    INT         NOT NULL DEFAULT 0,
  status           TEXT        NOT NULL DEFAULT 'published'
                   CHECK (status IN ('draft', 'published', 'archived')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS public_pathway_cards_order_idx  ON public_pathway_cards (display_order);
CREATE INDEX IF NOT EXISTS public_pathway_cards_status_idx ON public_pathway_cards (status);

CREATE OR REPLACE FUNCTION set_public_pathway_cards_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS public_pathway_cards_updated_at ON public_pathway_cards;
CREATE TRIGGER public_pathway_cards_updated_at
  BEFORE UPDATE ON public_pathway_cards
  FOR EACH ROW EXECUTE FUNCTION set_public_pathway_cards_updated_at();

ALTER TABLE public_pathway_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_pathway_cards"  ON public_pathway_cards;
DROP POLICY IF EXISTS "admin_manage_pathway_cards" ON public_pathway_cards;

CREATE POLICY "public_read_pathway_cards"
  ON public_pathway_cards FOR SELECT
  USING (status = 'published');

CREATE POLICY "admin_manage_pathway_cards"
  ON public_pathway_cards FOR ALL
  USING  (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. public_page_sections
--    Generic key-value content store for simple public page sections.
--    section_key + item_key must be unique. Data stored as JSONB.
--    Current use: section_key='duration_guide' for DurationGuide.tsx rows.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public_page_sections (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key     TEXT        NOT NULL,
  item_key        TEXT        NOT NULL,
  data            JSONB       NOT NULL DEFAULT '{}',
  display_order   INT         NOT NULL DEFAULT 0,
  status          TEXT        NOT NULL DEFAULT 'published'
                  CHECK (status IN ('draft', 'published', 'archived')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (section_key, item_key)
);

CREATE INDEX IF NOT EXISTS public_page_sections_key_idx   ON public_page_sections (section_key, status);
CREATE INDEX IF NOT EXISTS public_page_sections_order_idx ON public_page_sections (section_key, display_order);

CREATE OR REPLACE FUNCTION set_public_page_sections_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS public_page_sections_updated_at ON public_page_sections;
CREATE TRIGGER public_page_sections_updated_at
  BEFORE UPDATE ON public_page_sections
  FOR EACH ROW EXECUTE FUNCTION set_public_page_sections_updated_at();

ALTER TABLE public_page_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_page_sections"  ON public_page_sections;
DROP POLICY IF EXISTS "admin_manage_page_sections" ON public_page_sections;

CREATE POLICY "public_read_page_sections"
  ON public_page_sections FOR SELECT
  USING (status = 'published');

CREATE POLICY "admin_manage_page_sections"
  ON public_page_sections FOR ALL
  USING  (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));


-- ─────────────────────────────────────────────────────────────────────────────
-- SEED DATA — mirrors the hardcoded arrays replaced by these tables
-- Uses INSERT ... ON CONFLICT DO NOTHING so reruns are safe
-- ─────────────────────────────────────────────────────────────────────────────

-- public_destinations seed
INSERT INTO public_destinations (slug, name, flag, headline, destination_status, display_order, status) VALUES
  ('singapore',   'Singapore',     '🇸🇬', 'Full programme access — apply now.',          'live',         0, 'published'),
  ('australia',   'Australia',     '🇦🇺', 'Coming soon — register your interest.',        'coming_soon',  1, 'published'),
  ('new-zealand', 'New Zealand',   '🇳🇿', 'Coming soon — register your interest.',        'coming_soon',  2, 'published'),
  ('canada',      'Canada',        '🇨🇦', 'Coming soon — register your interest.',        'coming_soon',  3, 'published'),
  ('uk',          'United Kingdom','🇬🇧', 'Coming soon — register your interest.',        'coming_soon',  4, 'published'),
  ('europe',      'Europe',        '🇪🇺', 'Coming soon — register your interest.',        'coming_soon',  5, 'published')
ON CONFLICT (slug) DO NOTHING;

-- public_qualification_levels seed
INSERT INTO public_qualification_levels (code, label, duration, body, is_highlighted, display_order, status) VALUES
  ('CERT',       'Certificate',       '3–6 months',   'Short, foundational. Often used to bridge into Diploma entry.',                                false, 0, 'published'),
  ('DIP',        'Diploma',           '12–24 months', 'Industry-focused entry-level qualification. Most popular starting point.',                      false, 1, 'published'),
  ('ADV DIP',    'Advanced Diploma',  '6–18 months',  'Builds on a Diploma. Specialisation in a chosen subject area.',                                 false, 2, 'published'),
  ('HIGHER DIP', 'Higher Diploma',    '12–24 months', 'Stepping stone to degree programmes. Strong university progression.',                            false, 3, 'published'),
  ('SPEC DIP',   'Specialist Diploma','6–12 months',  'Applied, industry-aligned. Often for working professionals.',                                    true,  4, 'published')
ON CONFLICT (code) DO NOTHING;

-- public_pathway_cards seed
INSERT INTO public_pathway_cards (icon_name, level, badge, what_it_is, who_its_for, typical_duration, subjects, whats_next, filter_param, display_order, status) VALUES
  (
    'BookOpen', 'Diploma', 'Foundation',
    'Entry-level qualification recognised across Singapore and most ASEAN employers. Practical, industry-focused curriculum built around what employers actually hire for.',
    'Students completing 10th or 12th standard (CBSE, ICSE, State Board) who want a structured, faster route into industry than a 3–4 year degree programme.',
    '12–18 months typical',
    '["Business Administration","Information Technology","Hospitality Management","Engineering Technology","Mass Communication","Early Childhood Education"]',
    'Progress to Advanced Diploma, enter the workforce, or apply for university advanced standing.',
    'diploma', 0, 'published'
  ),
  (
    'Award', 'Advanced Diploma', 'Intermediate',
    'Builds directly on a Diploma qualification with deeper subject mastery, specialisation, and management skills. The natural next step for diploma graduates.',
    'Students who hold a Diploma or equivalent qualification and want to deepen their expertise before entering a degree or senior role.',
    '12–18 months typical',
    '["Advanced Business Management","Advanced IT & Networking","Digital Marketing","Supply Chain Management","Financial Services","Advanced Hospitality Operations"]',
    'Stack into a Higher Diploma, enter the workforce in a more senior role, or apply for degree entry.',
    'advanced_diploma', 1, 'published'
  ),
  (
    'GraduationCap', 'Higher Diploma', 'Near-Degree',
    'The most advanced diploma tier — comparable in academic depth to the first year of a Bachelor''s degree. Many universities accept Higher Diploma graduates with advanced standing.',
    'Students aiming for a degree but who prefer to spread the cost and time, or who want a strong professional qualification on its own.',
    '18–24 months typical',
    '["Business with Finance","Computing & Software Engineering","International Hospitality Management","Design & Visual Communication","Healthcare Management","Psychology & Counselling"]',
    'Direct entry into Year 2 or Year 3 of a Bachelor''s programme in Singapore, the UK, Australia, or Canada (university-dependent).',
    'advanced_diploma', 2, 'published'
  ),
  (
    'Star', 'Specialist Diploma', 'Specialisation',
    'Applied, industry-aligned qualifications built for a specific role or technology. Often shorter and frequently designed for working professionals as well as fresh graduates.',
    'Diploma or degree holders looking to upskill in a focused domain, plus working professionals seeking certification without committing to a full degree.',
    '6–12 months typical',
    '["Cybersecurity Operations","Digital Business Transformation","Culinary Arts & F&B Management","Real Estate & Property Management","Human Resource Leadership","Project Management"]',
    'Directly into a specialised role, or stack with other diplomas for a broader skill portfolio.',
    'graduate_diploma', 3, 'published'
  )
ON CONFLICT DO NOTHING;

-- public_page_sections seed (duration_guide)
INSERT INTO public_page_sections (section_key, item_key, data, display_order, status) VALUES
  ('duration_guide', 'diploma', '{"level_label":"Diploma","full_time":"12 – 18 months","part_time":"18 – 24 months","internship":"Optional, structured"}', 0, 'published'),
  ('duration_guide', 'advanced_diploma', '{"level_label":"Advanced Diploma","full_time":"12 – 18 months","part_time":"18 – 24 months","internship":"Common (3 – 6 months)"}', 1, 'published'),
  ('duration_guide', 'higher_diploma', '{"level_label":"Higher Diploma","full_time":"18 – 24 months","part_time":"24 – 30 months","internship":"Common (6 months)"}', 2, 'published'),
  ('duration_guide', 'specialist_diploma', '{"level_label":"Specialist Diploma","full_time":"6 – 12 months","part_time":"9 – 15 months","internship":"Rare (often working professionals)"}', 3, 'published')
ON CONFLICT (section_key, item_key) DO NOTHING;
