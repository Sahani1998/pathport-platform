-- ============================================================================
-- Sprint 17 — Finance Foundation (PR-A)
-- ============================================================================
-- Schema + public IDs + helpers. Zero behaviour change.
-- All statements idempotent — safe to re-run.
--
-- Delivers:
--   1. profiles.public_id   — PP-YYYY-NNNNNN  (per-year sequence, 6 digits)
--   2. applications.public_id — APP-YYYY-NNNNNN
--   3. colleges.short_code  — 2–6 uppercase letters, UNIQUE
--   4. Seven new finance tables with full RLS using existing helpers:
--      - college_payment_settings
--      - course_fee_schedules
--      - student_invoices            (numbered DIM-INV-YYYY-NNNN per college/year)
--      - invoice_line_items
--      - payment_attempts            (reference DIM-INV-YYYY-NNNN-NN-X with checksum)
--      - payment_proofs              (student-uploaded transfer evidence)
--      - official_receipts           (numbered DIM-RCP-YYYY-NNNN per college/year)
--   5. Three new private storage buckets: invoices, payment-proofs, official-receipts
--   6. ID + reference generation helpers (per-year, per-college sequences)
--
-- Does NOT introduce:
--   - New application stages (reuses fee_payment_pending)
--   - New notification types (reuses payment_update)
--   - New audit log table (reuses application_audit_log)
--   - New realtime publication entries
--   - Any new email templates (added in PR-C/PR-D)
--   - Any API routes or UI (PR-B/C/D)
-- ============================================================================


-- ============================================================================
-- 1. PUBLIC IDs ON profiles / applications + colleges.short_code
-- ============================================================================

-- 1a. profiles.public_id ------------------------------------------------------

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS public_id TEXT;

CREATE OR REPLACE FUNCTION public.next_pp_id() RETURNS TEXT
LANGUAGE plpgsql AS $$
DECLARE
  v_year     TEXT := to_char(now(), 'YYYY');
  v_seq_name TEXT := 'pp_id_seq_' || v_year;
  v_n        BIGINT;
BEGIN
  EXECUTE format('CREATE SEQUENCE IF NOT EXISTS public.%I MINVALUE 1', v_seq_name);
  EXECUTE format('SELECT nextval(%L)', 'public.' || v_seq_name) INTO v_n;
  RETURN 'PP-' || v_year || '-' || lpad(v_n::text, 6, '0');
END;
$$;

-- Backfill existing profiles (deterministic: per-year ordering by created_at).
WITH numbered AS (
  SELECT id,
         to_char(created_at, 'YYYY') AS y,
         row_number() OVER (
           PARTITION BY to_char(created_at, 'YYYY')
           ORDER BY created_at, id
         ) AS n
  FROM public.profiles
  WHERE public_id IS NULL
)
UPDATE public.profiles p
   SET public_id = 'PP-' || numbered.y || '-' || lpad(numbered.n::text, 6, '0')
  FROM numbered
 WHERE p.id = numbered.id;

-- Sync per-year sequences to max used so the next nextval() does not collide.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT to_char(created_at, 'YYYY') AS y, COUNT(*) AS c
      FROM public.profiles
     WHERE public_id IS NOT NULL
     GROUP BY to_char(created_at, 'YYYY')
  LOOP
    EXECUTE format('CREATE SEQUENCE IF NOT EXISTS public.%I MINVALUE 1', 'pp_id_seq_' || r.y);
    EXECUTE format('SELECT setval(%L, %s)', 'public.pp_id_seq_' || r.y, r.c);
  END LOOP;
END;
$$;

-- Lock in NOT NULL + UNIQUE.
ALTER TABLE public.profiles ALTER COLUMN public_id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_public_id_uniq ON public.profiles(public_id);

-- Trigger: new profiles get an ID automatically.
CREATE OR REPLACE FUNCTION public.assign_profile_public_id() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.public_id IS NULL THEN
    NEW.public_id := public.next_pp_id();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profile_public_id ON public.profiles;
CREATE TRIGGER trg_profile_public_id
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.assign_profile_public_id();


-- 1b. applications.public_id --------------------------------------------------

ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS public_id TEXT;

CREATE OR REPLACE FUNCTION public.next_app_id() RETURNS TEXT
LANGUAGE plpgsql AS $$
DECLARE
  v_year     TEXT := to_char(now(), 'YYYY');
  v_seq_name TEXT := 'app_id_seq_' || v_year;
  v_n        BIGINT;
BEGIN
  EXECUTE format('CREATE SEQUENCE IF NOT EXISTS public.%I MINVALUE 1', v_seq_name);
  EXECUTE format('SELECT nextval(%L)', 'public.' || v_seq_name) INTO v_n;
  RETURN 'APP-' || v_year || '-' || lpad(v_n::text, 6, '0');
END;
$$;

WITH numbered AS (
  SELECT id,
         to_char(submitted_at, 'YYYY') AS y,
         row_number() OVER (
           PARTITION BY to_char(submitted_at, 'YYYY')
           ORDER BY submitted_at, id
         ) AS n
  FROM public.applications
  WHERE public_id IS NULL
)
UPDATE public.applications a
   SET public_id = 'APP-' || numbered.y || '-' || lpad(numbered.n::text, 6, '0')
  FROM numbered
 WHERE a.id = numbered.id;

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT to_char(submitted_at, 'YYYY') AS y, COUNT(*) AS c
      FROM public.applications
     WHERE public_id IS NOT NULL
     GROUP BY to_char(submitted_at, 'YYYY')
  LOOP
    EXECUTE format('CREATE SEQUENCE IF NOT EXISTS public.%I MINVALUE 1', 'app_id_seq_' || r.y);
    EXECUTE format('SELECT setval(%L, %s)', 'public.app_id_seq_' || r.y, r.c);
  END LOOP;
END;
$$;

ALTER TABLE public.applications ALTER COLUMN public_id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS applications_public_id_uniq ON public.applications(public_id);

CREATE OR REPLACE FUNCTION public.assign_application_public_id() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.public_id IS NULL THEN
    NEW.public_id := public.next_app_id();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_application_public_id ON public.applications;
CREATE TRIGGER trg_application_public_id
  BEFORE INSERT ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.assign_application_public_id();


-- 1c. colleges.short_code -----------------------------------------------------

ALTER TABLE public.colleges ADD COLUMN IF NOT EXISTS short_code TEXT;

-- Backfill the five seeded Singapore colleges with chosen short codes.
UPDATE public.colleges SET short_code = CASE id::text
    WHEN 'a1000000-0000-0000-0000-000000000001' THEN 'DIM'
    WHEN 'a1000000-0000-0000-0000-000000000002' THEN 'MDIS'
    WHEN 'a1000000-0000-0000-0000-000000000003' THEN 'PSB'
    WHEN 'a1000000-0000-0000-0000-000000000004' THEN 'KAPS'
    WHEN 'a1000000-0000-0000-0000-000000000005' THEN 'EASB'
    ELSE NULL
  END
 WHERE short_code IS NULL;

-- Fallback: derive from name for any other college (admin can edit later).
UPDATE public.colleges
   SET short_code = UPPER(LEFT(REGEXP_REPLACE(name, '[^a-zA-Z]', '', 'g'), 4))
 WHERE short_code IS NULL;

ALTER TABLE public.colleges ALTER COLUMN short_code SET NOT NULL;
ALTER TABLE public.colleges
  DROP CONSTRAINT IF EXISTS colleges_short_code_format;
ALTER TABLE public.colleges
  ADD  CONSTRAINT colleges_short_code_format
       CHECK (short_code ~ '^[A-Z]{2,6}$');
CREATE UNIQUE INDEX IF NOT EXISTS colleges_short_code_uniq ON public.colleges(short_code);


-- ============================================================================
-- 2. INVOICE / RECEIPT / REFERENCE GENERATION HELPERS
-- ============================================================================

-- next_invoice_number(college_id) -> 'DIM-INV-YYYY-0001'
CREATE OR REPLACE FUNCTION public.next_invoice_number(p_college_id UUID) RETURNS TEXT
LANGUAGE plpgsql AS $$
DECLARE
  v_year       TEXT := to_char(now(), 'YYYY');
  v_short_code TEXT;
  v_seq_name   TEXT;
  v_n          BIGINT;
BEGIN
  SELECT short_code INTO v_short_code FROM public.colleges WHERE id = p_college_id;
  IF v_short_code IS NULL THEN
    RAISE EXCEPTION 'College % has no short_code', p_college_id;
  END IF;
  v_seq_name := 'inv_seq_' || lower(v_short_code) || '_' || v_year;
  EXECUTE format('CREATE SEQUENCE IF NOT EXISTS public.%I MINVALUE 1', v_seq_name);
  EXECUTE format('SELECT nextval(%L)', 'public.' || v_seq_name) INTO v_n;
  RETURN v_short_code || '-INV-' || v_year || '-' || lpad(v_n::text, 4, '0');
