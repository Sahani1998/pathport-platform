-- ============================================================================
-- Sprint E2 — Employer Portal Completion (World-Class Foundation)
--
-- Run AFTER sprint_e1_employer_internship.sql.
--
-- Section 0 renames the E1 tables to their final, future-ready names:
--   internship_postings    → postings
--   internship_candidacies → candidacies
--   internship_eligibility → posting_eligibility
-- (Safe + idempotent — only renames if the old name still exists.)
--
-- Then: extends postings/candidacies, creates 9 new tables, a dashboard RPC,
-- and two storage buckets (employer-media = public assets, employer-docs =
-- private verification docs). All statements idempotent — safe to re-run.
-- ============================================================================


-- ── 0. Rename E1 tables to final names ──────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='internship_postings') THEN
    EXECUTE 'ALTER TABLE public.internship_postings RENAME TO postings';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='internship_candidacies') THEN
    EXECUTE 'ALTER TABLE public.internship_candidacies RENAME TO candidacies';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='internship_eligibility') THEN
    EXECUTE 'ALTER TABLE public.internship_eligibility RENAME TO posting_eligibility';
  END IF;
END $$;


-- ── 1. postings — future-ready columns ──────────────────────────────────────
ALTER TABLE public.postings
  ADD COLUMN IF NOT EXISTS posting_type           TEXT        NOT NULL DEFAULT 'internship',
  ADD COLUMN IF NOT EXISTS country_code           TEXT        NOT NULL DEFAULT 'SG',
  ADD COLUMN IF NOT EXISTS currency_code          TEXT        NOT NULL DEFAULT 'SGD',
  ADD COLUMN IF NOT EXISTS working_hours_per_week INTEGER,
  ADD COLUMN IF NOT EXISTS benefits               TEXT[]      NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS archived_at            TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by            UUID        REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS duplicated_from_id     UUID        REFERENCES public.postings(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='postings' AND column_name='monthly_allowance_sgd') THEN
    EXECUTE 'ALTER TABLE public.postings RENAME COLUMN monthly_allowance_sgd TO monthly_allowance';
  END IF;

  ALTER TABLE public.postings DROP CONSTRAINT IF EXISTS postings_status_check;
  ALTER TABLE public.postings DROP CONSTRAINT IF EXISTS internship_postings_status_check;
  ALTER TABLE public.postings ADD CONSTRAINT postings_status_check
    CHECK (status IN ('draft','open','paused','closed','filled','archived'));

  ALTER TABLE public.postings DROP CONSTRAINT IF EXISTS postings_posting_type_check;
  ALTER TABLE public.postings ADD CONSTRAINT postings_posting_type_check
    CHECK (posting_type IN ('internship','graduate_job','permanent','contract','part_time'));
END $$;

CREATE INDEX IF NOT EXISTS idx_p_posting_type ON public.postings(posting_type);
CREATE INDEX IF NOT EXISTS idx_p_country      ON public.postings(country_code);
CREATE INDEX IF NOT EXISTS idx_p_open_active  ON public.postings(status, created_at DESC) WHERE status = 'open';


