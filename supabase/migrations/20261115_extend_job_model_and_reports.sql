-- ==============================================================================
-- Migration: 20261115_extend_job_model_and_reports.sql
-- Description: Extends job model with canonical eligibility JSONB, canonical category,
--              internal role_verified_at, review_status, and creates job_reports table.
-- ==============================================================================

-- 1. Extend remote_jobs table
ALTER TABLE IF EXISTS public.remote_jobs
  ADD COLUMN IF NOT EXISTS eligibility JSONB,
  ADD COLUMN IF NOT EXISTS role_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS review_notes TEXT;

-- 2. Extend employer_jobs table
ALTER TABLE IF EXISTS public.employer_jobs
  ADD COLUMN IF NOT EXISTS eligibility JSONB,
  ADD COLUMN IF NOT EXISTS role_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS review_notes TEXT;

-- 3. Extend jobs table (recruiter console listings)
ALTER TABLE IF EXISTS public.jobs
  ADD COLUMN IF NOT EXISTS eligibility JSONB,
  ADD COLUMN IF NOT EXISTS role_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS review_notes TEXT;

-- 4. Create job_reports table for community reporting
CREATE TABLE IF NOT EXISTS public.job_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  note TEXT,
  reporter_ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performant filtering and report counting
CREATE INDEX IF NOT EXISTS idx_remote_jobs_review_status ON public.remote_jobs(review_status);
CREATE INDEX IF NOT EXISTS idx_remote_jobs_role_verified_at ON public.remote_jobs(role_verified_at);
CREATE INDEX IF NOT EXISTS idx_job_reports_job_id ON public.job_reports(job_id);
CREATE INDEX IF NOT EXISTS idx_job_reports_created_at ON public.job_reports(created_at);

-- RLS policies for job_reports
ALTER TABLE public.job_reports ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'job_reports' 
    AND policyname = 'Anyone can insert job reports'
  ) THEN
    CREATE POLICY "Anyone can insert job reports"
      ON public.job_reports
      FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'job_reports' 
    AND policyname = 'Admins can view job reports'
  ) THEN
    CREATE POLICY "Admins can view job reports"
      ON public.job_reports
      FOR SELECT
      TO authenticated
      USING (
        auth.role() = 'service_role' OR
        EXISTS (
          SELECT 1 FROM public.user_profiles
          WHERE user_profiles.id = auth.uid()
          AND (user_profiles.role = 'PLATFORM_ADMIN' OR user_profiles.role = 'admin')
        )
      );
  END IF;
END $$;
