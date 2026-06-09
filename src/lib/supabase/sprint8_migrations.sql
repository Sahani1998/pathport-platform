-- ═══════════════════════════════════════════════════════════════════════════════
-- PathPort — Sprint 8 Production Readiness Migrations
-- Safe to re-run. Paste into Supabase Dashboard → SQL Editor → Run.
--
-- Contents:
--   1. Extend profiles with passport / DOB / nationality / emergency contact
--   2. Create student_education table (multi-row history per student)
--   3. Create email_log table (transaction log for every email attempt)
--   4. Create application_audit_log table (internal who-did-what record)
--   5. Add withdrawal fields to applications
-- ═══════════════════════════════════════════════════════════════════════════════


-- ── 1. Extend profiles ───────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS date_of_birth                 DATE,
  ADD COLUMN IF NOT EXISTS nationality                   TEXT,
  ADD COLUMN IF NOT EXISTS passport_number               TEXT,
  ADD COLUMN IF NOT EXISTS passport_country              TEXT,
  ADD COLUMN IF NOT EXISTS passport_expiry               DATE,
  ADD COLUMN IF NOT EXISTS emergency_contact_name        TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone       TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_relationship TEXT;


-- ── 2. student_education table ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.student_education (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_name TEXT        NOT NULL,
  qualification    TEXT        NOT NULL,
  field_of_study   TEXT,
  start_year       INTEGER,
  end_year         INTEGER,
  grade            TEXT,
  is_current       BOOLEAN     NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ          DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS student_education_user_idx
  ON public.student_education (user_id);

ALTER TABLE public.student_education ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "education: own select" ON public.student_education;
DROP POLICY IF EXISTS "education: own insert" ON public.student_education;
DROP POLICY IF EXISTS "education: own update" ON public.student_education;
DROP POLICY IF EXISTS "education: own delete" ON public.student_education;
DROP POLICY IF EXISTS "education: admin all"  ON public.student_education;

CREATE POLICY "education: own select"
  ON public.student_education FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "education: own insert"
  ON public.student_education FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "education: own update"
  ON public.student_education FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "education: own delete"
  ON public.student_education FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "education: admin all"
  ON public.student_education FOR ALL
  USING (public.requesting_user_is_admin());


-- ── 3. email_log table ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.email_log (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email        TEXT        NOT NULL,
  template        TEXT        NOT NULL,
  subject         TEXT        NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'queued'
                              CHECK (status IN ('queued', 'sent', 'failed', 'skipped')),
  error_message   TEXT,
  application_id  UUID        REFERENCES public.applications(id) ON DELETE SET NULL,
  user_id         UUID        REFERENCES auth.users(id)         ON DELETE SET NULL,
  metadata        JSONB,
  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS email_log_status_idx      ON public.email_log (status);
CREATE INDEX IF NOT EXISTS email_log_user_idx        ON public.email_log (user_id);
CREATE INDEX IF NOT EXISTS email_log_application_idx ON public.email_log (application_id);
CREATE INDEX IF NOT EXISTS email_log_created_idx     ON public.email_log (created_at DESC);

ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_log: admin all" ON public.email_log;
DROP POLICY IF EXISTS "email_log: own read"  ON public.email_log;

CREATE POLICY "email_log: admin all"
  ON public.email_log FOR ALL
  USING (public.requesting_user_is_admin());

CREATE POLICY "email_log: own read"
  ON public.email_log FOR SELECT
  USING (user_id = auth.uid());


-- ── 4. application_audit_log table ───────────────────────────────────────────
-- Internal record of every state-changing action. Distinct from
-- application_timeline_events (which is student-facing storytelling).
CREATE TABLE IF NOT EXISTS public.application_audit_log (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID        NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  actor_id       UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role     TEXT,
  action         TEXT        NOT NULL,
  from_value     TEXT,
  to_value       TEXT,
  reason         TEXT,
  comments       TEXT,
  metadata       JSONB,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_log_application_idx ON public.application_audit_log (application_id);
CREATE INDEX IF NOT EXISTS audit_log_actor_idx       ON public.application_audit_log (actor_id);
CREATE INDEX IF NOT EXISTS audit_log_action_idx      ON public.application_audit_log (action);
CREATE INDEX IF NOT EXISTS audit_log_created_idx     ON public.application_audit_log (created_at DESC);

ALTER TABLE public.application_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_log: admin all"            ON public.application_audit_log;
DROP POLICY IF EXISTS "audit_log: institution scoped"   ON public.application_audit_log;

CREATE POLICY "audit_log: admin all"
  ON public.application_audit_log FOR ALL
  USING (public.requesting_user_is_admin());

CREATE POLICY "audit_log: institution scoped"
  ON public.application_audit_log FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.id = application_audit_log.application_id
      AND public.user_owns_course_college(a.course_id)
  ));


-- ── 5. Withdrawal fields on applications ────────────────────────────────────
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS withdrawal_reason   TEXT,
  ADD COLUMN IF NOT EXISTS withdrawal_comments TEXT,
  ADD COLUMN IF NOT EXISTS withdrawn_at        TIMESTAMPTZ;
