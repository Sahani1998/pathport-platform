-- ═══════════════════════════════════════════════════════════════════════════════
-- PathPort — Application Timeline & Notifications System
-- Paste into Supabase Dashboard → SQL Editor → Run
-- Safe to re-run: IF NOT EXISTS / OR REPLACE / ON CONFLICT throughout
-- ═══════════════════════════════════════════════════════════════════════════════


-- ── 1. Extend public.applications ────────────────────────────────────────────
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS current_stage     TEXT    DEFAULT 'application_submitted',
  ADD COLUMN IF NOT EXISTS stage_updated_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_action       TEXT,
  ADD COLUMN IF NOT EXISTS internal_notes    TEXT,
  ADD COLUMN IF NOT EXISTS student_message   TEXT;

-- Back-fill: existing rows that have no stage yet
UPDATE public.applications
SET current_stage = CASE
  WHEN status = 'approved'    THEN 'approved'
  WHEN status = 'rejected'    THEN 'rejected'
  WHEN status = 'ipa_processing' THEN 'ipa_processing'
  WHEN status = 'offer_ready' THEN 'offer_letter_ready'
  WHEN status = 'docs_required' THEN 'documents_pending'
  WHEN status = 'under_review' THEN 'documents_under_review'
  ELSE 'application_submitted'
END
WHERE current_stage IS NULL OR current_stage = 'application_submitted';


-- ── 2. application_timeline_events ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.application_timeline_events (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id     UUID        NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  stage              TEXT        NOT NULL,
  title              TEXT        NOT NULL,
  description        TEXT,
  created_by         UUID                    REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_role    TEXT,       -- 'admin' | 'institution' | 'system'
  visible_to_student BOOLEAN     NOT NULL DEFAULT true,
  created_at         TIMESTAMPTZ            DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS timeline_events_app_idx     ON public.application_timeline_events (application_id);
CREATE INDEX IF NOT EXISTS timeline_events_stage_idx   ON public.application_timeline_events (stage);
CREATE INDEX IF NOT EXISTS timeline_events_created_idx ON public.application_timeline_events (created_at DESC);


-- ── 3. notifications ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id UUID                    REFERENCES public.applications(id) ON DELETE CASCADE,
  title          TEXT        NOT NULL,
  message        TEXT        NOT NULL,
  type           TEXT        NOT NULL DEFAULT 'application_update'
                             CHECK (type IN (
                               'application_update', 'document_update',
                               'payment_update', 'offer_letter', 'system'
                             )),
  read_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_user_idx    ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS notifications_app_idx     ON public.notifications (application_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx    ON public.notifications (read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS notifications_created_idx ON public.notifications (created_at DESC);


-- ── 4. RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE public.application_timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications               ENABLE ROW LEVEL SECURITY;

-- Drop old policies (safe re-run)
DROP POLICY IF EXISTS "timeline: student read visible" ON public.application_timeline_events;
DROP POLICY IF EXISTS "timeline: institution read own" ON public.application_timeline_events;
DROP POLICY IF EXISTS "timeline: institution insert"   ON public.application_timeline_events;
DROP POLICY IF EXISTS "timeline: admin all"            ON public.application_timeline_events;
DROP POLICY IF EXISTS "notif: student select own"      ON public.notifications;
DROP POLICY IF EXISTS "notif: student update own"      ON public.notifications;
DROP POLICY IF EXISTS "notif: admin all"               ON public.notifications;
DROP POLICY IF EXISTS "notif: system insert"           ON public.notifications;

-- Timeline events: students see their own visible events
CREATE POLICY "timeline: student read visible"
  ON public.application_timeline_events FOR SELECT
  USING (
    visible_to_student = true
    AND EXISTS (
      SELECT 1 FROM public.applications
      WHERE id = application_timeline_events.application_id
        AND student_id = auth.uid()
    )
  );

-- Timeline events: institutions can see events for their college's applications
CREATE POLICY "timeline: institution read own"
  ON public.application_timeline_events FOR SELECT
  USING (public.user_owns_course_college(
    (SELECT course_id FROM public.applications WHERE id = application_id)
  ));

-- Timeline events: institutions can insert for their college's applications
CREATE POLICY "timeline: institution insert"
  ON public.application_timeline_events FOR INSERT
  WITH CHECK (public.user_owns_course_college(
    (SELECT course_id FROM public.applications WHERE id = application_id)
  ));

-- Timeline events: admin full access
CREATE POLICY "timeline: admin all"
  ON public.application_timeline_events FOR ALL
  USING (public.requesting_user_is_admin());

-- Notifications: students see own
CREATE POLICY "notif: student select own"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

-- Notifications: students can update own (mark as read)
CREATE POLICY "notif: student update own"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Notifications: admin full access
CREATE POLICY "notif: admin all"
  ON public.notifications FOR ALL
  USING (public.requesting_user_is_admin());

-- Notifications: service role / server-side can insert for any user
-- (API routes use supabase service role or the requesting user has
--  institution/admin role — covered by admin policy above)
CREATE POLICY "notif: system insert"
  ON public.notifications FOR INSERT
  WITH CHECK (
    -- admin inserting
    public.requesting_user_is_admin()
    -- OR institution inserting notification for a student in their college
    OR EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.courses c ON c.id = a.course_id
      JOIN public.profiles p ON p.college_id = c.college_id
      WHERE a.id = notifications.application_id
        AND p.id = auth.uid()
        AND p.role = 'institution'
    )
  );