-- ── 2. candidacies — new stages + modal fields ──────────────────────────────
ALTER TABLE public.candidacies
  ADD COLUMN IF NOT EXISTS interview_location      TEXT,
  ADD COLUMN IF NOT EXISTS interview_mode          TEXT,
  ADD COLUMN IF NOT EXISTS offer_currency          TEXT DEFAULT 'SGD',
  ADD COLUMN IF NOT EXISTS offer_response_deadline DATE,
  ADD COLUMN IF NOT EXISTS offer_terms             TEXT,
  ADD COLUMN IF NOT EXISTS rejection_category      TEXT,
  ADD COLUMN IF NOT EXISTS student_decline_reason  TEXT;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='candidacies' AND column_name='offer_allowance_sgd') THEN
    EXECUTE 'ALTER TABLE public.candidacies RENAME COLUMN offer_allowance_sgd TO offer_allowance';
  END IF;

  ALTER TABLE public.candidacies DROP CONSTRAINT IF EXISTS candidacies_status_check;
  ALTER TABLE public.candidacies DROP CONSTRAINT IF EXISTS internship_candidacies_status_check;
  ALTER TABLE public.candidacies ADD CONSTRAINT candidacies_status_check
    CHECK (status IN (
      'applied','under_review','shortlisted',
      'interview_scheduled','interview_completed',
      'offer_extended','offer_accepted','offer_declined',
      'hired','started_internship','completed_internship',
      'withdrawn','rejected','cancelled'
    ));

  ALTER TABLE public.candidacies DROP CONSTRAINT IF EXISTS candidacies_interview_mode_check;
  ALTER TABLE public.candidacies ADD CONSTRAINT candidacies_interview_mode_check
    CHECK (interview_mode IS NULL OR interview_mode IN ('in_person','video','phone'));

  ALTER TABLE public.candidacies DROP CONSTRAINT IF EXISTS candidacies_rejection_category_check;
  ALTER TABLE public.candidacies ADD CONSTRAINT candidacies_rejection_category_check
    CHECK (rejection_category IS NULL OR rejection_category IN ('not_qualified','position_filled','not_suitable','no_response','other'));
END $$;

CREATE INDEX IF NOT EXISTS idx_c_posting_status ON public.candidacies(posting_id, status, applied_at DESC);

-- Refresh student update policy to allow withdraw + accept/decline of offers
DO $$
BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "c: student withdraw" ON public.candidacies';
  EXECUTE 'CREATE POLICY "c: student withdraw" ON public.candidacies FOR UPDATE TO authenticated
    USING (student_id = auth.uid())
    WITH CHECK (student_id = auth.uid() AND status IN (''withdrawn'',''offer_accepted'',''offer_declined''))';
END $$;


-- ── 3. employer_company_offices ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.employer_company_offices (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID        NOT NULL REFERENCES public.employer_companies(id) ON DELETE CASCADE,
  label         TEXT        NOT NULL,
  is_hq         BOOLEAN     NOT NULL DEFAULT false,
  address_line1 TEXT,
  address_line2 TEXT,
  city          TEXT        NOT NULL,
  state         TEXT,
  postal_code   TEXT,
  country_code  TEXT        NOT NULL DEFAULT 'SG',
  phone         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_eco_company_id ON public.employer_company_offices(company_id);
DROP TRIGGER IF EXISTS trg_eco_touch ON public.employer_company_offices;
CREATE TRIGGER trg_eco_touch BEFORE UPDATE ON public.employer_company_offices FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
ALTER TABLE public.employer_company_offices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "eco: employer rw" ON public.employer_company_offices;
DROP POLICY IF EXISTS "eco: read public" ON public.employer_company_offices;
DROP POLICY IF EXISTS "eco: admin all"   ON public.employer_company_offices;
CREATE POLICY "eco: employer rw" ON public.employer_company_offices FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.employer_companies ec WHERE ec.id = company_id AND ec.employer_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.employer_companies ec WHERE ec.id = company_id AND ec.employer_id = auth.uid()));
CREATE POLICY "eco: read public" ON public.employer_company_offices FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.postings p WHERE p.company_id = company_id AND p.status = 'open')
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('institution','admin')
  );
CREATE POLICY "eco: admin all" ON public.employer_company_offices FOR ALL TO authenticated
  USING (public.requesting_user_is_admin()) WITH CHECK (public.requesting_user_is_admin());


