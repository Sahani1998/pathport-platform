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
--   Every table block is wrapped in a `to_regclass()` guard so missing tables
--   are silently skipped — the migration never fails on a partial schema.
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
-- This block is unguarded because profiles is required to exist for the helper
-- function itself to work.  If profiles is missing, nothing else matters.
DROP POLICY IF EXISTS "profiles: admin read all"   ON public.profiles;
DROP POLICY IF EXISTS "profiles: admin update all" ON public.profiles;
DROP POLICY IF EXISTS "profiles: admin all"        ON public.profiles;

CREATE POLICY "profiles: admin read all"
  ON public.profiles FOR SELECT
  USING (public.requesting_user_is_admin());

CREATE POLICY "profiles: admin update all"
  ON public.profiles FOR UPDATE
  USING (public.requesting_user_is_admin());


-- ── 3. Optional tables — each wrapped in a to_regclass() guard ────────────────
-- to_regclass(qualified_name) returns NULL when the relation doesn't exist, so
-- the IF check skips the entire block on databases that haven't run the
-- relevant feature migration yet.  EXECUTE is used because DDL inside a DO
-- block must be dynamic SQL.

-- applications
DO $$ BEGIN
  IF to_regclass('public.applications') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "applications: admin all" ON public.applications';
    EXECUTE 'CREATE POLICY "applications: admin all" ON public.applications FOR ALL USING (public.requesting_user_is_admin())';
  END IF;
END $$;

-- colleges
DO $$ BEGIN
  IF to_regclass('public.colleges') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "colleges: admin all" ON public.colleges';
    EXECUTE 'CREATE POLICY "colleges: admin all" ON public.colleges FOR ALL USING (public.requesting_user_is_admin())';
  END IF;
END $$;

-- courses
DO $$ BEGIN
  IF to_regclass('public.courses') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "courses: admin all" ON public.courses';
    EXECUTE 'CREATE POLICY "courses: admin all" ON public.courses FOR ALL USING (public.requesting_user_is_admin())';
  END IF;
END $$;

-- student_documents
DO $$ BEGIN
  IF to_regclass('public.student_documents') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "docs: admin all" ON public.student_documents';
    EXECUTE 'CREATE POLICY "docs: admin all" ON public.student_documents FOR ALL USING (public.requesting_user_is_admin())';
  END IF;
END $$;

-- application_timeline_events
DO $$ BEGIN
  IF to_regclass('public.application_timeline_events') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "timeline: admin all" ON public.application_timeline_events';
    EXECUTE 'CREATE POLICY "timeline: admin all" ON public.application_timeline_events FOR ALL USING (public.requesting_user_is_admin())';
  END IF;
END $$;

-- notifications
DO $$ BEGIN
  IF to_regclass('public.notifications') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "notif: admin all" ON public.notifications';
    EXECUTE 'CREATE POLICY "notif: admin all" ON public.notifications FOR ALL USING (public.requesting_user_is_admin())';
  END IF;
END $$;

-- student_inquiries
DO $$ BEGIN
  IF to_regclass('public.student_inquiries') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "inquiries: admin all" ON public.student_inquiries';
    EXECUTE 'CREATE POLICY "inquiries: admin all" ON public.student_inquiries FOR ALL USING (public.requesting_user_is_admin())';
  END IF;
END $$;

-- partner_applications  (often missing — listed in schema.sql but optional)
DO $$ BEGIN
  IF to_regclass('public.partner_applications') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "partner_applications: admin read"   ON public.partner_applications';
    EXECUTE 'DROP POLICY IF EXISTS "partner_applications: admin update" ON public.partner_applications';
    EXECUTE 'DROP POLICY IF EXISTS "partner_applications: admin all"    ON public.partner_applications';
    EXECUTE 'CREATE POLICY "partner_applications: admin read"   ON public.partner_applications FOR SELECT USING (public.requesting_user_is_admin())';
    EXECUTE 'CREATE POLICY "partner_applications: admin update" ON public.partner_applications FOR UPDATE USING (public.requesting_user_is_admin())';
  END IF;
END $$;

-- email_log
DO $$ BEGIN
  IF to_regclass('public.email_log') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "email_log: admin all" ON public.email_log';
    EXECUTE 'CREATE POLICY "email_log: admin all" ON public.email_log FOR ALL USING (public.requesting_user_is_admin())';
  END IF;
END $$;

-- application_audit_log
DO $$ BEGIN
  IF to_regclass('public.application_audit_log') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "audit_log: admin all" ON public.application_audit_log';
    EXECUTE 'CREATE POLICY "audit_log: admin all" ON public.application_audit_log FOR ALL USING (public.requesting_user_is_admin())';
  END IF;
END $$;

-- student_education
DO $$ BEGIN
  IF to_regclass('public.student_education') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "education: admin all" ON public.student_education';
    EXECUTE 'CREATE POLICY "education: admin all" ON public.student_education FOR ALL USING (public.requesting_user_is_admin())';
  END IF;
END $$;

-- offer_letters
DO $$ BEGIN
  IF to_regclass('public.offer_letters') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "offer_letters: admin all" ON public.offer_letters';
    EXECUTE 'CREATE POLICY "offer_letters: admin all" ON public.offer_letters FOR ALL USING (public.requesting_user_is_admin())';
  END IF;
END $$;


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