END;
$$;

-- next_receipt_number(college_id) -> 'DIM-RCP-YYYY-0001'
CREATE OR REPLACE FUNCTION public.next_receipt_number(p_college_id UUID) RETURNS TEXT
LANGUAGE plpgsql AS $$
DECLARE
  v_year       TEXT := to_char(now(), 'YYYY');
  v_short_code TEXT;
  v_seq_name   TEXT;
  v_n          BIGINT;
BEGIN
  SELECT short_code INTO v_short_code FROM public.colleges WHERE id = p_college_id;
  IF v_short_code IS NULL THEN
    RAISE EXCEPTION 'College % has no short_code', p_college_id;
  END IF;
  v_seq_name := 'rcp_seq_' || lower(v_short_code) || '_' || v_year;
  EXECUTE format('CREATE SEQUENCE IF NOT EXISTS public.%I MINVALUE 1', v_seq_name);
  EXECUTE format('SELECT nextval(%L)', 'public.' || v_seq_name) INTO v_n;
  RETURN v_short_code || '-RCP-' || v_year || '-' || lpad(v_n::text, 4, '0');
END;
$$;

-- next_payment_reference(invoice_id) -> '{INVOICE_NUMBER}-NN-X'
--
-- NN is the per-invoice attempt sequence (01, 02, ...). X is a 1-char
-- alphabetic checksum (mod 26 of char-code sum) so a single mistyped
-- character in the bank reference field can be flagged before the transfer
-- is sent.
--
-- Concurrency: advisory transaction lock per invoice prevents two parallel
-- attempts from receiving the same NN.
CREATE OR REPLACE FUNCTION public.next_payment_reference(p_invoice_id UUID) RETURNS TEXT
LANGUAGE plpgsql AS $$
DECLARE
  v_invoice_number TEXT;
  v_attempt_no     INT;
  v_seq            TEXT;
  v_check_input    TEXT;
  v_sum            INT := 0;
  v_i              INT;
  v_check_char     TEXT;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('payment_attempts:' || p_invoice_id::text, 0));

  SELECT public_id INTO v_invoice_number
    FROM public.student_invoices
   WHERE id = p_invoice_id;

  IF v_invoice_number IS NULL THEN
    RAISE EXCEPTION 'Invoice % not found', p_invoice_id;
  END IF;

  SELECT COUNT(*) + 1 INTO v_attempt_no
    FROM public.payment_attempts
   WHERE invoice_id = p_invoice_id;

  v_seq         := lpad(v_attempt_no::text, 2, '0');
  v_check_input := v_invoice_number || '-' || v_seq;

  FOR v_i IN 1..length(v_check_input) LOOP
    v_sum := v_sum + ascii(substring(v_check_input from v_i for 1));
  END LOOP;
  v_check_char := chr(ascii('A') + (v_sum % 26));

  RETURN v_check_input || '-' || v_check_char;
END;
$$;


-- ============================================================================
-- 3. NEW TABLES
-- ============================================================================

-- 3a. college_payment_settings ------------------------------------------------

