-- Sprint 17 — Comprehensive DB fix: sequence permissions + RLS recursive join
-- Safe to re-run (CREATE OR REPLACE / DROP POLICY IF EXISTS throughout).
--
-- Fixes:
--   1. next_invoice_number()  — add SECURITY DEFINER (CREATE SEQUENCE DDL)
--   2. next_receipt_number()  — add SECURITY DEFINER (CREATE SEQUENCE DDL)
--   3. profiles: institution read applicants — rewrite to avoid recursive RLS
--      (inner JOIN public.profiles viewer caused recursive policy evaluation)
--
-- Root causes:
--   1/2: next_invoice_number and next_receipt_number run
--        CREATE SEQUENCE IF NOT EXISTS inside a function called via RPC as the
--        authenticated role. CREATE SEQUENCE requires the CREATE privilege on
--        schema public, which authenticated does not hold.  Same root cause as
--        next_app_id / next_pp_id (already patched in sprint17_fix_sequence_permissions.sql).
--
--   3: The original policy joined public.profiles inside a policy on public.profiles,
--      triggering recursive RLS evaluation. PostgreSQL applies policies
--      recursively, so the viewer subquery was itself filtered by the policy it
--      was evaluating, causing it to return 0 rows — making the institution's
--      student-profile lookup always fail and show "Unknown".
--      Fix: replace the inline viewer JOIN with user_owns_college(c.college_id),
--      which is SECURITY DEFINER and safely bypasses RLS for the inner check.


-- ============================================================================
-- 1. next_invoice_number — add SECURITY DEFINER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.next_invoice_number(p_college_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_year       TEXT   := to_char(now(), 'YYYY');
  v_short_code TEXT;
  v_seq_name   TEXT;
  v_n          BIGINT;
BEGIN
  SELECT short_code INTO v_short_code
    FROM public.colleges
   WHERE id = p_college_id;

  IF v_short_code IS NULL THEN
    RAISE EXCEPTION 'College % has no short_code', p_college_id;
  END IF;

  v_seq_name := 'inv_seq_' || lower(v_short_code) || '_' || v_year;
  EXECUTE format('CREATE SEQUENCE IF NOT EXISTS public.%I MINVALUE 1', v_seq_name);
  EXECUTE format('SELECT nextval(%L)', 'public.' || v_seq_name) INTO v_n;
  RETURN v_short_code || '-INV-' || v_year || '-' || lpad(v_n::text, 4, '0');
END;
$$;


-- ============================================================================
-- 2. next_receipt_number — add SECURITY DEFINER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.next_receipt_number(p_college_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_year       TEXT   := to_char(now(), 'YYYY');
  v_short_code TEXT;
  v_seq_name   TEXT;
  v_n          BIGINT;
BEGIN
  SELECT short_code INTO v_short_code
    FROM public.colleges
   WHERE id = p_college_id;

  IF v_short_code IS NULL THEN
    RAISE EXCEPTION 'College % has no short_code', p_college_id;
  END IF;

  v_seq_name := 'rcp_seq_' || lower(v_short_code) || '_' || v_year;
  EXECUTE format('CREATE SEQUENCE IF NOT EXISTS public.%I MINVALUE 1', v_seq_name);
  EXECUTE format('SELECT nextval(%L)', 'public.' || v_seq_name) INTO v_n;
  RETURN v_short_code || '-RCP-' || v_year || '-' || lpad(v_n::text, 4, '0');
END;
$$;


-- ============================================================================
-- 3. profiles: institution read applicants — fix recursive RLS
-- ============================================================================
-- Old policy:
--   USING (
--     EXISTS (SELECT 1 FROM public.profiles viewer WHERE viewer.id = auth.uid() AND viewer.role = 'institution')
--     AND
--     EXISTS (SELECT 1 FROM public.applications a JOIN public.courses c ON c.id = a.course_id
--             JOIN public.profiles viewer ON viewer.id = auth.uid()   -- ← recursive profiles read
--             WHERE a.student_id = profiles.id AND c.college_id = viewer.college_id)
--   )
--
-- New policy: replace inline viewer JOIN with user_owns_college() which is
-- SECURITY DEFINER and safely reads profiles without recursive RLS.

DROP POLICY IF EXISTS "profiles: institution read applicants" ON public.profiles;

CREATE POLICY "profiles: institution read applicants"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1
        FROM public.applications  a
        JOIN public.courses       c ON c.id = a.course_id
       WHERE a.student_id         = profiles.id
         AND public.user_owns_college(c.college_id)
    )
  );
