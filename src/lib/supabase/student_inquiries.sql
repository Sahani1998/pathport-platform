-- ═══════════════════════════════════════════════════════════════════════════
-- PathPort — Student Inquiries Table
-- Paste this entire block into Supabase Dashboard → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Table ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.student_inquiries (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name       TEXT        NOT NULL,
  email           TEXT        NOT NULL,
  whatsapp_number TEXT,
  country         TEXT        DEFAULT 'India',
  indian_state    TEXT,
  city            TEXT,
  course_interest TEXT,
  intended_intake TEXT,
  budget_range    TEXT,
  status          TEXT        NOT NULL DEFAULT 'new'
                              CHECK (status IN ('new', 'contacted', 'converted', 'not_interested')),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS student_inquiries_email_idx
  ON public.student_inquiries (email);

CREATE INDEX IF NOT EXISTS student_inquiries_status_idx
  ON public.student_inquiries (status);

CREATE INDEX IF NOT EXISTS student_inquiries_created_at_idx
  ON public.student_inquiries (created_at DESC);

CREATE INDEX IF NOT EXISTS student_inquiries_country_idx
  ON public.student_inquiries (country);

-- ── 3. Row Level Security ─────────────────────────────────────────────────────
ALTER TABLE public.student_inquiries ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anonymous public visitors) to INSERT
CREATE POLICY "student_inquiries: public insert"
  ON public.student_inquiries FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can SELECT (read inquiries)
CREATE POLICY "student_inquiries: admin select"
  ON public.student_inquiries FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Only admins can UPDATE (change status, add notes)
CREATE POLICY "student_inquiries: admin update"
  ON public.student_inquiries FOR UPDATE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );
