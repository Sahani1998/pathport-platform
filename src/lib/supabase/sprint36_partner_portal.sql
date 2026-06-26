-- ============================================================================
-- Sprint 36 — Recruitment Partner Portal
-- New tables: partner_students, partner_commissions
-- All statements idempotent — safe to re-run.
-- ============================================================================


-- ── 1. partner_students ──────────────────────────────────────────────────────
-- Associates a recruitment_partner with their referred students.
-- Admin creates these records via Supabase dashboard or admin UI.

CREATE TABLE IF NOT EXISTS public.partner_students (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes       TEXT,
  created_by  UUID        REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(partner_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_ps_partner_id  ON public.partner_students(partner_id);
CREATE INDEX IF NOT EXISTS idx_ps_student_id  ON public.partner_students(student_id);
CREATE INDEX IF NOT EXISTS idx_ps_referred_at ON public.partner_students(referred_at DESC);

ALTER TABLE public.partner_students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ps: partner read own" ON public.partner_students;
CREATE POLICY "ps: partner read own"
  ON public.partner_students FOR SELECT TO authenticated
  USING (partner_id = auth.uid());

DROP POLICY IF EXISTS "ps: admin all" ON public.partner_students;
CREATE POLICY "ps: admin all"
  ON public.partner_students FOR ALL TO authenticated
  USING      (public.requesting_user_is_admin())
  WITH CHECK (public.requesting_user_is_admin());


-- ── 2. partner_commissions ───────────────────────────────────────────────────
-- Commission records per student/application. Admin creates & updates.
-- Partner reads their own.

CREATE TABLE IF NOT EXISTS public.partner_commissions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id  UUID        REFERENCES public.applications(id) ON DELETE SET NULL,
  student_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_cents    BIGINT      NOT NULL DEFAULT 0 CHECK (amount_cents >= 0),
  currency        TEXT        NOT NULL DEFAULT 'SGD'
                              CHECK (currency IN ('SGD','USD','INR','GBP','EUR','AUD')),
  status          TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','approved','paid','cancelled')),
  description     TEXT,
  paid_at         TIMESTAMPTZ,
  paid_by         UUID        REFERENCES auth.users(id),
  approved_at     TIMESTAMPTZ,
  approved_by     UUID        REFERENCES auth.users(id),
  notes           TEXT,
  created_by      UUID        REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pc_partner_id     ON public.partner_commissions(partner_id);
CREATE INDEX IF NOT EXISTS idx_pc_status         ON public.partner_commissions(status);
CREATE INDEX IF NOT EXISTS idx_pc_created_at     ON public.partner_commissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pc_application_id ON public.partner_commissions(application_id)
  WHERE application_id IS NOT NULL;

-- updated_at trigger (reuse existing touch_updated_at function)
DROP TRIGGER IF EXISTS trg_pc_touch ON public.partner_commissions;
CREATE TRIGGER trg_pc_touch
  BEFORE UPDATE ON public.partner_commissions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.partner_commissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pc: partner read own" ON public.partner_commissions;
CREATE POLICY "pc: partner read own"
  ON public.partner_commissions FOR SELECT TO authenticated
  USING (partner_id = auth.uid());

DROP POLICY IF EXISTS "pc: admin all" ON public.partner_commissions;
CREATE POLICY "pc: admin all"
  ON public.partner_commissions FOR ALL TO authenticated
  USING      (public.requesting_user_is_admin())
  WITH CHECK (public.requesting_user_is_admin());


-- ── 3. Notifications: allow partner to receive system notifications ──────────
-- The existing "notif: student select own" policy already allows any user to
-- SELECT notifications WHERE user_id = auth.uid(). No additional policy needed.
-- Verify the existing policy covers partner role (it does — it checks user_id only).


-- ── Verification (run manually) ──────────────────────────────────────────────
-- SELECT COUNT(*) FROM public.partner_students;
-- SELECT COUNT(*) FROM public.partner_commissions;
-- SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public' AND table_name IN ('partner_students','partner_commissions');
