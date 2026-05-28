-- ═══════════════════════════════════════════════════════════════════════════════
-- PathPort — Course Management & Application System
-- Paste this entire file into Supabase Dashboard → SQL Editor → Run
-- Safe to re-run: all statements use IF NOT EXISTS / OR REPLACE / ON CONFLICT
--
-- EXECUTION ORDER (dependency-safe):
--   1. CREATE TABLE colleges              (no dependencies)
--   2. CREATE TABLE courses               (→ colleges)
--   3. CREATE TABLE applications          (→ courses, auth.users)
--   4. ALTER TABLE profiles               (→ colleges — must come AFTER colleges)
--   5. Indexes
--   6. Trigger function + trigger
--   7. SECURITY DEFINER helpers           (→ profiles.college_id must exist)
--   8. Enable RLS + drop/recreate policies
--   9. Seed colleges
--  10. Seed courses                       (→ seeded college UUIDs)
-- ═══════════════════════════════════════════════════════════════════════════════


-- ── 1. CREATE TABLE public.colleges ─────────────────────────────────────────
--    No foreign key dependencies — must be first.
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


-- ── 2. CREATE TABLE public.courses ──────────────────────────────────────────
--    References colleges — colleges must already exist.
CREATE TABLE IF NOT EXISTS public.courses (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id       UUID          NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
  title            TEXT          NOT NULL,
  slug             TEXT          NOT NULL UNIQUE,
  category         TEXT          NOT NULL,
  description      TEXT,
  duration_months  INTEGER       NOT NULL DEFAULT 12,
  tuition_fee      NUMERIC(10,2) NOT NULL DEFAULT 0,
  application_fee  NUMERIC(10,2) NOT NULL DEFAULT 0,
  intake_date      DATE,
  seats_total      INTEGER       NOT NULL DEFAULT 30,
  seats_filled     INTEGER       NOT NULL DEFAULT 0,
  study_mode       TEXT          NOT NULL DEFAULT 'full_time'
                                 CHECK (study_mode IN ('full_time', 'part_time')),
  level            TEXT          NOT NULL DEFAULT 'diploma'
                                 CHECK (level IN ('diploma', 'advanced_diploma', 'graduate_diploma', 'certificate')),
  status           TEXT          NOT NULL DEFAULT 'open'
                                 CHECK (status IN ('open', 'closed', 'draft')),
  created_at       TIMESTAMPTZ            DEFAULT NOW()
);


-- ── 3. CREATE TABLE public.applications ─────────────────────────────────────
--    References courses (and auth.users) — courses must already exist.
CREATE TABLE IF NOT EXISTS public.applications (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID        NOT NULL REFERENCES auth.users(id)    ON DELETE CASCADE,
  course_id    UUID        NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  status       TEXT        NOT NULL DEFAULT 'submitted'
                           CHECK (status IN (
                             'submitted', 'under_review', 'docs_required',
                             'offer_ready', 'ipa_processing', 'approved', 'rejected'
                           )),
  notes        TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, course_id)   -- prevent duplicate applications
);


-- ── 4. ALTER TABLE public.profiles — add college linkage ────────────────────
--    References colleges — colleges must already exist (created in step 1).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS college_id UUID
    REFERENCES public.colleges(id) ON DELETE SET NULL;


-- ── 5. Indexes ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS colleges_slug_idx         ON public.colleges    (slug);
CREATE INDEX IF NOT EXISTS courses_college_id_idx    ON public.courses     (college_id);
CREATE INDEX IF NOT EXISTS courses_status_idx        ON public.courses     (status);
CREATE INDEX IF NOT EXISTS courses_category_idx      ON public.courses     (category);
CREATE INDEX IF NOT EXISTS courses_slug_idx          ON public.courses     (slug);
CREATE INDEX IF NOT EXISTS applications_student_idx  ON public.applications (student_id);
CREATE INDEX IF NOT EXISTS applications_course_idx   ON public.applications (course_id);
CREATE INDEX IF NOT EXISTS applications_status_idx   ON public.applications (status);


-- ── 6. updated_at trigger ────────────────────────────────────────────────────
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


-- ── 7. SECURITY DEFINER helpers ──────────────────────────────────────────────
--    These reference profiles.college_id which was added in step 4.