CREATE TABLE IF NOT EXISTS public.college_payment_settings (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id                    UUID NOT NULL UNIQUE REFERENCES public.colleges(id) ON DELETE CASCADE,

  bank_transfer_enabled         BOOLEAN NOT NULL DEFAULT false,
  bank_name                     TEXT,
  bank_account_name             TEXT,
  bank_account_number           TEXT,
  bank_swift_code               TEXT,
  bank_branch_code              TEXT,
  bank_country                  TEXT,
  bank_currency                 TEXT,
  bank_payment_instructions     TEXT,

  wise_enabled                  BOOLEAN NOT NULL DEFAULT false,
  wise_recipient_name           TEXT,
  wise_recipient_email          TEXT,
  wise_currency                 TEXT,
  wise_instructions             TEXT,

  finance_contact_name          TEXT,
  finance_email                 TEXT,
  finance_phone                 TEXT,
  finance_whatsapp              TEXT,
  finance_notes                 TEXT,

  -- Phase 2 schema slots (no UI in Sprint 17).
  stripe_enabled                BOOLEAN NOT NULL DEFAULT false,
  stripe_connected_account_id   TEXT,
  stripe_charges_enabled        BOOLEAN NOT NULL DEFAULT false,
  stripe_payouts_enabled        BOOLEAN NOT NULL DEFAULT false,
  accounting_webhook_url        TEXT,

  updated_by                    UUID REFERENCES auth.users(id),
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cps_college_idx ON public.college_payment_settings(college_id);

DROP TRIGGER IF EXISTS trg_cps_touch ON public.college_payment_settings;
CREATE TRIGGER trg_cps_touch
  BEFORE UPDATE ON public.college_payment_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.college_payment_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cps: institution manage own"  ON public.college_payment_settings;
DROP POLICY IF EXISTS "cps: admin all"               ON public.college_payment_settings;
DROP POLICY IF EXISTS "cps: student read scoped"     ON public.college_payment_settings;

-- Institution can read+write settings for their own college.
CREATE POLICY "cps: institution manage own" ON public.college_payment_settings
  FOR ALL TO authenticated
  USING      (public.user_owns_college(college_id))
  WITH CHECK (public.user_owns_college(college_id));

-- Admin sees everything.
CREATE POLICY "cps: admin all" ON public.college_payment_settings
  FOR ALL TO authenticated
  USING      (public.requesting_user_is_admin())
  WITH CHECK (public.requesting_user_is_admin());

-- Students cannot SELECT this table directly. Pay-page renders bank/Wise
-- instructions server-side after verifying an invoice exists for the student.


-- 3b. course_fee_schedules ----------------------------------------------------

CREATE TABLE IF NOT EXISTS public.course_fee_schedules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id       UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  is_default      BOOLEAN NOT NULL DEFAULT false,
  line_items      JSONB NOT NULL DEFAULT '[]'::jsonb,
  due_offset_days INT  NOT NULL DEFAULT 14 CHECK (due_offset_days BETWEEN 0 AND 365),
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cfs_course_idx ON public.course_fee_schedules(course_id);

-- Only one default schedule per course.
CREATE UNIQUE INDEX IF NOT EXISTS cfs_one_default_per_course
  ON public.course_fee_schedules(course_id) WHERE is_default;

DROP TRIGGER IF EXISTS trg_cfs_touch ON public.course_fee_schedules;
CREATE TRIGGER trg_cfs_touch
  BEFORE UPDATE ON public.course_fee_schedules
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.course_fee_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cfs: institution manage own" ON public.course_fee_schedules;
DROP POLICY IF EXISTS "cfs: admin all"              ON public.course_fee_schedules;

CREATE POLICY "cfs: institution manage own" ON public.course_fee_schedules
  FOR ALL TO authenticated
  USING      (public.user_owns_course_college(course_id))
  WITH CHECK (public.user_owns_course_college(course_id));

CREATE POLICY "cfs: admin all" ON public.course_fee_schedules
  FOR ALL TO authenticated
  USING      (public.requesting_user_is_admin())
  WITH CHECK (public.requesting_user_is_admin());


-- 3c. student_invoices --------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.student_invoices (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id                TEXT UNIQUE,                                -- assigned via trigger on issue
  application_id           UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  student_id               UUID NOT NULL REFERENCES auth.users(id)    ON DELETE CASCADE,
  college_id               UUID NOT NULL REFERENCES public.colleges(id),
  course_id                UUID NOT NULL REFERENCES public.courses(id),

  source                   TEXT NOT NULL CHECK (source IN ('generated','uploaded')),
  status                   TEXT NOT NULL DEFAULT 'draft'
                             CHECK (status IN ('draft','pending','under_verification',
                                               'paid','payment_action_required','void','refunded')),
  amount_cents             BIGINT NOT NULL DEFAULT 0 CHECK (amount_cents >= 0),
  currency                 TEXT   NOT NULL DEFAULT 'SGD'
                             CHECK (currency IN ('SGD','USD','INR','GBP','EUR','AUD')),
  due_date                 DATE,
  description              TEXT,
  file_path                TEXT,                                       -- bucket: invoices
  external_invoice_number  TEXT,                                       -- uploaded source — college's own ref
  payment_methods_allowed  TEXT[] NOT NULL DEFAULT ARRAY['bank_transfer','wise']::TEXT[]
                             CHECK (payment_methods_allowed <@ ARRAY['bank_transfer','wise']::TEXT[]),

  issued_at                TIMESTAMPTZ,
  paid_at                  TIMESTAMPTZ,
  voided_at                TIMESTAMPTZ,
  voided_by                UUID REFERENCES auth.users(id),
  void_reason              TEXT,

  -- Schema slots for Phase 2 (no UI in Sprint 17).
  supersedes_invoice_id    UUID REFERENCES public.student_invoices(id),
  payment_plan_id          UUID,

  created_by               UUID NOT NULL REFERENCES auth.users(id),
  metadata                 JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS invoices_application_idx ON public.student_invoices(application_id);
CREATE INDEX IF NOT EXISTS invoices_student_idx     ON public.student_invoices(student_id);
CREATE INDEX IF NOT EXISTS invoices_college_status_idx
  ON public.student_invoices(college_id, status);
CREATE INDEX IF NOT EXISTS invoices_hot_idx
  ON public.student_invoices(status, due_date)
  WHERE status IN ('pending','under_verification');
CREATE INDEX IF NOT EXISTS invoices_supersedes_idx
  ON public.student_invoices(supersedes_invoice_id)
  WHERE supersedes_invoice_id IS NOT NULL;

DROP TRIGGER IF EXISTS trg_invoices_touch ON public.student_invoices;
CREATE TRIGGER trg_invoices_touch
  BEFORE UPDATE ON public.student_invoices
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Guard: once an invoice leaves draft, financial fields and source are immutable.
-- Corrections require void + re-issue (new row with supersedes_invoice_id).
CREATE OR REPLACE FUNCTION public.guard_invoice_mutation() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status <> 'draft' AND (
       NEW.amount_cents   IS DISTINCT FROM OLD.amount_cents
    OR NEW.currency       IS DISTINCT FROM OLD.currency
    OR NEW.source         IS DISTINCT FROM OLD.source
    OR NEW.application_id IS DISTINCT FROM OLD.application_id
    OR NEW.student_id     IS DISTINCT FROM OLD.student_id
    OR NEW.college_id     IS DISTINCT FROM OLD.college_id
    OR NEW.course_id      IS DISTINCT FROM OLD.course_id
  ) THEN
    RAISE EXCEPTION 'Invoice in status % is immutable for financial fields', OLD.status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_invoice_mutation ON public.student_invoices;
CREATE TRIGGER trg_guard_invoice_mutation
  BEFORE UPDATE ON public.student_invoices
  FOR EACH ROW EXECUTE FUNCTION public.guard_invoice_mutation();

ALTER TABLE public.student_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invoices: student read own"        ON public.student_invoices;
DROP POLICY IF EXISTS "invoices: institution manage own"  ON public.student_invoices;
DROP POLICY IF EXISTS "invoices: admin all"               ON public.student_invoices;

-- Students see non-draft invoices addressed to them.
CREATE POLICY "invoices: student read own" ON public.student_invoices
  FOR SELECT TO authenticated
  USING (student_id = auth.uid() AND status <> 'draft');

-- Institution: full lifecycle on invoices for their college.
CREATE POLICY "invoices: institution manage own" ON public.student_invoices
  FOR ALL TO authenticated
  USING      (public.user_owns_college(college_id))
  WITH CHECK (public.user_owns_college(college_id));

CREATE POLICY "invoices: admin all" ON public.student_invoices
  FOR ALL TO authenticated
  USING      (public.requesting_user_is_admin())
  WITH CHECK (public.requesting_user_is_admin());


-- 3d. invoice_line_items ------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.invoice_line_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id   UUID NOT NULL REFERENCES public.student_invoices(id) ON DELETE CASCADE,
  line_type    TEXT NOT NULL CHECK (line_type IN (
                  'tuition','application_fee','enrollment_fee','other',
                  'scholarship','discount','late_fee','tax'
                )),
  description  TEXT NOT NULL CHECK (char_length(description) BETWEEN 1 AND 500),
  amount_cents BIGINT NOT NULL,                                      -- negative allowed (scholarship / discount)
  currency     TEXT   NOT NULL CHECK (currency IN ('SGD','USD','INR','GBP','EUR','AUD')),
  sort_order   INT NOT NULL DEFAULT 0,
  metadata     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ili_invoice_idx ON public.invoice_line_items(invoice_id, sort_order);

-- Auto-recompute parent invoice amount on any line item change.
-- The guard trigger on student_invoices blocks this update when the parent
-- has left 'draft' status — which is the intended behaviour: line items are
-- immutable post-issuance.
CREATE OR REPLACE FUNCTION public.recompute_invoice_amount() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
  v_invoice_id UUID;
  v_total      BIGINT;
BEGIN
  v_invoice_id := COALESCE(NEW.invoice_id, OLD.invoice_id);

  SELECT COALESCE(SUM(amount_cents), 0)
    INTO v_total
    FROM public.invoice_line_items
   WHERE invoice_id = v_invoice_id;

  -- Clamp at zero — invoice totals cannot go negative (scholarship > fee).
  IF v_total < 0 THEN v_total := 0; END IF;

  UPDATE public.student_invoices
     SET amount_cents = v_total,
         updated_at   = now()
   WHERE id = v_invoice_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_recompute_invoice_amount ON public.invoice_line_items;
CREATE TRIGGER trg_recompute_invoice_amount
  AFTER INSERT OR UPDATE OR DELETE ON public.invoice_line_items
  FOR EACH ROW EXECUTE FUNCTION public.recompute_invoice_amount();

ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ili: student read via invoice"   ON public.invoice_line_items;
DROP POLICY IF EXISTS "ili: institution manage scoped" ON public.invoice_line_items;
DROP POLICY IF EXISTS "ili: admin all"                  ON public.invoice_line_items;

CREATE POLICY "ili: student read via invoice" ON public.invoice_line_items
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.student_invoices si
     WHERE si.id = invoice_id
       AND si.student_id = auth.uid()
       AND si.status <> 'draft'
  ));

