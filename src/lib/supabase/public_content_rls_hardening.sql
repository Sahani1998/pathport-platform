-- ═══════════════════════════════════════════════════════════════════════════════
-- PathPort — Public Content RLS Hardening (Hotfix)
--
-- Fixes the bug where every admin Public Content detail page hangs on an
-- infinite "Loading…" spinner.
--
-- Root cause: the five admin_manage_* policies on the public-content tables
-- use an inline subquery against profiles:
--
--     USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
--
-- When evaluated by a user-scoped (anon JWT) client, this subquery is itself
-- subject to RLS on profiles. If the profiles "admin read all" policy is the
-- recursive variant from schema.sql:
--
--     USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
--
-- ... the planner recurses into profiles RLS while evaluating profiles RLS →
-- Postgres throws 42P17 infinite_recursion → PostgREST does not always
-- propagate this back as a clean error, so the JS fetch never resolves.
--
-- The hardened helper requesting_user_is_admin() is SECURITY DEFINER and
-- bypasses RLS entirely:
--
--     CREATE OR REPLACE FUNCTION public.requesting_user_is_admin()
--     RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
--     BEGIN
--       RETURN EXISTS (SELECT 1 FROM public.profiles
--                      WHERE id = auth.uid() AND role = 'admin');
--     END;
--     $$;
--
-- It is the pattern already used by applications, student_documents, profiles,
-- and other admin-scoped tables (see admin_access_verification.sql and
-- admin_rls_fix.sql).
--
-- Tables affected (5):
--   public_destinations
--   public_qualification_levels
--   public_pathway_cards
--   public_page_sections
--   site_settings
--
-- This migration:
--   1. Asserts the requesting_user_is_admin() helper exists (no-op if so).
--   2. Drops the five unhardened admin_manage_* policies.
--   3. Recreates each policy using requesting_user_is_admin() for both
--      USING and WITH CHECK.
--
-- public_read_* policies are untouched — anonymous read of published rows
-- continues to work exactly as before.
--
-- Safe to re-run: every CREATE is preceded by DROP IF EXISTS.
-- ═══════════════════════════════════════════════════════════════════════════════


-- ── 1. Ensure helper exists ───────────────────────────────────────────────────
-- Identical to the definition in admin_access_verification.sql. CREATE OR REPLACE
-- is idempotent, so re-running this migration after the helper has already been
-- created is a no-op.
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


-- ── 2. public_destinations ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_manage_destinations" ON public.public_destinations;

CREATE POLICY "admin_manage_destinations"
  ON public.public_destinations
  FOR ALL
  USING       (public.requesting_user_is_admin())
  WITH CHECK  (public.requesting_user_is_admin());


-- ── 3. public_qualification_levels ────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_manage_qual_levels" ON public.public_qualification_levels;

CREATE POLICY "admin_manage_qual_levels"
  ON public.public_qualification_levels
  FOR ALL
  USING       (public.requesting_user_is_admin())
  WITH CHECK  (public.requesting_user_is_admin());


-- ── 4. public_pathway_cards ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_manage_pathway_cards" ON public.public_pathway_cards;

CREATE POLICY "admin_manage_pathway_cards"
  ON public.public_pathway_cards
  FOR ALL
  USING       (public.requesting_user_is_admin())
  WITH CHECK  (public.requesting_user_is_admin());


-- ── 5. public_page_sections ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_manage_page_sections" ON public.public_page_sections;

CREATE POLICY "admin_manage_page_sections"
  ON public.public_page_sections
  FOR ALL
  USING       (public.requesting_user_is_admin())
  WITH CHECK  (public.requesting_user_is_admin());


-- ── 6. site_settings ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "admin_manage_site_settings" ON public.site_settings;

CREATE POLICY "admin_manage_site_settings"
  ON public.site_settings
  FOR ALL
  USING       (public.requesting_user_is_admin())
  WITH CHECK  (public.requesting_user_is_admin());


-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICATION (run manually after applying)
--
-- ── Admin should see ALL rows on each table ─────────────────────────────────
-- Run as the admin user via PostgREST / Supabase JS:
--   SELECT count(*) FROM public_destinations;          -- should return live count
--   SELECT count(*) FROM public_qualification_levels;  -- should return live count
--   SELECT count(*) FROM public_pathway_cards;         -- should return live count
--   SELECT count(*) FROM public_page_sections;         -- should return live count
--   SELECT count(*) FROM site_settings;                -- should return live count
--
-- Admin should also be able to INSERT / UPDATE / DELETE each table. Test via
-- the affected admin UI:
--   /dashboard/admin/public-content/destinations
--   /dashboard/admin/public-content/qualification-levels
--   /dashboard/admin/public-content/pathway-cards
--   /dashboard/admin/public-content/duration-guide
--   /dashboard/admin/public-content/intakes
--   /dashboard/admin/public-content/site-settings
--
-- ── Anonymous / non-admin must still be restricted ──────────────────────────
-- Run as anon (no JWT) via PostgREST:
--   SELECT count(*) FROM public_destinations;          -- only rows where status='published' AND destination_status != 'hidden'
--   SELECT count(*) FROM public_qualification_levels;  -- only status='published'
--   SELECT count(*) FROM public_pathway_cards;         -- only status='published'
--   SELECT count(*) FROM public_page_sections;         -- only status='published'
--   SELECT count(*) FROM site_settings;                -- only is_public = true
--
-- Anonymous INSERT/UPDATE/DELETE on any of these tables must fail with
-- "new row violates row-level security policy".
--
-- Non-admin authenticated users (student, institution, recruitment_partner,
-- employer) must also be restricted to the public_read_* policy — i.e. see only
-- published / public rows, and no INSERT/UPDATE/DELETE.
-- ═══════════════════════════════════════════════════════════════════════════════
