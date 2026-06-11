-- ─── Sprint 11: Partner Approval & Account Activation ───────────────────────
-- Run once in Supabase SQL Editor (project owner).
-- Safe to re-run: all statements use IF NOT EXISTS / IF EXISTS / DROP-then-CREATE.
-- Safe on a fresh database: creates partner_applications if it doesn't exist.

-- ─── 1. Create partner_applications if missing ──────────────────────────────
-- Schema mirrors src/app/partner-with-us/page.tsx form fields exactly.
CREATE TABLE IF NOT EXISTS public.partner_applications (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_name     TEXT        NOT NULL,
  contact_name TEXT        NOT NULL,
  email        TEXT        NOT NULL,
  phone        TEXT        NOT NULL,
  partner_type TEXT        NOT NULL CHECK (partner_type IN ('institution', 'recruitment_partner', 'employer')),
  country      TEXT        NOT NULL,
  website      TEXT,
  message      TEXT,
  status       TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 2. Add approval columns (safe whether row exists or not) ────────────────
ALTER TABLE public.partner_applications
  ADD COLUMN IF NOT EXISTS status           TEXT        NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS approved_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rejected_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS created_user_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- ─── 3. Ensure status CHECK includes pending/approved/rejected ──────────────
-- (If the table was created by an older migration without the constraint, add it.)
-- Match against literal enum values to avoid colliding with NOT NULL constraints.
DO $$ DECLARE _con TEXT; BEGIN
  -- Drop any existing status check constraint that references our enum values
  FOR _con IN (
    SELECT conname
    FROM   pg_catalog.pg_constraint
    WHERE  conrelid = 'public.partner_applications'::regclass
      AND  contype  = 'c'
      AND  pg_get_constraintdef(oid) LIKE $s$%'pending'%$s$
      AND  pg_get_constraintdef(oid) LIKE $s$%'approved'%$s$
      AND  pg_get_constraintdef(oid) LIKE $s$%'rejected'%$s$
  ) LOOP
    EXECUTE format('ALTER TABLE public.partner_applications DROP CONSTRAINT %I', _con);
  END LOOP;

  -- Add the canonical check
  BEGIN
    ALTER TABLE public.partner_applications
      ADD CONSTRAINT partner_applications_status_check
      CHECK (status IN ('pending', 'approved', 'rejected'));
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ─── 4. Indexes ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_partner_apps_status     ON public.partner_applications(status);
CREATE INDEX IF NOT EXISTS idx_partner_apps_type       ON public.partner_applications(partner_type);
CREATE INDEX IF NOT EXISTS idx_partner_apps_created_at ON public.partner_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_partner_apps_email      ON public.partner_applications(email);

-- ─── 5. partner_account_audit_log ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.partner_account_audit_log (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID        NOT NULL REFERENCES public.partner_applications(id) ON DELETE CASCADE,
  partner_type    TEXT        NOT NULL,
  action          TEXT        NOT NULL CHECK (action IN ('approved', 'rejected', 'reactivated')),
  created_user_id UUID                    REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by      UUID                    REFERENCES auth.users(id) ON DELETE SET NULL,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_audit_app_id     ON public.partner_account_audit_log(application_id);
CREATE INDEX IF NOT EXISTS idx_partner_audit_created_at ON public.partner_account_audit_log(created_at DESC);

-- ─── 6. RLS on partner_applications ─────────────────────────────────────────
ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;

-- Public insert (anonymous visitors submit the form on /partner-with-us)
DROP POLICY IF EXISTS "partner_apps: public insert" ON public.partner_applications;
CREATE POLICY "partner_apps: public insert"
  ON public.partner_applications
  FOR INSERT
  WITH CHECK (true);

-- Admin: full access (depends on requesting_user_is_admin() created in admin_rls_fix.sql)
DROP POLICY IF EXISTS "partner_apps: admin all" ON public.partner_applications;
CREATE POLICY "partner_apps: admin all"
  ON public.partner_applications
  FOR ALL
  USING (public.requesting_user_is_admin())
  WITH CHECK (public.requesting_user_is_admin());

-- ─── 7. RLS on partner_account_audit_log ────────────────────────────────────
ALTER TABLE public.partner_account_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "partner_audit: admin all" ON public.partner_account_audit_log;
CREATE POLICY "partner_audit: admin all"
  ON public.partner_account_audit_log
  FOR ALL
  USING (public.requesting_user_is_admin())
  WITH CHECK (public.requesting_user_is_admin());

-- ─── 8. Notifications insert by admin ───────────────────────────────────────
-- The approve route inserts a welcome notification for the new partner user;
-- service-role bypasses RLS but admin-cookie path needs explicit permission.
-- Only create if the notifications table exists (it should, from sprint 8).
DO $$ BEGIN
  IF to_regclass('public.notifications') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "notifications: admin insert" ON public.notifications';
    EXECUTE 'CREATE POLICY "notifications: admin insert" ON public.notifications FOR INSERT WITH CHECK (public.requesting_user_is_admin())';
  END IF;
END $$;
