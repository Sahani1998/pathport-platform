-- ═══════════════════════════════════════════════════════════════════════════════
-- PathPort — Sprint 14: Security Hardening
-- Safe to re-run. Paste into Supabase Dashboard → SQL Editor → Run.
--
-- Contents:
--   1. partner_applications — allow approved partners to read own application
--   2. profiles — add SELECT policy for institution users to read their own college's profiles
--      (needed for document-review workflow where institution sees student names)
-- ═══════════════════════════════════════════════════════════════════════════════


-- ── 1. partner_applications: approved partner self-read ───────────────────────
-- After approval the applicant gets an auth user (created_user_id).
-- They should be able to read their own application record.
DROP POLICY IF EXISTS "partner_apps: self read" ON public.partner_applications;

CREATE POLICY "partner_apps: self read"
  ON public.partner_applications FOR SELECT
  USING (created_user_id = auth.uid());


-- ── 2. profiles: institution can read profiles of students who applied to
--      their college's courses (needed for student roster, document review UI)
-- The existing profiles RLS only allows students to read their own profile and
-- admins to read all. Institutions need to read profiles of applicants.
DROP POLICY IF EXISTS "profiles: institution read applicants" ON public.profiles;

CREATE POLICY "profiles: institution read applicants"
  ON public.profiles FOR SELECT
  USING (
    -- The viewer is an institution user...
    EXISTS (
      SELECT 1 FROM public.profiles viewer
      WHERE viewer.id   = auth.uid()
        AND viewer.role = 'institution'
    )
    AND
    -- ...and this profile belongs to a student with an application to their college
    EXISTS (
      SELECT 1
      FROM public.applications  a
      JOIN public.courses       c  ON c.id = a.course_id
      JOIN public.profiles      viewer ON viewer.id = auth.uid()
      WHERE a.student_id  = profiles.id
        AND c.college_id  = viewer.college_id
    )
  );
