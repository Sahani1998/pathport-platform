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


-- ── 5. Update public read policies — anon-only restriction ──────────────────────
--
-- Design: the public read policy must restrict ANONYMOUS visitors to only see
-- published records, BUT must not regress access for authenticated users
-- (students, institutions, recruitment partners). Authenticated users were
-- previously able to see all records via USING (true).
--
-- Pattern: `is_published = true OR auth.uid() IS NOT NULL` means:
--   - Anonymous (auth.uid() IS NULL): only published records visible.
--   - Authenticated: full read access preserved (backward compatible).
--
-- This is safe because:
--   - Admin still has full access via the "admin all" policy.
--   - Institution still has full access to own records via "institution manage own".
--   - Public pages (/colleges, /courses) additionally filter at the query level
--     with .eq("is_published", true) — the RLS is a defence-in-depth layer.

DROP POLICY IF EXISTS "colleges: public read" ON public.colleges;
CREATE POLICY "colleges: public read"
  ON public.colleges FOR SELECT
  USING (is_published = true OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "courses: public read" ON public.courses;
CREATE POLICY "courses: public read"
  ON public.courses FOR SELECT
  USING (is_published = true OR auth.uid() IS NOT NULL);


-- ── Verification ────────────────────────────────────────────────────────────────
-- After running, verify with:
--   SELECT name, is_active, is_published FROM colleges ORDER BY name;
--   SELECT title, status, is_published FROM courses ORDER BY created_at;
--
-- Test RLS:
--   1. Anonymous query (no session)  → only published records returned.
--   2. Student query                  → all records returned (backward compatible).
--   3. Institution query              → all records returned + manage own.
--   4. Admin query                    → all records via "admin all" policy.
