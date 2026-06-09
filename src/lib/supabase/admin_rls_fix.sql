-- ═══════════════════════════════════════════════════════════════════════════════
-- PathPort — Admin RLS Comprehensive Fix
--
-- WHY THIS MIGRATION EXISTS
--   The original schema.sql created a "profiles: admin read all" policy whose
--   USING clause runs `SELECT role FROM public.profiles WHERE id = auth.uid()`
--   against the SAME table — that subquery is itself subject to the same RLS
--   policy → infinite recursion (PostgreSQL error 42P17).
--
--   PostgreSQL detects the recursion and aborts the query.  Server-side queries
--   silently return 0 rows (Supabase swallows the error in many code paths) so
--   admin dashboards appear empty even though data exists.
--
-- THE FIX
--   Use a SECURITY DEFINER function (`requesting_user_is_admin`) which bypasses
--   RLS when evaluating the admin check.  This file:
--     1. (Re)creates the function.
--     2. Drops every legacy recursive admin policy across all tables.
--     3. Recreates the admin policies using the safe helper.
--
-- Safe to re-run.  Paste into Supabase Dashboard → SQL Editor → Run.
-- ═══════════════════════════════════════════════════════════════════════════════


-- ── 1. SECURITY DEFINER helper ────────────────────────────────────────────────
-- SECURITY DEFINER means: when this function runs, the inner query against
-- profiles uses the function owner's permissions (postgres) and bypasses RLS.
-- That breaks the recursion cycle.
CREATE OR REPLACE FUNCTION public.requesting_user_is_admin()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.requesting_user_is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.requesting_user_is_admin() TO anon;


-- ── 2. profiles ────────────────────────────────────────────────────────────────
-- Drop EVERY legacy admin policy — including the recursive ones from schema.sql
DROP POLICY IF EXISTS "profiles: admin read all"   ON public.profiles;
DROP POLICY IF EXISTS "profiles: admin update all" ON public.profiles;
DROP POLICY IF EXISTS "profiles: admin all"        ON public.profiles;

CREATE POLICY "profiles: admin read all"
  ON public.profiles FOR SELECT
  USING (public.requesting_user_is_admin());

CREATE POLICY "profiles: admin update all"
  ON public.profiles FOR UPDATE
  USING (public.requesting_user_is_admin());


-- ── 3. applications ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "applications: admin all" ON public.applications;
CREATE POLICY "applications: admin all"
  ON public.applications FOR ALL
  USING (public.requesting_user_is_admin());


-- ── 4. colleges ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "colleges: admin all" ON public.colleges;
CREATE POLICY "colleges: admin all"
  ON public.colleges FOR ALL
  USING (public.requesting_user_is_admin());


-- ── 5. courses ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "courses: admin all" ON public.courses;
CREATE POLICY "courses: admin all"
  ON public.courses FOR ALL
  USING (public.requesting_user_is_admin());


-- ── 6. student_documents ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "docs: admin all" ON public.student_documents;
CREATE POLICY "docs: admin all"
  ON public.student_documents FOR ALL
  USING (public.requesting_user_is_admin());


-- ── 7. application_timeline_events ────────────────────────────────────────────
DROP POLICY IF EXISTS "timeline: admin all" ON public.application_timeline_events;
CREATE POLICY "timeline: admin all"
  ON public.application_timeline_events FOR ALL
  USING (public.requesting_user_is_admin());


-- ── 8. notifications ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "notif: admin all" ON public.notifications;
CREATE POLICY "notif: admin all"
  ON public.notifications FOR ALL
  USING (public.requesting_user_is_admin());


-- ── 9. student_inquiries ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "inquiries: admin all" ON public.student_inquiries;
CREATE POLICY "inquiries: admin all"
  ON public.student_inquiries FOR ALL
  USING (public.requesting_user_is_admin());


-- ── 10. partner_applications ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "partner_applications: admin read"   ON public.partner_applications;
DROP POLICY IF EXISTS "partner_applications: admin update" ON public.partner_applications;
DROP POLICY IF EXISTS "partner_applications: admin all"    ON public.partner_applications;

CREATE POLICY "partner_applications: admin read"
  ON public.partner_applications FOR SELECT
  USING (public.requesting_user_is_admin());

CREATE POLICY "partner_applications: admin update"
  ON public.partner_applications FOR UPDATE
  USING (public.requesting_user_is_admin());


-- ── 11. email_log ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "email_log: admin all" ON public.email_log;
CREATE POLICY "email_log: admin all"
  ON public.email_log FOR ALL
  USING (public.requesting_user_is_admin());


-- ── 12. application_audit_log ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "audit_log: admin all" ON public.application_audit_log;
CREATE POLICY "audit_log: admin all"
  ON public.application_audit_log FOR ALL
  USING (public.requesting_user_is_admin());


-- ── 13. student_education ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "education: admin all" ON public.student_education;
CREATE POLICY "education: admin all"
  ON public.student_education FOR ALL
  USING (public.requesting_user_is_admin());


-- ── 14. offer_letters ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "offer_letters: admin all" ON public.offer_letters;
CREATE POLICY "offer_letters: admin all"
  ON public.offer_letters FOR ALL
  USING (public.requesting_user_is_admin());


-- ═══════════════════════════════════════════════════════════════════════════════
-- Verification — run these manually after applying:
--
--   SELECT public.requesting_user_is_admin();           -- expect: true
--   SELECT COUNT(*) FROM public.profiles;               -- expect: real count
--   SELECT COUNT(*) FROM public.applications;           -- expect: real count
--
-- Then visit /dashboard/admin/diagnostic in the app — it runs the same queries
-- and surfaces any remaining errors.
-- ═══════════════════════════════════════════════════════════════════════════════
