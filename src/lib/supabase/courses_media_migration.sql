-- ═══════════════════════════════════════════════════════════════════════════════
-- PathPort — Course Media & Career Outcomes Migration
-- Run in Supabase Dashboard → SQL Editor → Run
-- Safe to re-run: all ALTER TABLE use ADD COLUMN IF NOT EXISTS
-- All columns are NULLABLE — existing courses are unaffected.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── Media & Assets (all nullable) ────────────────────────────────────────────
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS thumbnail_url  TEXT,
  ADD COLUMN IF NOT EXISTS video_url      TEXT,
  ADD COLUMN IF NOT EXISTS brochure_url   TEXT,
  ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]'::jsonb;

-- ── Career Outcomes (all nullable) ────────────────────────────────────────────
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS career_outcomes              JSONB    DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS industries                   TEXT[]   DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS internship_available         BOOLEAN  DEFAULT false,
  ADD COLUMN IF NOT EXISTS internship_duration_months   INTEGER,
  ADD COLUMN IF NOT EXISTS estimated_internship_allowance NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS pathway_description          TEXT,
  ADD COLUMN IF NOT EXISTS job_outlook_description      TEXT;

-- ── Indexes for filtering ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS courses_internship_idx ON public.courses (internship_available)
  WHERE internship_available = true;
