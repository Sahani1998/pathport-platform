-- ============================================================================
-- Sprint E2.5 — Employer Portal Production Completion
-- Enterprise company profile fields. Idempotent — safe to re-run.
-- Run AFTER sprint_e2_employer_completion.sql.
-- ============================================================================

ALTER TABLE public.employer_companies
  ADD COLUMN IF NOT EXISTS registration_number TEXT,
  ADD COLUMN IF NOT EXISTS uen                 TEXT,   -- Singapore Unique Entity Number
  ADD COLUMN IF NOT EXISTS contact_email       TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone       TEXT,
  ADD COLUMN IF NOT EXISTS company_culture     TEXT,
  ADD COLUMN IF NOT EXISTS benefits            TEXT[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS social_facebook     TEXT,
  ADD COLUMN IF NOT EXISTS social_instagram    TEXT,
  ADD COLUMN IF NOT EXISTS social_x            TEXT,
  ADD COLUMN IF NOT EXISTS hiring_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS banner_url          TEXT;   -- denormalised cover banner for quick reads

-- ── Verification ──────────────────────────────────────────────────────────────
-- SELECT column_name FROM information_schema.columns
--   WHERE table_schema='public' AND table_name='employer_companies'
--   ORDER BY ordinal_position;
