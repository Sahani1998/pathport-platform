-- Sprint 34: Email compliance — bounce/unsubscribe suppression
-- Adds do_not_contact column to profiles so bounced or complained
-- addresses are never emailed again.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS do_not_contact BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.profiles.do_not_contact IS
  'Set to true when a Resend bounce or complaint event is received. '
  'sendTemplatedEmail() checks this flag before every send.';

-- Fast lookup by email — the webhook fires per address
CREATE INDEX IF NOT EXISTS idx_profiles_do_not_contact
  ON public.profiles (email)
  WHERE do_not_contact = TRUE;

-- RLS: only admin can query/update this column
CREATE POLICY "admin_manage_do_not_contact"
  ON public.profiles
  FOR UPDATE
  USING (requesting_user_is_admin())
  WITH CHECK (requesting_user_is_admin());
