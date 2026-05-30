-- ═══════════════════════════════════════════════════════════════════════════════
-- PathPort — Admin Access Verification & Stabilisation Migration
-- Run this in Supabase SQL Editor to ensure admin RLS is correct.
-- Safe to re-run: OR REPLACE / DROP IF EXISTS / IF NOT EXISTS throughout.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── 1. Ensure requesting_user_is_admin() exists ───────────────────────────────
-- This function is referenced by ALL admin RLS policies across every table.
-- If it doesn't exist, all "admin all" policies silently evaluate to FALSE,
-- meaning admins see 0 rows everywhere.
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


-- ── 2. Re-assert applications admin policy ────────────────────────────────────
-- Ensures admin can SELECT/UPDATE/DELETE/INSERT all applications rows.
DROP POLICY IF EXISTS "applications: admin all" ON public.applications;
CREATE POLICY "applications: admin all"
  ON public.applications FOR ALL
  USING (public.requesting_user_is_admin());


-- ── 3. Re-assert profiles admin policies ─────────────────────────────────────
DROP POLICY IF EXISTS "profiles: admin read all"   ON public.profiles;
DROP POLICY IF EXISTS "profiles: admin update all" ON public.profiles;

CREATE POLICY "profiles: admin read all"
  ON public.profiles FOR SELECT
  USING (public.requesting_user_is_admin());

CREATE POLICY "profiles: admin update all"
  ON public.profiles FOR UPDATE
  USING (public.requesting_user_is_admin());


-- ── 4. Re-assert student_documents admin policy ───────────────────────────────
DROP POLICY IF EXISTS "docs: admin all" ON public.student_documents;
CREATE POLICY "docs: admin all"
  ON public.student_documents FOR ALL
  USING (public.requesting_user_is_admin());


-- ── 5. Re-assert timeline admin policy ───────────────────────────────────────
DROP POLICY IF EXISTS "timeline: admin all" ON public.application_timeline_events;
CREATE POLICY "timeline: admin all"
  ON public.application_timeline_events FOR ALL
  USING (public.requesting_user_is_admin());


-- ── 6. Re-assert notifications admin policy ───────────────────────────────────
DROP POLICY IF EXISTS "notif: admin all" ON public.notifications;
CREATE POLICY "notif: admin all"
  ON public.notifications FOR ALL
  USING (public.requesting_user_is_admin());


-- ── 7. Verification query — run to confirm admin access ──────────────────────
-- After running, log in as admin and verify this returns TRUE:
--
--   SELECT public.requesting_user_is_admin();
--
-- And verify application count matches dashboard:
--
--   SELECT COUNT(*) FROM public.applications;
--
