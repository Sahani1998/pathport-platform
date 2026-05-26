-- ═══════════════════════════════════════════════════════════════════════════
-- PathPort — Student Inquiries Table + RLS
-- Run this entire block in Supabase Dashboard → SQL Editor → Run
-- (Safe to re-run: all statements use IF NOT EXISTS / OR REPLACE)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Table ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.student_inquiries (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name       TEXT        NOT NULL,
  email           TEXT        NOT NULL,
  whatsapp_number TEXT,
  country         TEXT        DEFAULT 'India',
  indian_state    TEXT,
  city            TEXT,
  course_interest TEXT,
  intended_intake TEXT,
  budget_range    TEXT,
  status          TEXT        NOT NULL DEFAULT 'new'
                              CHECK (status IN ('new','contacted','converted','not_interested')),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS student_inquiries_status_idx     ON public.student_inquiries (status);
CREATE INDEX IF NOT EXISTS student_inquiries_created_at_idx ON public.student_inquiries (created_at DESC);
CREATE INDEX IF NOT EXISTS student_inquiries_email_idx      ON public.student_inquiries (email);
CREATE INDEX IF NOT EXISTS student_inquiries_country_idx    ON public.student_inquiries (country);

-- ── 3. SECURITY DEFINER helper ─────────────────────────────────────────────────
-- The inline subquery  (SELECT role FROM profiles WHERE id = auth.uid())  inside
-- an RLS USING clause runs as the CALLING USER.  If profiles itself has RLS, the
-- subquery can silently return NULL even for authenticated admins, so the policy
-- denies access and the count query returns NULL (not 0).
--
-- A SECURITY DEFINER function runs as its OWNER (postgres/superuser), bypassing
-- all downstream RLS.  This is the standard Supabase pattern for role-based RLS.

CREATE OR REPLACE FUNCTION public.requesting_user_is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM   public.profiles
    WHERE  id   = auth.uid()
    AND    role = 'admin'
  );
END;
$$;

-- Allow authenticated users to call the function
GRANT EXECUTE ON FUNCTION public.requesting_user_is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.requesting_user_is_admin() TO anon;

-- ── 4. Row Level Security ──────────────────────────────────────────────────────
ALTER TABLE public.student_inquiries ENABLE ROW LEVEL SECURITY;

-- Drop old policies so re-running is safe
DROP POLICY IF EXISTS "student_inquiries: public insert"  ON public.student_inquiries;
DROP POLICY IF EXISTS "student_inquiries: admin select"   ON public.student_inquiries;
DROP POLICY IF EXISTS "student_inquiries: admin update"   ON public.student_inquiries;

-- Public visitors (anon + authenticated) can submit inquiries
CREATE POLICY "student_inquiries: public insert"
  ON public.student_inquiries FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can read — uses SECURITY DEFINER helper to avoid subquery RLS issue
CREATE POLICY "student_inquiries: admin select"
  ON public.student_inquiries FOR SELECT
  USING (public.requesting_user_is_admin());

-- Only admins can update status/notes
CREATE POLICY "student_inquiries: admin update"
  ON public.student_inquiries FOR UPDATE
  USING (public.requesting_user_is_admin());