CREATE POLICY "ili: institution manage scoped" ON public.invoice_line_items
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.student_invoices si
     WHERE si.id = invoice_id AND public.user_owns_college(si.college_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.student_invoices si
     WHERE si.id = invoice_id AND public.user_owns_college(si.college_id)
  ));

CREATE POLICY "ili: admin all" ON public.invoice_line_items
  FOR ALL TO authenticated
  USING      (public.requesting_user_is_admin())
  WITH CHECK (public.requesting_user_is_admin());


-- 3e. payment_attempts --------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.payment_attempts (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id                  UUID NOT NULL REFERENCES public.student_invoices(id) ON DELETE CASCADE,
  application_id              UUID NOT NULL REFERENCES public.applications(id),     -- denormalised
  student_id                  UUID NOT NULL REFERENCES auth.users(id),
  college_id                  UUID NOT NULL REFERENCES public.colleges(id),

  payment_method              TEXT NOT NULL CHECK (payment_method IN ('bank_transfer','wise')),
  provider                    TEXT NOT NULL DEFAULT 'manual'
                                CHECK (provider IN ('manual','stripe')),
  status                      TEXT NOT NULL DEFAULT 'initiated'
                                CHECK (status IN ('initiated','proof_submitted','verified',
                                                  'rejected','info_requested','expired')),
  payment_reference           TEXT NOT NULL UNIQUE,                                  -- DIM-INV-2026-0001-01-K

  invoice_amount_cents        BIGINT,
  invoice_currency            TEXT,
  paid_amount_cents           BIGINT,
  paid_currency               TEXT,
  received_amount_cents       BIGINT,
  received_currency           TEXT,
  fx_rate                     NUMERIC(18,8),
  payment_date                DATE,

  verified_by                 UUID REFERENCES auth.users(id),
  verified_at                 TIMESTAMPTZ,
  rejection_reason            TEXT,
  info_request_message        TEXT,
  reconciliation_memo         TEXT,
  assigned_to                 UUID REFERENCES auth.users(id),

  -- Phase 2 schema slots.
  stripe_checkout_session_id  TEXT,
  stripe_payment_intent_id    TEXT,

  metadata                    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pa_invoice_idx       ON public.payment_attempts(invoice_id);
CREATE INDEX IF NOT EXISTS pa_application_idx   ON public.payment_attempts(application_id);
CREATE INDEX IF NOT EXISTS pa_student_idx       ON public.payment_attempts(student_id);
CREATE INDEX IF NOT EXISTS pa_college_status_idx ON public.payment_attempts(college_id, status);
CREATE INDEX IF NOT EXISTS pa_reference_idx     ON public.payment_attempts(payment_reference);
CREATE INDEX IF NOT EXISTS pa_assigned_idx
  ON public.payment_attempts(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS pa_queue_idx
  ON public.payment_attempts(college_id, created_at)
  WHERE status = 'proof_submitted';

DROP TRIGGER IF EXISTS trg_pa_touch ON public.payment_attempts;
CREATE TRIGGER trg_pa_touch
  BEFORE UPDATE ON public.payment_attempts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pa: student read own"          ON public.payment_attempts;
DROP POLICY IF EXISTS "pa: student insert own"        ON public.payment_attempts;
DROP POLICY IF EXISTS "pa: institution manage own"    ON public.payment_attempts;
DROP POLICY IF EXISTS "pa: admin all"                 ON public.payment_attempts;

CREATE POLICY "pa: student read own" ON public.payment_attempts
  FOR SELECT TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "pa: student insert own" ON public.payment_attempts
  FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "pa: institution manage own" ON public.payment_attempts
  FOR ALL TO authenticated
  USING      (public.user_owns_college(college_id))
  WITH CHECK (public.user_owns_college(college_id));

CREATE POLICY "pa: admin all" ON public.payment_attempts
  FOR ALL TO authenticated
  USING      (public.requesting_user_is_admin())
  WITH CHECK (public.requesting_user_is_admin());


-- 3f. payment_proofs ----------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.payment_proofs (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_attempt_id   UUID NOT NULL REFERENCES public.payment_attempts(id) ON DELETE CASCADE,
  invoice_id           UUID NOT NULL REFERENCES public.student_invoices(id) ON DELETE CASCADE,
  uploaded_by          UUID NOT NULL REFERENCES auth.users(id),
  file_path            TEXT NOT NULL,                                   -- bucket: payment-proofs
  file_name            TEXT NOT NULL,
  file_mime            TEXT NOT NULL
                          CHECK (file_mime IN ('application/pdf','image/png','image/jpeg')),
  file_size_bytes      BIGINT NOT NULL CHECK (file_size_bytes BETWEEN 1 AND 10485760),
  file_hash            TEXT,                                            -- SHA-256 hex for duplicate detection
  receipt_reference    TEXT,
  receipt_amount_cents BIGINT,
  receipt_currency     TEXT,
  payment_date         DATE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pp_attempt_idx ON public.payment_proofs(payment_attempt_id);
CREATE INDEX IF NOT EXISTS pp_invoice_idx ON public.payment_proofs(invoice_id);
CREATE INDEX IF NOT EXISTS pp_hash_idx    ON public.payment_proofs(file_hash) WHERE file_hash IS NOT NULL;

ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pp: student manage own"       ON public.payment_proofs;
DROP POLICY IF EXISTS "pp: institution read scoped"  ON public.payment_proofs;
DROP POLICY IF EXISTS "pp: admin all"                ON public.payment_proofs;

CREATE POLICY "pp: student manage own" ON public.payment_proofs
  FOR ALL TO authenticated
  USING (uploaded_by = auth.uid())
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "pp: institution read scoped" ON public.payment_proofs
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.payment_attempts pa
     WHERE pa.id = payment_attempt_id
       AND public.user_owns_college(pa.college_id)
  ));

CREATE POLICY "pp: admin all" ON public.payment_proofs
  FOR ALL TO authenticated
  USING      (public.requesting_user_is_admin())
  WITH CHECK (public.requesting_user_is_admin());


-- 3g. official_receipts -------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.official_receipts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id           TEXT UNIQUE,                                      -- DIM-RCP-2026-0001
  invoice_id          UUID NOT NULL REFERENCES public.student_invoices(id) ON DELETE CASCADE,
  payment_attempt_id  UUID NOT NULL REFERENCES public.payment_attempts(id) ON DELETE CASCADE,
  source              TEXT NOT NULL CHECK (source IN ('generated','uploaded')),
  file_path           TEXT NOT NULL,                                    -- bucket: official-receipts
  amount_cents        BIGINT NOT NULL CHECK (amount_cents > 0),
  currency            TEXT NOT NULL CHECK (currency IN ('SGD','USD','INR','GBP','EUR','AUD')),
  issued_by           UUID REFERENCES auth.users(id),
  issued_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes               TEXT,
  metadata            JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS or_invoice_idx ON public.official_receipts(invoice_id);
CREATE INDEX IF NOT EXISTS or_attempt_idx ON public.official_receipts(payment_attempt_id);

ALTER TABLE public.official_receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "or: student read own"          ON public.official_receipts;
DROP POLICY IF EXISTS "or: institution manage scoped" ON public.official_receipts;
DROP POLICY IF EXISTS "or: admin all"                 ON public.official_receipts;

CREATE POLICY "or: student read own" ON public.official_receipts
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.student_invoices si
     WHERE si.id = invoice_id AND si.student_id = auth.uid()
  ));

CREATE POLICY "or: institution manage scoped" ON public.official_receipts
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.student_invoices si
     WHERE si.id = invoice_id AND public.user_owns_college(si.college_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.student_invoices si
     WHERE si.id = invoice_id AND public.user_owns_college(si.college_id)
  ));

CREATE POLICY "or: admin all" ON public.official_receipts
  FOR ALL TO authenticated
  USING      (public.requesting_user_is_admin())
  WITH CHECK (public.requesting_user_is_admin());


-- ============================================================================
-- 4. STORAGE BUCKETS (private, 10 MB cap, MIME-restricted)
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('invoices',          'invoices',          false, 10485760, ARRAY['application/pdf']),
  ('payment-proofs',    'payment-proofs',    false, 10485760, ARRAY['application/pdf','image/png','image/jpeg']),
  ('official-receipts', 'official-receipts', false, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies. Pattern follows existing offer-letters / student-documents.
-- Students upload payment-proofs into their own folder; institutional access
-- is API-mediated via signed URLs minted server-side (admin client).

DROP POLICY IF EXISTS "invoices: institution upload"    ON storage.objects;
DROP POLICY IF EXISTS "invoices: institution read"      ON storage.objects;
DROP POLICY IF EXISTS "invoices: admin all"             ON storage.objects;
DROP POLICY IF EXISTS "proofs: student upload own"      ON storage.objects;
DROP POLICY IF EXISTS "proofs: student read own"        ON storage.objects;
DROP POLICY IF EXISTS "proofs: admin all"               ON storage.objects;
DROP POLICY IF EXISTS "receipts: institution upload"    ON storage.objects;
DROP POLICY IF EXISTS "receipts: institution read"      ON storage.objects;
DROP POLICY IF EXISTS "receipts: admin all"             ON storage.objects;

CREATE POLICY "invoices: institution upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'invoices' AND
    EXISTS (
      SELECT 1 FROM public.profiles
       WHERE id = auth.uid() AND role IN ('institution','admin')
    )
  );

