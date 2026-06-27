-- ============================================================================
-- Sprint E1 — Employer Ecosystem + Internship Platform
-- Tables: employer_companies, internship_postings, internship_candidacies,
--         internship_eligibility
-- All statements idempotent — safe to re-run.
-- ============================================================================


-- ── 1. employer_companies ────────────────────────────────────────────────────
-- One company profile per employer account.
-- Employer creates/edits their own. Admin can verify.

CREATE TABLE IF NOT EXISTS public.employer_companies (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id      UUID        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name     TEXT        NOT NULL,
  industry         TEXT,
  company_size     TEXT        CHECK (company_size IN ('startup','sme','mid_market','enterprise')),
  website_url      TEXT,
  logo_url         TEXT,
  hq_city          TEXT        NOT NULL DEFAULT 'Singapore',
  hq_country       TEXT        NOT NULL DEFAULT 'Singapore',
  description      TEXT,
  linkedin_url     TEXT,
  is_verified      BOOLEAN     NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ec_employer_id ON public.employer_companies(employer_id);

DROP TRIGGER IF EXISTS trg_ec_touch ON public.employer_companies;
CREATE TRIGGER trg_ec_touch
  BEFORE UPDATE ON public.employer_companies
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.employer_companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ec: employer read own"   ON public.employer_companies;
DROP POLICY IF EXISTS "ec: employer write own"  ON public.employer_companies;
DROP POLICY IF EXISTS "ec: institution read"    ON public.employer_companies;
DROP POLICY IF EXISTS "ec: admin all"           ON public.employer_companies;

CREATE POLICY "ec: employer read own"
  ON public.employer_companies FOR SELECT TO authenticated
  USING (employer_id = auth.uid());

CREATE POLICY "ec: employer write own"
  ON public.employer_companies FOR ALL TO authenticated
  USING      (employer_id = auth.uid())
  WITH CHECK (employer_id = auth.uid());

-- Institutions need to see company details when reviewing candidacies
CREATE POLICY "ec: institution read"
  ON public.employer_companies FOR SELECT TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('institution','admin')
  );

CREATE POLICY "ec: admin all"
  ON public.employer_companies FOR ALL TO authenticated
  USING      (public.requesting_user_is_admin())
  WITH CHECK (public.requesting_user_is_admin());


-- ── 2. internship_postings ───────────────────────────────────────────────────
-- Job listings published by employers.
-- Students see open postings. Institutions can see all.

CREATE TABLE IF NOT EXISTS public.internship_postings (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id           UUID        REFERENCES public.employer_companies(id) ON DELETE SET NULL,
  title                TEXT        NOT NULL,
  department           TEXT,
  description          TEXT,
  requirements         TEXT,
  location             TEXT        NOT NULL DEFAULT 'Singapore',
  work_type            TEXT        NOT NULL DEFAULT 'onsite'
                                   CHECK (work_type IN ('onsite','hybrid','remote')),
  monthly_allowance_sgd NUMERIC(10,2) NOT NULL CHECK (monthly_allowance_sgd >= 0),
  duration_months      INTEGER     NOT NULL DEFAULT 6
                                   CHECK (duration_months BETWEEN 1 AND 24),
  openings             INTEGER     NOT NULL DEFAULT 1 CHECK (openings >= 1),
  status               TEXT        NOT NULL DEFAULT 'draft'
                                   CHECK (status IN ('draft','open','paused','closed','filled')),
  skills_required      TEXT[]      NOT NULL DEFAULT '{}',
  start_date           DATE,
  application_deadline DATE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ip_employer_id ON public.internship_postings(employer_id);
CREATE INDEX IF NOT EXISTS idx_ip_status      ON public.internship_postings(status);
CREATE INDEX IF NOT EXISTS idx_ip_created_at  ON public.internship_postings(created_at DESC);

DROP TRIGGER IF EXISTS trg_ip_touch ON public.internship_postings;
CREATE TRIGGER trg_ip_touch
  BEFORE UPDATE ON public.internship_postings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.internship_postings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ip: employer write own" ON public.internship_postings;
DROP POLICY IF EXISTS "ip: employer read own"  ON public.internship_postings;
DROP POLICY IF EXISTS "ip: student read open"  ON public.internship_postings;
DROP POLICY IF EXISTS "ip: institution read"   ON public.internship_postings;
DROP POLICY IF EXISTS "ip: admin all"          ON public.internship_postings;

CREATE POLICY "ip: employer write own"
  ON public.internship_postings FOR ALL TO authenticated
  USING      (employer_id = auth.uid())
  WITH CHECK (employer_id = auth.uid());

-- Students can only see open postings (eligibility checked at API level)
CREATE POLICY "ip: student read open"
  ON public.internship_postings FOR SELECT TO authenticated
  USING (status = 'open');

-- Institutions see all postings for placement oversight
CREATE POLICY "ip: institution read"
  ON public.internship_postings FOR SELECT TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('institution','admin')
  );

CREATE POLICY "ip: admin all"
  ON public.internship_postings FOR ALL TO authenticated
  USING      (public.requesting_user_is_admin())
  WITH CHECK (public.requesting_user_is_admin());


-- ── 3. internship_candidacies ────────────────────────────────────────────────
-- Student applications to internship postings.
-- Student applies and tracks status. Employer manages the pipeline.

