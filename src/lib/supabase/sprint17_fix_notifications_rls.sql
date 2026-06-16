-- Sprint 17 — Fix notifications RLS: ensure update policy exists with explicit WITH CHECK.
-- Safe to re-run (DROP IF EXISTS + CREATE).
--
-- Root cause: "notif: student update own" may be absent in production if
-- application_timeline_schema.sql was never re-run, causing every browser-side
-- UPDATE (mark as read) to be silently denied by default-deny RLS.
-- Adding explicit WITH CHECK mirrors the USING clause and future-proofs against
-- PostgREST behavior differences across Supabase versions.

DROP POLICY IF EXISTS "notif: student update own" ON public.notifications;

CREATE POLICY "notif: student update own"
  ON public.notifications FOR UPDATE
  USING    (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
