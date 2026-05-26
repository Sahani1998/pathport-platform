-- ═══════════════════════════════════════════════════════════════════════════════
-- PathPort — Course Management & Application System
-- Paste this entire file into Supabase Dashboard → SQL Editor → Run
-- Safe to re-run: all statements use IF NOT EXISTS / OR REPLACE
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── 0. Extend profiles with college linkage ─────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS college_id UUID REFERENCES public.colleges(id) ON DELETE SET NULL;

-- NOTE: Run the rest of the file FIRST (so public.colleges exists), then
-- run the ALTER TABLE above, or just run the whole file — Postgres resolves
-- forward refs within a single transaction.

-- ── 1. Colleges ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.colleges (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  slug        TEXT        NOT NULL UNIQUE,
  logo_url    TEXT,
  country     TEXT        NOT NULL DEFAULT 'Singapore',
  city        TEXT        NOT NULL DEFAULT 'Singapore',
  description TEXT,
  website     TEXT,
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ          DEFAULT NOW()
);

-- ── 2. Courses ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.courses (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id       UUID        NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
  title            TEXT        NOT NULL,
  slug             TEXT        NOT NULL UNIQUE,
  category         TEXT        NOT NULL,
  description      TEXT,
  duration_months  INTEGER     NOT NULL DEFAULT 12,
  tuition_fee      NUMERIC(10,2) NOT NULL DEFAULT 0,
  application_fee  NUMERIC(10,2) NOT NULL DEFAULT 0,
  intake_date      DATE,
  seats_total      INTEGER     NOT NULL DEFAULT 30,
  seats_filled     INTEGER     NOT NULL DEFAULT 0,
  study_mode       TEXT        NOT NULL DEFAULT 'full_time'
                               CHECK (study_mode IN ('full_time','part_time')),
  level            TEXT        NOT NULL DEFAULT 'diploma'
                               CHECK (level IN ('diploma','advanced_diploma','graduate_diploma','certificate')),
  status           TEXT        NOT NULL DEFAULT 'open'
                               CHECK (status IN ('open','closed','draft')),
  created_at       TIMESTAMPTZ          DEFAULT NOW()
);

-- ── 3. Applications ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.applications (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id    UUID        NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  status       TEXT        NOT NULL DEFAULT 'submitted'
                           CHECK (status IN (
                             'submitted','under_review','docs_required',
                             'offer_ready','ipa_processing','approved','rejected'
                           )),
  notes        TEXT,
  submitted_at TIMESTAMPTZ          DEFAULT NOW(),
  updated_at   TIMESTAMPTZ          DEFAULT NOW(),
  UNIQUE (student_id, course_id)   -- no duplicate applications
);

-- ── 4. Indexes ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS courses_college_id_idx   ON public.courses (college_id);
CREATE INDEX IF NOT EXISTS courses_status_idx       ON public.courses (status);
CREATE INDEX IF NOT EXISTS courses_category_idx     ON public.courses (category);
CREATE INDEX IF NOT EXISTS courses_slug_idx         ON public.courses (slug);
CREATE INDEX IF NOT EXISTS applications_student_idx ON public.applications (student_id);
CREATE INDEX IF NOT EXISTS applications_course_idx  ON public.applications (course_id);
CREATE INDEX IF NOT EXISTS applications_status_idx  ON public.applications (status);
CREATE INDEX IF NOT EXISTS colleges_slug_idx        ON public.colleges (slug);