CREATE TABLE IF NOT EXISTS public.internship_candidacies (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  posting_id           UUID        NOT NULL REFERENCES public.internship_postings(id) ON DELETE CASCADE,
  student_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id       UUID        REFERENCES public.applications(id) ON DELETE SET NULL,
  status               TEXT        NOT NULL DEFAULT 'applied'
                                   CHECK (status IN (
                                     'applied','shortlisted','interview_scheduled',
                                     'interview_completed','offer_extended','offer_accepted',
                                     'offer_declined','hired','withdrawn','rejected'
                                   )),
  cover_note           TEXT,
  resume_url           TEXT,
  interview_date       TIMESTAMPTZ,
  interview_notes      TEXT,       -- employer-only
  offer_allowance_sgd  NUMERIC(10,2),
  offer_start_date     DATE,
  rejection_reason     TEXT,       -- employer-only
  employer_notes       TEXT,       -- employer-only
  applied_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(posting_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_ic_posting_id  ON public.internship_candidacies(posting_id);
CREATE INDEX IF NOT EXISTS idx_ic_student_id  ON public.internship_candidacies(student_id);
CREATE INDEX IF NOT EXISTS idx_ic_status      ON public.internship_candidacies(status);
CREATE INDEX IF NOT EXISTS idx_ic_applied_at  ON public.internship_candidacies(applied_at DESC);

DROP TRIGGER IF EXISTS trg_ic_touch ON public.internship_candidacies;
CREATE TRIGGER trg_ic_touch
  BEFORE UPDATE ON public.internship_candidacies
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.internship_candidacies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ic: student read own"    ON public.internship_candidacies;
DROP POLICY IF EXISTS "ic: student insert"      ON public.internship_candidacies;
DROP POLICY IF EXISTS "ic: student withdraw"    ON public.internship_candidacies;
DROP POLICY IF EXISTS "ic: employer read own"   ON public.internship_candidacies;
DROP POLICY IF EXISTS "ic: employer update own" ON public.internship_candidacies;
DROP POLICY IF EXISTS "ic: institution read"    ON public.internship_candidacies;
DROP POLICY IF EXISTS "ic: admin all"           ON public.internship_candidacies;

CREATE POLICY "ic: student read own"
  ON public.internship_candidacies FOR SELECT TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "ic: student insert"
  ON public.internship_candidacies FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());

-- Students can only withdraw (set status = 'withdrawn')
CREATE POLICY "ic: student withdraw"
  ON public.internship_candidacies FOR UPDATE TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid() AND status = 'withdrawn');

-- Employers can read candidacies for their own postings
CREATE POLICY "ic: employer read own"
  ON public.internship_candidacies FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.internship_postings ip
      WHERE ip.id = posting_id AND ip.employer_id = auth.uid()
    )
  );

-- Employers can update candidacies for their own postings
CREATE POLICY "ic: employer update own"
  ON public.internship_candidacies FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.internship_postings ip
      WHERE ip.id = posting_id AND ip.employer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.internship_postings ip
      WHERE ip.id = posting_id AND ip.employer_id = auth.uid()
    )
  );

-- Institutions can view candidacies for their students
CREATE POLICY "ic: institution read"
  ON public.internship_candidacies FOR SELECT TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('institution','admin')
  );

CREATE POLICY "ic: admin all"
  ON public.internship_candidacies FOR ALL TO authenticated
  USING      (public.requesting_user_is_admin())
  WITH CHECK (public.requesting_user_is_admin());


-- ── 4. internship_eligibility ────────────────────────────────────────────────
-- Fine-grained institution control over student internship access.
-- Auto-created when student reaches internship_eligible stage.
-- Institutions can suspend (e.g. attendance issues) and resume.

CREATE TABLE IF NOT EXISTS public.internship_eligibility (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       UUID        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id   UUID        REFERENCES public.applications(id) ON DELETE SET NULL,
  institution_id   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  status           TEXT        NOT NULL DEFAULT 'not_eligible'
                               CHECK (status IN ('not_eligible','eligible','suspended')),
  enabled_at       TIMESTAMPTZ,
  enabled_by       UUID        REFERENCES auth.users(id),
  suspended_at     TIMESTAMPTZ,
  suspended_by     UUID        REFERENCES auth.users(id),
  suspension_reason TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ie_student_id     ON public.internship_eligibility(student_id);
CREATE INDEX IF NOT EXISTS idx_ie_institution_id ON public.internship_eligibility(institution_id);
CREATE INDEX IF NOT EXISTS idx_ie_status         ON public.internship_eligibility(status);

DROP TRIGGER IF EXISTS trg_ie_touch ON public.internship_eligibility;
CREATE TRIGGER trg_ie_touch
  BEFORE UPDATE ON public.internship_eligibility
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.internship_eligibility ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ie: student read own"    ON public.internship_eligibility;
DROP POLICY IF EXISTS "ie: institution manage"  ON public.internship_eligibility;
DROP POLICY IF EXISTS "ie: admin all"           ON public.internship_eligibility;

CREATE POLICY "ie: student read own"
  ON public.internship_eligibility FOR SELECT TO authenticated
  USING (student_id = auth.uid());

-- Institutions can insert and update eligibility for their own students
CREATE POLICY "ie: institution manage"
  ON public.internship_eligibility FOR ALL TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('institution','admin')
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('institution','admin')
  );

CREATE POLICY "ie: admin all"
  ON public.internship_eligibility FOR ALL TO authenticated
  USING      (public.requesting_user_is_admin())
  WITH CHECK (public.requesting_user_is_admin());


-- ── Verification ──────────────────────────────────────────────────────────────
-- SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public'
--   AND table_name IN (
--     'employer_companies','internship_postings',
--     'internship_candidacies','internship_eligibility'
--   );