-- ── 4. employer_recruiters ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.employer_recruiters (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID        NOT NULL REFERENCES public.employer_companies(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT        NOT NULL DEFAULT 'recruiter' CHECK (role IN ('owner','admin','recruiter','viewer')),
  invited_by  UUID        REFERENCES auth.users(id),
  invited_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_er_company_id ON public.employer_recruiters(company_id);
CREATE INDEX IF NOT EXISTS idx_er_user_id    ON public.employer_recruiters(user_id);
DROP TRIGGER IF EXISTS trg_er_touch ON public.employer_recruiters;
CREATE TRIGGER trg_er_touch BEFORE UPDATE ON public.employer_recruiters FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
ALTER TABLE public.employer_recruiters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "er: company members read" ON public.employer_recruiters;
DROP POLICY IF EXISTS "er: owner manage"         ON public.employer_recruiters;
DROP POLICY IF EXISTS "er: admin all"            ON public.employer_recruiters;
CREATE POLICY "er: company members read" ON public.employer_recruiters FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.employer_companies ec WHERE ec.id = company_id AND ec.employer_id = auth.uid()) OR user_id = auth.uid());
CREATE POLICY "er: owner manage" ON public.employer_recruiters FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.employer_companies ec WHERE ec.id = company_id AND ec.employer_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.employer_companies ec WHERE ec.id = company_id AND ec.employer_id = auth.uid()));
CREATE POLICY "er: admin all" ON public.employer_recruiters FOR ALL TO authenticated
  USING (public.requesting_user_is_admin()) WITH CHECK (public.requesting_user_is_admin());


-- ── 5. employer_company_media (logo/banner/gallery) ─────────────────────────
CREATE TABLE IF NOT EXISTS public.employer_company_media (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID        NOT NULL REFERENCES public.employer_companies(id) ON DELETE CASCADE,
  media_type  TEXT        NOT NULL CHECK (media_type IN ('logo','banner','gallery','document','video')),
  bucket      TEXT        NOT NULL DEFAULT 'employer-media',
  path        TEXT        NOT NULL,
  caption     TEXT,
  mime_type   TEXT,
  file_size   BIGINT,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  is_public   BOOLEAN     NOT NULL DEFAULT true,
  uploaded_by UUID        REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ecm_company_id ON public.employer_company_media(company_id);
CREATE INDEX IF NOT EXISTS idx_ecm_media_type ON public.employer_company_media(media_type);
DROP TRIGGER IF EXISTS trg_ecm_touch ON public.employer_company_media;
CREATE TRIGGER trg_ecm_touch BEFORE UPDATE ON public.employer_company_media FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
ALTER TABLE public.employer_company_media ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ecm: employer rw" ON public.employer_company_media;
DROP POLICY IF EXISTS "ecm: read public" ON public.employer_company_media;
DROP POLICY IF EXISTS "ecm: admin all"   ON public.employer_company_media;
CREATE POLICY "ecm: employer rw" ON public.employer_company_media FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.employer_companies ec WHERE ec.id = company_id AND ec.employer_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.employer_companies ec WHERE ec.id = company_id AND ec.employer_id = auth.uid()));
CREATE POLICY "ecm: read public" ON public.employer_company_media FOR SELECT TO authenticated USING (is_public = true);
CREATE POLICY "ecm: admin all" ON public.employer_company_media FOR ALL TO authenticated
  USING (public.requesting_user_is_admin()) WITH CHECK (public.requesting_user_is_admin());


-- ── 6. employer_verification_docs (PRIVATE bucket) ──────────────────────────
CREATE TABLE IF NOT EXISTS public.employer_verification_docs (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       UUID        NOT NULL REFERENCES public.employer_companies(id) ON DELETE CASCADE,
  doc_type         TEXT        NOT NULL CHECK (doc_type IN ('registration_cert','acra','tax_doc','gov_letter','other')),
  bucket           TEXT        NOT NULL DEFAULT 'employer-docs',
  path             TEXT        NOT NULL,
  file_name        TEXT        NOT NULL,
  mime_type        TEXT,
  file_size        BIGINT,
  uploaded_by      UUID        REFERENCES auth.users(id),
  status           TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by      UUID        REFERENCES auth.users(id),
  reviewed_at      TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_evd_company_id ON public.employer_verification_docs(company_id);
CREATE INDEX IF NOT EXISTS idx_evd_status     ON public.employer_verification_docs(status);
DROP TRIGGER IF EXISTS trg_evd_touch ON public.employer_verification_docs;
CREATE TRIGGER trg_evd_touch BEFORE UPDATE ON public.employer_verification_docs FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
ALTER TABLE public.employer_verification_docs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "evd: employer rw" ON public.employer_verification_docs;
DROP POLICY IF EXISTS "evd: admin all"   ON public.employer_verification_docs;
CREATE POLICY "evd: employer rw" ON public.employer_verification_docs FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.employer_companies ec WHERE ec.id = company_id AND ec.employer_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.employer_companies ec WHERE ec.id = company_id AND ec.employer_id = auth.uid()));
CREATE POLICY "evd: admin all" ON public.employer_verification_docs FOR ALL TO authenticated
  USING (public.requesting_user_is_admin()) WITH CHECK (public.requesting_user_is_admin());