-- ── 5. updated_at trigger ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS applications_updated_at ON public.applications;
CREATE TRIGGER applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 6. SECURITY DEFINER helpers ──────────────────────────────────────────────
-- Checks if the calling user is the institution that owns a given college.
CREATE OR REPLACE FUNCTION public.user_owns_college(p_college_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND college_id = p_college_id AND role = 'institution'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.user_owns_college(UUID) TO authenticated;

-- Checks if the calling user is the institution for the college that owns a course.
CREATE OR REPLACE FUNCTION public.user_owns_course_college(p_course_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_college_id UUID;
BEGIN
  SELECT college_id INTO v_college_id FROM public.courses WHERE id = p_course_id;
  RETURN public.user_owns_college(v_college_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.user_owns_course_college(UUID) TO authenticated;

-- ── 7. Row Level Security ────────────────────────────────────────────────────
ALTER TABLE public.colleges    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Drop old policies so re-running is safe
DROP POLICY IF EXISTS "colleges: public read"             ON public.colleges;
DROP POLICY IF EXISTS "colleges: institution update own"  ON public.colleges;
DROP POLICY IF EXISTS "colleges: admin all"               ON public.colleges;

DROP POLICY IF EXISTS "courses: public read"              ON public.courses;
DROP POLICY IF EXISTS "courses: institution manage own"   ON public.courses;
DROP POLICY IF EXISTS "courses: admin all"                ON public.courses;

DROP POLICY IF EXISTS "applications: student select own"  ON public.applications;
DROP POLICY IF EXISTS "applications: student insert own"  ON public.applications;
DROP POLICY IF EXISTS "applications: institution select"  ON public.applications;
DROP POLICY IF EXISTS "applications: institution update"  ON public.applications;
DROP POLICY IF EXISTS "applications: admin all"           ON public.applications;

-- Colleges
CREATE POLICY "colleges: public read"
  ON public.colleges FOR SELECT USING (true);

CREATE POLICY "colleges: institution update own"
  ON public.colleges FOR UPDATE
  USING (public.user_owns_college(id));

CREATE POLICY "colleges: admin all"
  ON public.colleges FOR ALL
  USING (public.requesting_user_is_admin());

-- Courses
CREATE POLICY "courses: public read"
  ON public.courses FOR SELECT USING (true);

CREATE POLICY "courses: institution manage own"
  ON public.courses FOR ALL
  USING (public.user_owns_college(college_id))
  WITH CHECK (public.user_owns_college(college_id));

CREATE POLICY "courses: admin all"
  ON public.courses FOR ALL
  USING (public.requesting_user_is_admin());

-- Applications
CREATE POLICY "applications: student select own"
  ON public.applications FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "applications: student insert own"
  ON public.applications FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "applications: institution select"
  ON public.applications FOR SELECT
  USING (public.user_owns_course_college(course_id));

CREATE POLICY "applications: institution update"
  ON public.applications FOR UPDATE
  USING (public.user_owns_course_college(course_id));

CREATE POLICY "applications: admin all"
  ON public.applications FOR ALL
  USING (public.requesting_user_is_admin());

-- ── 8. Seed — Colleges ───────────────────────────────────────────────────────
INSERT INTO public.colleges (id, name, slug, country, city, description, website) VALUES
(
  'a1000000-0000-0000-0000-000000000001',
  'Dimensions International College',
  'dimensions',
  'Singapore', 'Singapore',
  'One of Singapore''s largest EduTrust-certified private institutions offering diploma programmes in business, culinary arts, and hospitality.',
  'https://www.dimensions.edu.sg'
),
(
  'a1000000-0000-0000-0000-000000000002',
  'MDIS — Management Development Institute of Singapore',
  'mdis',
  'Singapore', 'Singapore',
  'MDIS is one of Singapore''s oldest not-for-profit professional institutes offering programmes from diploma to postgraduate level.',
  'https://www.mdis.edu.sg'
),
(
  'a1000000-0000-0000-0000-000000000003',
  'PSB Academy',
  'psb-academy',
  'Singapore', 'Singapore',
  'PSB Academy is an EduTrust-certified private education institution providing industry-aligned programmes in Singapore.',
  'https://www.psbacademy.edu.sg'
),
(
  'a1000000-0000-0000-0000-000000000004',
  'Kaplan Singapore',
  'kaplan',
  'Singapore', 'Singapore',
  'Kaplan Singapore is part of the Kaplan global network offering a wide range of professional and academic qualifications.',
  'https://www.kaplan.com.sg'
),
(
  'a1000000-0000-0000-0000-000000000005',
  'EASB East Asia Institute of Management',
  'easb',
  'Singapore', 'Singapore',
  'EASB is an EduTrust-certified private education institution known for business, hospitality, and management programmes.',
  'https://www.easb.edu.sg'
)
ON CONFLICT (slug) DO NOTHING;

-- ── 9. Seed — Courses ────────────────────────────────────────────────────────
INSERT INTO public.courses (
  college_id, title, slug, category, description,
  duration_months, tuition_fee, application_fee,
  intake_date, seats_total, seats_filled, study_mode, level, status
) VALUES

-- Dimensions
('a1000000-0000-0000-0000-000000000001',
 'Diploma in Business Administration',
 'dimensions-diploma-business-admin',
 'Business',
 'A comprehensive diploma covering business fundamentals, management, marketing, and entrepreneurship. Designed for students aspiring to enter the Singapore business sector.',
 12, 6500, 200,
 '2025-02-10', 40, 12, 'full_time', 'diploma', 'open'),

('a1000000-0000-0000-0000-000000000001',
 'Diploma in Hospitality & Tourism Management',
 'dimensions-diploma-hospitality',
 'Hospitality',
 'Industry-focused programme covering hotel operations, food & beverage management, and tourism. Strong internship placement network.',
 12, 6800, 200,
 '2025-02-10', 35, 8, 'full_time', 'diploma', 'open'),

('a1000000-0000-0000-0000-000000000001',
 'Diploma in Culinary Arts',
 'dimensions-diploma-culinary',
 'Hospitality',
 'Hands-on culinary training covering Asian and international cuisines, pastry arts, and food science in professional kitchens.',
 12, 7200, 200,
 '2025-07-07', 20, 0, 'full_time', 'diploma', 'open'),

-- MDIS
('a1000000-0000-0000-0000-000000000002',
 'Diploma in Business Management',
 'mdis-diploma-business-mgmt',
 'Business',
 'MDIS''s flagship diploma covering business strategy, human resource management, finance, and operations with strong industry links.',
 12, 7000, 250,
 '2025-02-10', 50, 22, 'full_time', 'diploma', 'open'),

('a1000000-0000-0000-0000-000000000002',
 'Diploma in Information Technology',
 'mdis-diploma-it',
 'Technology',
 'Covers software development, database management, networks, and cybersecurity. Prepares students for Singapore''s tech industry.',
 12, 7500, 250,
 '2025-02-10', 35, 15, 'full_time', 'diploma', 'open'),

('a1000000-0000-0000-0000-000000000002',
 'Diploma in Fashion & Design',
 'mdis-diploma-fashion',
 'Design',
 'Blend of creative and technical skills covering fashion design, textile studies, illustration, and fashion merchandising.',
 12, 7800, 250,
 '2025-07-07', 25, 5, 'full_time', 'diploma', 'open'),

-- PSB Academy
('a1000000-0000-0000-0000-000000000003',
 'Diploma in Computing',
 'psb-diploma-computing',
 'Technology',
 'PSB Academy''s computing diploma covers programming, web development, data analytics, and IT project management.',
 12, 7200, 200,
 '2025-02-10', 40, 18, 'full_time', 'diploma', 'open'),

('a1000000-0000-0000-0000-000000000003',
 'Diploma in Engineering (Mechanical)',
 'psb-diploma-engineering-mech',
 'Engineering',
 'Mechanical engineering fundamentals including CAD, manufacturing, thermodynamics, and materials science for industrial applications.',
 12, 6800, 200,
 '2025-02-10', 30, 9, 'full_time', 'diploma', 'open'),

('a1000000-0000-0000-0000-000000000003',
 'Diploma in Mass Communication',
 'psb-diploma-mass-comm',
 'Communication',
 'Media studies, journalism, public relations, and digital content creation. Includes practical newsroom and production experience.',
 12, 6500, 200,
 '2025-07-07', 30, 4, 'full_time', 'diploma', 'open'),

-- Kaplan
('a1000000-0000-0000-0000-000000000004',
 'Diploma in Finance & Accounting',
 'kaplan-diploma-finance',
 'Finance',
 'Covers financial accounting, managerial accounting, taxation, auditing, and financial analysis. Strong alignment with ACCA pathway.',
 12, 7500, 250,
 '2025-02-10', 35, 16, 'full_time', 'diploma', 'open'),

('a1000000-0000-0000-0000-000000000004',
 'Diploma in Business Analytics',
 'kaplan-diploma-analytics',
 'Technology',
 'Data-driven business programme covering statistical analysis, Python, SQL, visualization tools, and business intelligence.',
 12, 7800, 250,
 '2025-02-10', 30, 11, 'full_time', 'diploma', 'open'),

('a1000000-0000-0000-0000-000000000004',
 'Diploma in Marketing',
 'kaplan-diploma-marketing',
 'Business',
 'Digital marketing, brand management, consumer behaviour, and market research in the context of Singapore''s business environment.',
 12, 6800, 250,
 '2025-07-07', 30, 2, 'full_time', 'diploma', 'open'),

-- EASB
('a1000000-0000-0000-0000-000000000005',
 'Diploma in International Business',
 'easb-diploma-intl-business',
 'Business',
 'Prepares students for global commerce with modules in international trade, supply chain management, cross-cultural communication, and logistics.',
 12, 6200, 150,
 '2025-02-10', 40, 14, 'full_time', 'diploma', 'open'),

('a1000000-0000-0000-0000-000000000005',
 'Diploma in Hotel & Hospitality Management',
 'easb-diploma-hotel-mgmt',
 'Hospitality',
 'Comprehensive hotel management programme with emphasis on front office, food & beverage, housekeeping, and revenue management.',
 12, 6500, 150,
 '2025-02-10', 35, 10, 'full_time', 'diploma', 'open')

ON CONFLICT (slug) DO NOTHING;

-- ── 10. Institution setup note ───────────────────────────────────────────────
-- To link an institution user to a college, run:
--
--   UPDATE public.profiles
--   SET college_id = '<college-uuid>'
--   WHERE id = '<institution-user-uuid>';
--
-- Example (link your institution test account to Dimensions):
--   UPDATE public.profiles
--   SET college_id = 'a1000000-0000-0000-0000-000000000001'
--   WHERE email = 'institution@yourtest.com';
