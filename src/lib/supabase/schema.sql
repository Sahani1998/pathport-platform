-- ═══════════════════════════════════════════════════════════════════════════
-- PathPort — Supabase Database Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Role enum ─────────────────────────────────────────────────────────────
CREATE TYPE public.user_role AS ENUM (
  'student',
  'admin',
  'institution',
  'recruitment_partner',
  'employer'
);

-- ── 2. Profiles table ────────────────────────────────────────────────────────
CREATE TABLE public.profiles (
  id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT        NOT NULL,
  full_name    TEXT,
  role         public.user_role NOT NULL DEFAULT 'student',
  phone        TEXT,
  country      TEXT        DEFAULT 'India',
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. Row Level Security ─────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "profiles: own read"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles: own update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can read ALL profiles
CREATE POLICY "profiles: admin read all"
  ON public.profiles FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Admins can update ALL profiles
CREATE POLICY "profiles: admin update all"
  ON public.profiles FOR UPDATE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- ── 4. Auto-create profile on signup ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::public.user_role,
      'student'
    )
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ── 5. Auto-update updated_at ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ── 6. Realtime (optional — enable if using live updates) ────────────────────
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- ═══════════════════════════════════════════════════════════════════════════
-- PathPort — Partner Applications Table
-- Run this separately after the main schema to enable the Partner With Us form.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE public.partner_applications (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_name     TEXT        NOT NULL,
  contact_name TEXT        NOT NULL,
  email        TEXT        NOT NULL,
  phone        TEXT        NOT NULL,
  partner_type TEXT        NOT NULL CHECK (partner_type IN ('institution', 'recruitment_partner', 'employer')),
  country      TEXT        NOT NULL,
  website      TEXT,
  message      TEXT,
  status       TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including unauthenticated visitors) to INSERT
CREATE POLICY "partner_applications: public insert"
  ON public.partner_applications FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can SELECT / UPDATE
CREATE POLICY "partner_applications: admin read"
  ON public.partner_applications FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "partner_applications: admin update"
  ON public.partner_applications FOR UPDATE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );
