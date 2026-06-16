-- Sprint 16: Hardening & Production Readiness
-- Safe to re-run (all statements are idempotent)

-- Missing FK index on profiles.college_id
-- Prevents full-table scans when joining applications → profiles → colleges
CREATE INDEX IF NOT EXISTS profiles_college_id_idx
  ON public.profiles (college_id);