CREATE POLICY "invoices: institution read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'invoices' AND
    EXISTS (
      SELECT 1 FROM public.profiles
       WHERE id = auth.uid() AND role IN ('institution','admin')
    )
  );

CREATE POLICY "invoices: admin all" ON storage.objects
  FOR ALL TO authenticated
  USING      (bucket_id = 'invoices' AND public.requesting_user_is_admin())
  WITH CHECK (bucket_id = 'invoices' AND public.requesting_user_is_admin());

-- payment-proofs: student writes to their own folder (path = "{student_id}/...").
CREATE POLICY "proofs: student upload own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'payment-proofs' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "proofs: student read own" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'payment-proofs' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "proofs: admin all" ON storage.objects
  FOR ALL TO authenticated
  USING      (bucket_id = 'payment-proofs' AND public.requesting_user_is_admin())
  WITH CHECK (bucket_id = 'payment-proofs' AND public.requesting_user_is_admin());

CREATE POLICY "receipts: institution upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'official-receipts' AND
    EXISTS (
      SELECT 1 FROM public.profiles
       WHERE id = auth.uid() AND role IN ('institution','admin')
    )
  );

CREATE POLICY "receipts: institution read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'official-receipts' AND
    EXISTS (
      SELECT 1 FROM public.profiles
       WHERE id = auth.uid() AND role IN ('institution','admin')
    )
  );

CREATE POLICY "receipts: admin all" ON storage.objects
  FOR ALL TO authenticated
  USING      (bucket_id = 'official-receipts' AND public.requesting_user_is_admin())
  WITH CHECK (bucket_id = 'official-receipts' AND public.requesting_user_is_admin());


-- ============================================================================
-- 5. POST-MIGRATION VERIFICATION QUERIES (commented — run manually)
-- ============================================================================
--
-- -- Public ID backfill complete?
-- SELECT COUNT(*) FROM public.profiles     WHERE public_id IS NULL;   -- expect 0
-- SELECT COUNT(*) FROM public.applications WHERE public_id IS NULL;   -- expect 0
-- SELECT COUNT(*) FROM public.colleges     WHERE short_code IS NULL;  -- expect 0
--
-- -- Format sanity
-- SELECT public_id   FROM public.profiles     ORDER BY created_at  DESC LIMIT 3;
-- SELECT public_id   FROM public.applications ORDER BY submitted_at DESC LIMIT 3;
-- SELECT name, short_code FROM public.colleges;
--
-- -- Tables present
-- SELECT table_name FROM information_schema.tables
--  WHERE table_schema = 'public'
--    AND table_name IN ('college_payment_settings','course_fee_schedules',
--                       'student_invoices','invoice_line_items',
--                       'payment_attempts','payment_proofs','official_receipts');
--
-- -- Buckets present
-- SELECT id, public, file_size_limit FROM storage.buckets
--  WHERE id IN ('invoices','payment-proofs','official-receipts');
--
-- -- Helper functions callable
-- SELECT public.next_pp_id();
-- SELECT public.next_app_id();
-- SELECT public.next_invoice_number(id) FROM public.colleges LIMIT 1;
-- SELECT public.next_receipt_number(id) FROM public.colleges LIMIT 1;
