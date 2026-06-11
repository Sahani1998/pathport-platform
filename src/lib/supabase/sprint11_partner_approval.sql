-- ─── Sprint 11: Partner Approval & Account Activation ───────────────────────
-- Run once in Supabase SQL Editor (project owner).
-- Safe to re-run: all statements use IF EXISTS / ON CONFLICT guards.

-- ─── 1. Extend partner_applications ─────────────────────────────────────────
ALTER TABLE public.partner_applications
  ADD COLUMN IF NOT EXISTS approved_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rejected_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS created_user_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_partner_apps_status     ON public.partner_applications(status);
CREATE INDEX IF NOT EXISTS idx_partner_apps_type       ON public.partner_applications(partner_type);
CREATE INDEX IF NOT EXISTS idx_partner_apps_created_at ON public.partner_applications(created_at DESC);

-- ─── 2. partner_account_audit_log ────────────────────────────────────────────
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

CREATE INDEX IF NOT EXISTS idx_partner_audit_app_id    ON public.partner_account_audit_log(application_id);
CREATE INDEX IF NOT EXISTS idx_partner_audit_created_at ON public.partner_account_audit_log(created_at DESC);

ALTER TABLE public.partner_account_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "partner_audit: admin all" ON public.partner_account_audit_log;
CREATE POLICY "partner_audit: admin all"
  ON public.partner_account_audit_log
  FOR ALL
  USING (public.requesting_user_is_admin())
  WITH CHECK (public.requesting_user_is_admin());

-- ─── 3. RLS on partner_applications ─────────────────────────────────────────
ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;

-- Public insert (anonymous visitors submit the form)
DROP POLICY IF EXISTS "partner_apps: public insert" ON public.partner_applications;
CREATE POLICY "partner_apps: public insert"
  ON public.partner_applications
  FOR INSERT
  WITH CHECK (true);

-- Admin: full access
DROP POLICY IF EXISTS "partner_apps: admin all" ON public.partner_applications;
CREATE POLICY "partner_apps: admin all"
  ON public.partner_applications
  FOR ALL
  USING (public.requesting_user_is_admin())
  WITH CHECK (public.requesting_user_is_admin());

-- ─── 4. Ensure partner roles exist in the profiles role enum ─────────────────
-- The role column CHECK is set in schema.sql; no change needed.
-- Existing profiles CHECK: role IN ('student','admin','institution','recruitment_partner','employer')
-- All partner roles are already valid. Nothing to alter.

-- ─── 5. Notifications: allow service-role insert for partner activation ──────
-- The service-role key bypasses RLS entirely, so no extra policy needed.
-- However if the approve API runs as the admin user (via cookie client) we need:
DROP POLICY IF EXISTS "notifications: admin insert" ON public.notifications;
CREATE POLICY "notifications: admin insert"
  ON public.notifications
  FOR INSERT
  WITH CHECK (public.requesting_user_is_admin());
