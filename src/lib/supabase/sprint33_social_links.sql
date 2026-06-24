-- ─────────────────────────────────────────────────────────────────────────────
-- Sprint 33 — Extend site_settings with additional social link keys
--
-- Adds YouTube, X (formerly Twitter), and TikTok to the editable social
-- settings. Existing rows are NEVER overwritten (ON CONFLICT DO NOTHING)
-- so any values an admin has already entered are preserved.
--
-- Safe to re-run. No destructive changes.
-- Apply in: Supabase Dashboard → SQL Editor
-- Depends on: sprint31b_settings_and_intakes.sql (site_settings table)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO site_settings (key, value, label, group_name, is_public) VALUES
  ('social_youtube',  '', 'YouTube URL',                'social', true),
  ('social_x',        '', 'X (formerly Twitter) URL',   'social', true),
  ('social_tiktok',   '', 'TikTok URL',                 'social', true)
ON CONFLICT (key) DO NOTHING;
