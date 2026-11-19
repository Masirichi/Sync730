-- ==============================================================================
-- Migration: 20261119_phase4_public_roles_view_and_visibility.sql
-- Description: Phase 4 Role Verification & Public Visibility View
-- 1. Extends remote_jobs with canonical verification fields and status enum.
-- 2. Creates public_roles view returning ONLY public-safe columns of verified live roles.
-- 3. Revokes direct access to remote_jobs / roles for anon and authenticated.
-- 4. Grants SELECT on public_roles ONLY to anon and authenticated.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. DATA MODEL EXTENSIONS (remote_jobs)
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  -- Add status enum check if not present
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'remote_jobs' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.remote_jobs 
    ADD COLUMN status TEXT DEFAULT 'needs_review' 
    CHECK (status IN ('ingested', 'needs_review', 'verified', 'live', 'stale', 'removed'));
  END IF;

  -- Add source_url
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'remote_jobs' AND column_name = 'source_url'
  ) THEN
    ALTER TABLE public.remote_jobs ADD COLUMN source_url TEXT;
  END IF;

  -- Add apply_url
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'remote_jobs' AND column_name = 'apply_url'
  ) THEN
    ALTER TABLE public.remote_jobs ADD COLUMN apply_url TEXT;
  END IF;

  -- Add verified_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'remote_jobs' AND column_name = 'verified_at'
  ) THEN
    ALTER TABLE public.remote_jobs ADD COLUMN verified_at TIMESTAMPTZ;
  END IF;

  -- Add verified_by
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'remote_jobs' AND column_name = 'verified_by'
  ) THEN
    ALTER TABLE public.remote_jobs ADD COLUMN verified_by TEXT;
  END IF;

  -- Add checks (JSONB validation checks)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'remote_jobs' AND column_name = 'checks'
  ) THEN
    ALTER TABLE public.remote_jobs ADD COLUMN checks JSONB DEFAULT '{"live_on_employer_channel": false, "hiring_contact_confirmed": false}'::jsonb;
  END IF;

  -- Add open_to_countries
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'remote_jobs' AND column_name = 'open_to_countries'
  ) THEN
    ALTER TABLE public.remote_jobs ADD COLUMN open_to_countries TEXT[] DEFAULT '{}';
  END IF;

  -- Add rejection_reason
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'remote_jobs' AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE public.remote_jobs ADD COLUMN rejection_reason TEXT;
  END IF;

  -- Add last_checked_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'remote_jobs' AND column_name = 'last_checked_at'
  ) THEN
    ALTER TABLE public.remote_jobs ADD COLUMN last_checked_at TIMESTAMPTZ;
  END IF;

  -- Add featured
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'remote_jobs' AND column_name = 'featured'
  ) THEN
    ALTER TABLE public.remote_jobs ADD COLUMN featured BOOLEAN DEFAULT FALSE;
  END IF;

  -- Add featured_rank
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'remote_jobs' AND column_name = 'featured_rank'
  ) THEN
    ALTER TABLE public.remote_jobs ADD COLUMN featured_rank INTEGER DEFAULT 0;
  END IF;

  -- Add is_demo
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'remote_jobs' AND column_name = 'is_demo'
  ) THEN
    ALTER TABLE public.remote_jobs ADD COLUMN is_demo BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
END $$;

-- Indexes for status, staleness, and visibility filtering
CREATE INDEX IF NOT EXISTS idx_remote_jobs_status ON public.remote_jobs(status);
CREATE INDEX IF NOT EXISTS idx_remote_jobs_verified_at ON public.remote_jobs(verified_at);
CREATE INDEX IF NOT EXISTS idx_remote_jobs_featured ON public.remote_jobs(featured, featured_rank);

-- ------------------------------------------------------------------------------
-- 2. CONSTANT HELPER: ROLE STALENESS DURATION (14 DAYS)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_role_staleness_days()
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT 14;
$$;

-- ------------------------------------------------------------------------------
-- 3. POSTGRES VIEW: public_roles
-- Only returns public-safe columns of roles where:
-- status = 'live' AND is_demo = false AND verified_at > now() - interval '14 days'
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.public_roles AS
SELECT 
  id,
  external_id,
  title,
  company,
  company_name,
  company_logo,
  description,
  category,
  job_type,
  candidate_required_location,
  location_tier,
  salary,
  salary_range,
  salary_min,
  salary_max,
  salary_currency,
  salary_period,
  url,
  apply_url,
  source,
  source_type,
  tags,
  open_to_countries,
  featured,
  featured_rank,
  published_at,
  created_at,
  posted_at,
  verified_at,
  status
FROM public.remote_jobs
WHERE status = 'live'
  AND is_demo = false
  AND verified_at IS NOT NULL
  AND verified_at > (timezone('utc'::text, now()) - interval '14 days');

-- ------------------------------------------------------------------------------
-- 4. TABLE PERMISSIONS & ACCESS CONTROL
-- Revoke all direct access to remote_jobs table for anon and authenticated.
-- Anon and authenticated may SELECT from public_roles ONLY.
-- ------------------------------------------------------------------------------
REVOKE ALL ON public.remote_jobs FROM anon, authenticated, public;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.remote_jobs TO service_role;

-- Grant SELECT on public_roles ONLY to anon and authenticated
GRANT SELECT ON public.public_roles TO anon, authenticated;
GRANT ALL ON public.public_roles TO service_role;

-- Optional alias view 'roles' sealed against direct anon/authenticated access
CREATE OR REPLACE VIEW public.roles AS
SELECT * FROM public.remote_jobs;

REVOKE ALL ON public.roles FROM anon, authenticated, public;
GRANT ALL ON public.roles TO service_role;