-- Returns TRUE when the calling user is the institution that manages a college.
CREATE OR REPLACE FUNCTION public.user_owns_college(p_college_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND college_id = p_college_id
      AND role = 'institution'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.user_owns_college(UUID) TO authenticated;

-- Returns TRUE when the calling user manages the college that owns a course.
CREATE OR REPLACE FUNCTION public.user_owns_course_college(p_course_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_college_id UUID;
BEGIN
  SELECT college_id INTO v_college_id
  FROM public.courses
  WHERE id = p_course_id;

  RETURN public.user_owns_college(v_college_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.user_owns_course_college(UUID) TO authenticated;


-- ── 8. Row Level Security ────────────────────────────────────────────────────
ALTER TABLE public.colleges     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies so this file is safe to re-run
DROP POLICY IF EXISTS "colleges: public read"            ON public.colleges;
DROP POLICY IF EXISTS "colleges: institution update own" ON public.colleges;
DROP POLICY IF EXISTS "colleges: admin all"              ON public.colleges;

DROP POLICY IF EXISTS "courses: public read"             ON public.courses;
DROP POLICY IF EXISTS "courses: institution manage own"  ON public.courses;
DROP POLICY IF EXISTS "courses: admin all"               ON public.courses;

DROP POLICY IF EXISTS "applications: student select own" ON public.applications;
DROP POLICY IF EXISTS "applications: student insert own" ON public.applications;
DROP POLICY IF EXISTS "applications: institution select" ON public.applications;
DROP POLICY IF EXISTS "applications: institution update" ON public.applications;
DROP POLICY IF EXISTS "applications: admin all"          ON public.applications;

-- colleges
CREATE POLICY "colleges: public read"
  ON public.colleges FOR SELECT
  USING (true);

CREATE POLICY "colleges: institution update own"
  ON public.colleges FOR UPDATE
  USING (public.user_owns_college(id));

CREATE POLICY "colleges: admin all"
  ON public.colleges FOR ALL
  USING (public.requesting_user_is_admin());

-- courses
CREATE POLICY "courses: public read"
  ON public.courses FOR SELECT
  USING (true);

CREATE POLICY "courses: institution manage own"
  ON public.courses FOR ALL
  USING     (public.user_owns_college(college_id))
  WITH CHECK (public.user_owns_college(college_id));

CREATE POLICY "courses: admin all"
  ON public.courses FOR ALL
  USING (public.requesting_user_is_admin());

-- applications
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


-- ── 9. Seed — Colleges ───────────────────────────────────────────────────────
--    ON CONFLICT (slug) DO NOTHING makes this re-run safe.
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


-- ── 10. Seed — Courses ───────────────────────────────────────────────────────
--    Pricing rules:
--      Diploma          → SGD 4,000 (fixed)
--      Advanced Diploma → SGD 4,200 – 4,500
--      Graduate Diploma → SGD 4,600 – 5,500
--    Application fee    → SGD 109 (fixed, all courses)
--    Intakes            → Jan / Apr / Jul / Oct 2026
--    ON CONFLICT (slug) DO NOTHING = re-run safe.
INSERT INTO public.courses (
  college_id, title, slug, category, description,
  duration_months, tuition_fee, application_fee,
  intake_date, seats_total, seats_filled, study_mode, level, status
) VALUES

-- ── Dimensions International College ─────────────────────────────────────────
('a1000000-0000-0000-0000-000000000001',
 'Diploma in Business Administration',
 'dimensions-diploma-business-admin',
 'Business',
 'A comprehensive diploma covering business fundamentals, management, marketing, and entrepreneurship. Designed for students aspiring to enter the Singapore business sector.',
 12, 4000, 109, '2026-01-12', 40, 12, 'full_time', 'diploma', 'open'),

('a1000000-0000-0000-0000-000000000001',
 'Diploma in Hospitality & Tourism Management',
 'dimensions-diploma-hospitality',
 'Hospitality',
 'Industry-focused programme covering hotel operations, food & beverage management, and tourism. Strong internship placement network.',
 12, 4000, 109, '2026-01-12', 35, 8, 'full_time', 'diploma', 'open'),

('a1000000-0000-0000-0000-000000000001',
 'Diploma in Culinary Arts',
 'dimensions-diploma-culinary',
 'Hospitality',
 'Hands-on culinary training covering Asian and international cuisines, pastry arts, and food science in professional kitchens.',
 12, 4000, 109, '2026-07-06', 20, 0, 'full_time', 'diploma', 'open'),

-- ── MDIS ─────────────────────────────────────────────────────────────────────
('a1000000-0000-0000-0000-000000000002',
 'Diploma in Business Management',
 'mdis-diploma-business-mgmt',
 'Business',
 'MDIS''s flagship diploma covering business strategy, human resource management, finance, and operations with strong industry links.',
 12, 4000, 109, '2026-01-12', 50, 22, 'full_time', 'diploma', 'open'),

('a1000000-0000-0000-0000-000000000002',
 'Diploma in Information Technology',
 'mdis-diploma-it',
 'Technology',
 'Covers software development, database management, networks, and cybersecurity. Prepares students for Singapore''s tech industry.',
 12, 4000, 109, '2026-04-06', 35, 15, 'full_time', 'diploma', 'open'),

('a1000000-0000-0000-0000-000000000002',
 'Advanced Diploma in Fashion & Design',
 'mdis-adip-fashion',
 'Design',
 'Blend of creative and technical skills covering fashion design, textile studies, illustration, and fashion merchandising.',
 18, 4300, 109, '2026-07-06', 25, 5, 'full_time', 'advanced_diploma', 'open'),

-- ── PSB Academy ──────────────────────────────────────────────────────────────
('a1000000-0000-0000-0000-000000000003',
 'Diploma in Computing',
 'psb-diploma-computing',
 'Technology',
 'PSB Academy''s computing diploma covers programming, web development, data analytics, and IT project management.',
 12, 4000, 109, '2026-01-12', 40, 18, 'full_time', 'diploma', 'open'),

('a1000000-0000-0000-0000-000000000003',
 'Diploma in Engineering (Mechanical)',
 'psb-diploma-engineering-mech',
 'Engineering',
 'Mechanical engineering fundamentals including CAD, manufacturing, thermodynamics, and materials science for industrial applications.',
 12, 4000, 109, '2026-04-06', 30, 9, 'full_time', 'diploma', 'open'),

('a1000000-0000-0000-0000-000000000003',
 'Advanced Diploma in Mass Communication',
 'psb-adip-mass-comm',
 'Communication',
 'Media studies, journalism, public relations, and digital content creation. Includes practical newsroom and production experience.',
 18, 4200, 109, '2026-07-06', 30, 4, 'full_time', 'advanced_diploma', 'open'),

-- ── Kaplan Singapore ─────────────────────────────────────────────────────────
('a1000000-0000-0000-0000-000000000004',
 'Diploma in Finance & Accounting',
 'kaplan-diploma-finance',
 'Finance',
 'Covers financial accounting, managerial accounting, taxation, auditing, and financial analysis. Strong alignment with ACCA pathway.',
 12, 4000, 109, '2026-01-12', 35, 16, 'full_time', 'diploma', 'open'),

('a1000000-0000-0000-0000-000000000004',
 'Advanced Diploma in Business Analytics',
 'kaplan-adip-analytics',
 'Technology',
 'Data-driven business programme covering statistical analysis, Python, SQL, visualization tools, and business intelligence.',
 18, 4500, 109, '2026-04-06', 30, 11, 'full_time', 'advanced_diploma', 'open'),

('a1000000-0000-0000-0000-000000000004',
 'Diploma in Marketing',
 'kaplan-diploma-marketing',
 'Business',
 'Digital marketing, brand management, consumer behaviour, and market research in the context of Singapore''s business environment.',
 12, 4000, 109, '2026-10-05', 30, 2, 'full_time', 'diploma', 'open'),

-- ── EASB ─────────────────────────────────────────────────────────────────────
('a1000000-0000-0000-0000-000000000005',
 'Diploma in International Business',
 'easb-diploma-intl-business',
 'Business',
 'Prepares students for global commerce with modules in international trade, supply chain management, cross-cultural communication, and logistics.',
 12, 4000, 109, '2026-01-12', 40, 14, 'full_time', 'diploma', 'open'),

('a1000000-0000-0000-0000-000000000005',
 'Diploma in Hotel & Hospitality Management',
 'easb-diploma-hotel-mgmt',
 'Hospitality',
 'Comprehensive hotel management programme with emphasis on front office, food & beverage, housekeeping, and revenue management.',
 12, 4000, 109, '2026-04-06', 35, 10, 'full_time', 'diploma', 'open')

ON CONFLICT (slug) DO NOTHING;


-- ── Post-run: link an institution user to a college ──────────────────────────
--
--  After running this file, link your institution test account to a college:
--
--    UPDATE public.profiles
--    SET college_id = 'a1000000-0000-0000-0000-000000000001'
--    WHERE email = 'your-institution@test.com';
--
--  Available college UUIDs:
--    Dimensions  →  a1000000-0000-0000-0000-000000000001
--    MDIS        →  a1000000-0000-0000-0000-000000000002
--    PSB Academy →  a1000000-0000-0000-0000-000000000003
--    Kaplan      →  a1000000-0000-0000-0000-000000000004
--    EASB        →  a1000000-0000-0000-0000-000000000005
--
