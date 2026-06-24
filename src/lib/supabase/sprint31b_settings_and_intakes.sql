-- Sprint 31b: Global Contact Settings + Admin-managed Intake Options
-- Tables: site_settings (new)
-- Also seeds: public_page_sections section_key='intake_options'
-- Also (idempotent) extends: public_destinations with description/cta columns
-- Idempotent — safe to run multiple times.
-- Apply in: Supabase Dashboard → SQL Editor
-- Depends on: sprint31_public_content.sql (public_page_sections, public_destinations)

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. site_settings
--    Global key/value store for sitewide contact details and social links.
--    is_public = true  → readable by anyone (anon) for public pages.
--    is_public = false → readable only by admins (reserved for future use).
--    Public pages read these instead of hardcoding the WhatsApp number / email.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_settings (
  key         TEXT        PRIMARY KEY,
  value       TEXT        NOT NULL DEFAULT '',
  label       TEXT        NOT NULL DEFAULT '',
  group_name  TEXT        NOT NULL DEFAULT 'general',
  is_public   BOOLEAN     NOT NULL DEFAULT true,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS site_settings_group_idx  ON site_settings (group_name);
CREATE INDEX IF NOT EXISTS site_settings_public_idx ON site_settings (is_public);

CREATE OR REPLACE FUNCTION set_site_settings_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS site_settings_updated_at ON site_settings;
CREATE TRIGGER site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION set_site_settings_updated_at();

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_site_settings" ON site_settings;
DROP POLICY IF EXISTS "admin_manage_site_settings" ON site_settings;

-- Anon/public users can read only public settings (contact details, socials).
CREATE POLICY "public_read_site_settings"
  ON site_settings FOR SELECT
  USING (is_public = true);

-- Admins can read and write everything.
CREATE POLICY "admin_manage_site_settings"
  ON site_settings FOR ALL
  USING  (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- site_settings seed — mirrors the values previously hardcoded across the site.
INSERT INTO site_settings (key, value, label, group_name, is_public) VALUES
  ('whatsapp_number',  '6583776492',          'WhatsApp number (digits only, for wa.me links)', 'contact', true),
  ('whatsapp_display', '+65 8377 6492',       'WhatsApp number (display format)',                'contact', true),
  ('contact_email',    'pathportsg@gmail.com','Primary contact email',                           'contact', true),
  ('support_email',    'pathportsg@gmail.com','Support email',                                   'contact', true),
  ('admissions_email', 'pathportsg@gmail.com','Admissions / institutions email',                 'contact', true),
  ('social_instagram', '',                    'Instagram URL',                                   'social',  true),
  ('social_facebook',  '',                    'Facebook URL',                                    'social',  true),
  ('social_linkedin',  '',                    'LinkedIn URL',                                    'social',  true)
ON CONFLICT (key) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Intake options → public_page_sections (section_key='intake_options')
--    Replaces the hardcoded INTAKE_OPTIONS array. Admin can add/retire intakes
--    with no deploy. data shape: {"label": "October 2026"}.
--    NOTE: July 2026 intentionally omitted — within the 6–12 week pipeline it is
--    effectively unreachable as of the seed date and should not be offered.
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public_page_sections (section_key, item_key, data, display_order, status) VALUES
  ('intake_options', 'oct-2026',  '{"label":"October 2026"}',               0, 'published'),
  ('intake_options', 'jan-2027',  '{"label":"January 2027"}',               1, 'published'),
  ('intake_options', 'apr-2027',  '{"label":"April 2027"}',                 2, 'published'),
  ('intake_options', 'jul-2027',  '{"label":"July 2027"}',                  3, 'published'),
  ('intake_options', 'flexible',  '{"label":"Flexible / Not decided yet"}', 4, 'published')
ON CONFLICT (section_key, item_key) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. public_destinations — optional descriptive fields (idempotent ALTERs)
--    Adds richer admin-editable copy for the destination system (Phase 3).
--    All nullable, so existing rows and the current render path are unaffected.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public_destinations ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public_destinations ADD COLUMN IF NOT EXISTS cta_label   TEXT;
ALTER TABLE public_destinations ADD COLUMN IF NOT EXISTS cta_href    TEXT;
