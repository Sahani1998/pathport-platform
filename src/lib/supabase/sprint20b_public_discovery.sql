-- ═══════════════════════════════════════════════════════════════════════════════
-- PathPort Sprint 20B — Public Discovery & SEO Foundation
--
-- MUST BE RUN IN SUPABASE SQL EDITOR BEFORE DEPLOYING SPRINT 20B.
-- Safe to re-run: all DDL uses IF NOT EXISTS / OR REPLACE / ON CONFLICT.
--
-- Changes:
--   1. Add is_published to colleges   (controls public directory visibility)
--   2. Add is_published to courses    (controls public directory visibility)
--   3. Migrate existing records       (active colleges + non-draft courses → published)
--   4. Performance indexes
--   5. Add institution read-own policy (so institution users can see their own
--      college in the dashboard even if is_published = false)
--   6. Update public read policies to respect is_published
-- ═══════════════════════════════════════════════════════════════════════════════


-- ── 1. Add is_published to colleges ─────────────────────────────────────────────
ALTER TABLE public.colleges
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT false;

-- ── 2. Add is_published to courses ──────────────────────────────────────────────
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT false;


-- ── 3. Migrate existing records ─────────────────────────────────────────────────
-- Colleges: publish all currently active colleges
UPDATE public.colleges
SET is_published = true
WHERE is_active = true;

-- Courses: publish all non-draft courses
UPDATE public.courses
SET is_published = true
WHERE status != 'draft';


-- ── 4. Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS colleges_is_published_idx
  ON public.colleges (is_published) WHERE is_published = true;

CREATE INDEX IF NOT EXISTS courses_is_published_idx
  ON public.courses (is_published) WHERE is_published = true;

-- Composite index for the most common public query pattern
CREATE INDEX IF NOT EXISTS courses_published_status_idx
  ON public.courses (is_published, status)
  WHERE is_published = true;


-- ── 5. Institution read-own policy ──────────────────────────────────────────────
-- Ensures institution users can see their own college in dashboard even when
-- is_published = false. Without this, restricting the public read policy would
-- break the institution dashboard.
DROP POLICY IF EXISTS "colleges: institution read own" ON public.colleges;
CREATE POLICY "colleges: institution read own"
  ON public.colleges FOR SELECT
  USING (public.user_owns_college(id));


-- ── 6. Update public read policies to require is_published ───────────────────────
-- Colleges: anonymous/public visitors only see published colleges.
-- Authenticated users (students, institution users who don't own the college)
-- only see published colleges via this policy. Admin sees all via "admin all".
DROP POLICY IF EXISTS "colleges: public read" ON public.colleges;
CREATE POLICY "colleges: public read"
  ON public.colleges FOR SELECT
  USING (is_published = true);

-- Courses: anonymous/public visitors only see published courses.
DROP POLICY IF EXISTS "courses: public read" ON public.courses;
CREATE POLICY "courses: public read"
  ON public.courses FOR SELECT
  USING (is_published = true);

-- Institution users can see courses for their own college regardless of is_published.
-- This enables institution admins to preview unpublished courses.
DROP POLICY IF EXISTS "courses: institution manage own" ON public.courses;
CREATE POLICY "courses: institution manage own"
  ON public.courses FOR ALL
  USING     (public.user_owns_college(college_id))
  WITH CHECK (public.user_owns_college(college_id));


-- ── Verification ────────────────────────────────────────────────────────────────
-- After running, verify with:
--   SELECT name, is_active, is_published FROM colleges ORDER BY name;
--   SELECT title, status, is_published FROM courses ORDER BY created_at;
