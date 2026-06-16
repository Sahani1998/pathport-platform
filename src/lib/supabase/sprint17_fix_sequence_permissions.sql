-- Sprint 17 — Fix: sequence-creation permissions for public ID generators
-- Root cause: next_app_id() and next_pp_id() run CREATE SEQUENCE DDL inside a
-- BEFORE INSERT trigger.  Trigger functions execute as the calling role
-- (authenticated) by default, but CREATE SEQUENCE requires the CREATE privilege
-- on schema public, which the authenticated role does not hold.  The result is:
--
--   INSERT failed (42501): permission denied for schema public
--
-- Fix: redeclare both functions as SECURITY DEFINER so the DDL runs as the
-- function owner (postgres / service role), who has full schema privileges.
-- SET search_path = public prevents search-path injection.
--
-- Safe to re-run (CREATE OR REPLACE is idempotent).

CREATE OR REPLACE FUNCTION public.next_app_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_year     TEXT   := to_char(now(), 'YYYY');
  v_seq_name TEXT   := 'app_id_seq_' || v_year;
  v_n        BIGINT;
BEGIN
  EXECUTE format('CREATE SEQUENCE IF NOT EXISTS public.%I MINVALUE 1', v_seq_name);
  EXECUTE format('SELECT nextval(%L)', 'public.' || v_seq_name) INTO v_n;
  RETURN 'APP-' || v_year || '-' || lpad(v_n::text, 6, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.next_pp_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_year     TEXT   := to_char(now(), 'YYYY');
  v_seq_name TEXT   := 'pp_id_seq_' || v_year;
  v_n        BIGINT;
BEGIN
  EXECUTE format('CREATE SEQUENCE IF NOT EXISTS public.%I MINVALUE 1', v_seq_name);
  EXECUTE format('SELECT nextval(%L)', 'public.' || v_seq_name) INTO v_n;
  RETURN 'PP-' || v_year || '-' || lpad(v_n::text, 6, '0');
END;
$$;