-- ── 7. employer_departments ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.employer_departments (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID        NOT NULL REFERENCES public.employer_companies(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  description TEXT,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, name)
);
CREATE INDEX IF NOT EXISTS idx_ed_company_id ON public.employer_departments(company_id);
DROP TRIGGER IF EXISTS trg_ed_touch ON public.employer_departments;
CREATE TRIGGER trg_ed_touch BEFORE UPDATE ON public.employer_departments FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
ALTER TABLE public.employer_departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ed: employer rw"   ON public.employer_departments;
DROP POLICY IF EXISTS "ed: read all auth" ON public.employer_departments;
DROP POLICY IF EXISTS "ed: admin all"     ON public.employer_departments;
CREATE POLICY "ed: employer rw" ON public.employer_departments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.employer_companies ec WHERE ec.id = company_id AND ec.employer_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.employer_companies ec WHERE ec.id = company_id AND ec.employer_id = auth.uid()));
CREATE POLICY "ed: read all auth" ON public.employer_departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "ed: admin all" ON public.employer_departments FOR ALL TO authenticated
  USING (public.requesting_user_is_admin()) WITH CHECK (public.requesting_user_is_admin());


-- ── 8. posting_attachments ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.posting_attachments (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  posting_id      UUID        NOT NULL REFERENCES public.postings(id) ON DELETE CASCADE,
  attachment_type TEXT        NOT NULL CHECK (attachment_type IN ('job_description','banner','gallery','other')),
  bucket          TEXT        NOT NULL DEFAULT 'employer-media',
  path            TEXT        NOT NULL,
  file_name       TEXT,
  mime_type       TEXT,
  file_size       BIGINT,
  caption         TEXT,
  sort_order      INTEGER     NOT NULL DEFAULT 0,
  uploaded_by     UUID        REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pa_posting_id ON public.posting_attachments(posting_id);
DROP TRIGGER IF EXISTS trg_pa_touch ON public.posting_attachments;
CREATE TRIGGER trg_pa_touch BEFORE UPDATE ON public.posting_attachments FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
ALTER TABLE public.posting_attachments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pa: employer rw" ON public.posting_attachments;
DROP POLICY IF EXISTS "pa: read open"   ON public.posting_attachments;
DROP POLICY IF EXISTS "pa: admin all"   ON public.posting_attachments;
CREATE POLICY "pa: employer rw" ON public.posting_attachments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.postings p WHERE p.id = posting_id AND p.employer_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.postings p WHERE p.id = posting_id AND p.employer_id = auth.uid()));
CREATE POLICY "pa: read open" ON public.posting_attachments FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.postings p WHERE p.id = posting_id AND p.status = 'open')
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('institution','admin')
  );
CREATE POLICY "pa: admin all" ON public.posting_attachments FOR ALL TO authenticated
  USING (public.requesting_user_is_admin()) WITH CHECK (public.requesting_user_is_admin());


-- ── 9. candidacy_timeline_events ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.candidacy_timeline_events (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  candidacy_id       UUID        NOT NULL REFERENCES public.candidacies(id) ON DELETE CASCADE,
  status             TEXT        NOT NULL,
  title              TEXT        NOT NULL,
  description        TEXT,
  created_by         UUID        REFERENCES auth.users(id),
  created_by_role    TEXT,
  visible_to_student BOOLEAN     NOT NULL DEFAULT true,
  metadata           JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cte_candidacy_id ON public.candidacy_timeline_events(candidacy_id, created_at DESC);
ALTER TABLE public.candidacy_timeline_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cte: student read own"  ON public.candidacy_timeline_events;
DROP POLICY IF EXISTS "cte: employer read own" ON public.candidacy_timeline_events;
DROP POLICY IF EXISTS "cte: institution read"  ON public.candidacy_timeline_events;
DROP POLICY IF EXISTS "cte: admin all"         ON public.candidacy_timeline_events;
CREATE POLICY "cte: student read own" ON public.candidacy_timeline_events FOR SELECT TO authenticated
  USING (visible_to_student = true AND EXISTS (SELECT 1 FROM public.candidacies c WHERE c.id = candidacy_id AND c.student_id = auth.uid()));
CREATE POLICY "cte: employer read own" ON public.candidacy_timeline_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.candidacies c JOIN public.postings p ON p.id = c.posting_id WHERE c.id = candidacy_id AND p.employer_id = auth.uid()));
CREATE POLICY "cte: institution read" ON public.candidacy_timeline_events FOR SELECT TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('institution','admin'));
CREATE POLICY "cte: admin all" ON public.candidacy_timeline_events FOR ALL TO authenticated
  USING (public.requesting_user_is_admin()) WITH CHECK (public.requesting_user_is_admin());


-- ── 10. candidacy_messages ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.candidacy_messages (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  candidacy_id UUID        NOT NULL REFERENCES public.candidacies(id) ON DELETE CASCADE,
  sender_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role  TEXT        NOT NULL CHECK (sender_role IN ('employer','student','admin')),
  message      TEXT        NOT NULL,
  read_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cm_candidacy_id ON public.candidacy_messages(candidacy_id, created_at DESC);
ALTER TABLE public.candidacy_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cm: participant read"   ON public.candidacy_messages;
DROP POLICY IF EXISTS "cm: participant insert" ON public.candidacy_messages;
DROP POLICY IF EXISTS "cm: own read mark"      ON public.candidacy_messages;
DROP POLICY IF EXISTS "cm: admin all"          ON public.candidacy_messages;
CREATE POLICY "cm: participant read" ON public.candidacy_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.candidacies c JOIN public.postings p ON p.id = c.posting_id WHERE c.id = candidacy_id AND (c.student_id = auth.uid() OR p.employer_id = auth.uid())));
CREATE POLICY "cm: participant insert" ON public.candidacy_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND EXISTS (SELECT 1 FROM public.candidacies c JOIN public.postings p ON p.id = c.posting_id WHERE c.id = candidacy_id AND (c.student_id = auth.uid() OR p.employer_id = auth.uid())));
CREATE POLICY "cm: own read mark" ON public.candidacy_messages FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.candidacies c JOIN public.postings p ON p.id = c.posting_id WHERE c.id = candidacy_id AND (c.student_id = auth.uid() OR p.employer_id = auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.candidacies c JOIN public.postings p ON p.id = c.posting_id WHERE c.id = candidacy_id AND (c.student_id = auth.uid() OR p.employer_id = auth.uid())));
CREATE POLICY "cm: admin all" ON public.candidacy_messages FOR ALL TO authenticated
  USING (public.requesting_user_is_admin()) WITH CHECK (public.requesting_user_is_admin());


-- ── 11. employer_audit_log ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.employer_audit_log (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID        REFERENCES public.employer_companies(id) ON DELETE CASCADE,
  entity_type TEXT        NOT NULL CHECK (entity_type IN ('company','posting','candidacy','recruiter','office','department','media','verification')),
  entity_id   UUID        NOT NULL,
  actor_id    UUID        REFERENCES auth.users(id),
  actor_role  TEXT,
  action      TEXT        NOT NULL,
  from_value  TEXT,
  to_value    TEXT,
  reason      TEXT,
  comments    TEXT,
  metadata    JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_eal_company_id ON public.employer_audit_log(company_id);
CREATE INDEX IF NOT EXISTS idx_eal_entity     ON public.employer_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_eal_created_at ON public.employer_audit_log(created_at DESC);
ALTER TABLE public.employer_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "eal: employer read own" ON public.employer_audit_log;
DROP POLICY IF EXISTS "eal: admin all"         ON public.employer_audit_log;
CREATE POLICY "eal: employer read own" ON public.employer_audit_log FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.employer_companies ec WHERE ec.id = company_id AND ec.employer_id = auth.uid()));
CREATE POLICY "eal: admin all" ON public.employer_audit_log FOR ALL TO authenticated
  USING (public.requesting_user_is_admin()) WITH CHECK (public.requesting_user_is_admin());


-- ── 12. get_employer_dashboard_stats RPC (auth-guarded) ─────────────────────
CREATE OR REPLACE FUNCTION public.get_employer_dashboard_stats(p_employer_id UUID)
RETURNS TABLE (
  open_postings       BIGINT,
  draft_postings      BIGINT,
  total_postings      BIGINT,
  active_candidacies  BIGINT,
  applied_count       BIGINT,
  shortlisted_count   BIGINT,
  interview_count     BIGINT,
  offer_count         BIGINT,
  hired_count         BIGINT,
  rejected_count      BIGINT,
  upcoming_interviews BIGINT,
  pending_decisions   BIGINT
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  -- Caller may only request their OWN stats (or admin). Guards against an
  -- authenticated user passing another employer's id via direct PostgREST RPC.
  WITH guard AS (
    SELECT CASE
      WHEN p_employer_id = auth.uid() THEN p_employer_id
      WHEN public.requesting_user_is_admin() THEN p_employer_id
      ELSE NULL
    END AS eid
  ),
  my_postings AS (
    SELECT id, status FROM public.postings WHERE employer_id = (SELECT eid FROM guard)
  ),
  my_candidacies AS (
    SELECT c.* FROM public.candidacies c JOIN my_postings p ON p.id = c.posting_id
  )
  SELECT
    (SELECT COUNT(*) FROM my_postings WHERE status = 'open'),
    (SELECT COUNT(*) FROM my_postings WHERE status = 'draft'),
    (SELECT COUNT(*) FROM my_postings),
    (SELECT COUNT(*) FROM my_candidacies WHERE status NOT IN ('rejected','withdrawn','cancelled','completed_internship','offer_declined')),
    (SELECT COUNT(*) FROM my_candidacies WHERE status = 'applied'),
    (SELECT COUNT(*) FROM my_candidacies WHERE status = 'shortlisted'),
    (SELECT COUNT(*) FROM my_candidacies WHERE status IN ('interview_scheduled','interview_completed')),
    (SELECT COUNT(*) FROM my_candidacies WHERE status IN ('offer_extended','offer_accepted')),
    (SELECT COUNT(*) FROM my_candidacies WHERE status IN ('hired','started_internship','completed_internship')),
    (SELECT COUNT(*) FROM my_candidacies WHERE status = 'rejected'),
    (SELECT COUNT(*) FROM my_candidacies WHERE status = 'interview_scheduled' AND interview_date > now()),
    (SELECT COUNT(*) FROM my_candidacies WHERE status IN ('applied','interview_completed','offer_accepted'))
$$;
GRANT EXECUTE ON FUNCTION public.get_employer_dashboard_stats(UUID) TO authenticated;


-- ── 13. Storage buckets ─────────────────────────────────────────────────────
-- Public assets (logo, banner, gallery, JD attachments)
INSERT INTO storage.buckets (id, name, public)
VALUES ('employer-media', 'employer-media', true)
ON CONFLICT (id) DO NOTHING;

-- Private docs (verification certificates) — admin-reviewed, never public
INSERT INTO storage.buckets (id, name, public)
VALUES ('employer-docs', 'employer-docs', false)
ON CONFLICT (id) DO NOTHING;


-- ── Verification ──────────────────────────────────────────────────────────────
-- SELECT table_name FROM information_schema.tables WHERE table_schema='public'
--   AND table_name IN ('postings','candidacies','posting_eligibility',
--     'employer_company_offices','employer_recruiters','employer_company_media',
--     'employer_verification_docs','employer_departments','posting_attachments',
--     'candidacy_timeline_events','candidacy_messages','employer_audit_log');
