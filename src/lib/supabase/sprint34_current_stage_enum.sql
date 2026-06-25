-- Sprint 34: Migrate applications.current_stage from TEXT to a proper enum.
-- The enum values are generated from ALLOWED_TRANSITIONS in
-- src/lib/application-workflow.ts (all 18 stages + terminal variants).
--
-- Steps:
--   1. Create the enum type
--   2. Add a temporary column of the new type
--   3. Back-fill from current_stage (invalid values fall back to 'application_submitted')
--   4. Drop old TEXT column, rename temp column
--   5. Restore NOT NULL + default

DO $$
BEGIN
  -- Only create if it doesn't already exist
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_stage') THEN
    CREATE TYPE public.application_stage AS ENUM (
      'application_submitted',
      'documents_pending',
      'documents_uploaded',
      'documents_under_review',
      'documents_verified',
      'offer_letter_processing',
      'offer_letter_ready',
      'offer_letter_accepted',
      'fee_payment_pending',
      'ipa_processing',
      'approved',
      'tuition_fee_payment_pending',
      'arrival_preparation',
      'arrived_singapore',
      'enrolled',
      'internship_eligible',
      'completed',
      'rejected',
      'withdrawn'
    );
  END IF;
END $$;

-- Add temporary column
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS current_stage_enum public.application_stage;

-- Back-fill: cast valid values; leave unknowns as NULL (will default below)
UPDATE public.applications
SET current_stage_enum = CASE
  WHEN current_stage IN (
    'application_submitted','documents_pending','documents_uploaded',
    'documents_under_review','documents_verified','offer_letter_processing',
    'offer_letter_ready','offer_letter_accepted','fee_payment_pending',
    'ipa_processing','approved','tuition_fee_payment_pending',
    'arrival_preparation','arrived_singapore','enrolled',
    'internship_eligible','completed','rejected','withdrawn'
  ) THEN current_stage::public.application_stage
  ELSE 'application_submitted'::public.application_stage
END;

-- Set default + NOT NULL before dropping old column
ALTER TABLE public.applications
  ALTER COLUMN current_stage_enum SET DEFAULT 'application_submitted'::public.application_stage,
  ALTER COLUMN current_stage_enum SET NOT NULL;

-- Drop the old TEXT column and rename temp column
ALTER TABLE public.applications DROP COLUMN IF EXISTS current_stage;
ALTER TABLE public.applications RENAME COLUMN current_stage_enum TO current_stage;

-- Restore index used by stage-advance queries
CREATE INDEX IF NOT EXISTS idx_applications_current_stage
  ON public.applications (current_stage);

COMMENT ON COLUMN public.applications.current_stage IS
  'Typed enum enforcing the 18-stage admissions pipeline. '
  'Values mirror ALLOWED_TRANSITIONS in src/lib/application-workflow.ts.';
