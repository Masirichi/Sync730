-- Migration: add full job fields and enums
-- Run this with supabase db push or psql

-- 1. Enums for new fields
DO $$ BEGIN
  CREATE TYPE public.employer_type AS ENUM ('direct', 'agency');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.seniority_level AS ENUM (
    'intern', 'entry', 'mid', 'senior', 'lead', 'manager', 'director', 'executive'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.location_rule AS ENUM ('worldwide', 'emea', 'africa_only');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE public.salary_period AS ENUM ('hour', 'month', 'year');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Extend jobs table
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS source_name TEXT,
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS apply_url TEXT,
  ADD COLUMN IF NOT EXISTS posted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS employer_type employer_type NOT NULL DEFAULT 'direct',
  ADD COLUMN IF NOT EXISTS seniority seniority_level,
  ADD COLUMN IF NOT EXISTS location_rule location_rule NOT NULL DEFAULT 'worldwide',
  ADD COLUMN IF NOT EXISTS eligible_countries JSONB,
  ADD COLUMN IF NOT EXISTS open_to_nigeria BOOLEAN,
  ADD COLUMN IF NOT EXISTS salary_min NUMERIC,
  ADD COLUMN IF NOT EXISTS salary_max NUMERIC,
  ADD COLUMN IF NOT EXISTS salary_currency TEXT,
  ADD COLUMN IF NOT EXISTS salary_period salary_period,
  ADD COLUMN IF NOT EXISTS skills JSONB,
  ADD COLUMN IF NOT EXISTS responsibilities TEXT,
  ADD COLUMN IF NOT EXISTS requirements TEXT,
  ADD COLUMN IF NOT EXISTS hash TEXT UNIQUE;

-- 3. Indexes for new columns (optional but useful)
CREATE INDEX IF NOT EXISTS idx_jobs_hash ON public.jobs(hash);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_at ON public.jobs(posted_at);
CREATE INDEX IF NOT EXISTS idx_jobs_expires_at ON public.jobs(expires_at);
CREATE INDEX IF NOT EXISTS idx_jobs_employer_type ON public.jobs(employer_type);
CREATE INDEX IF NOT EXISTS idx_jobs_location_rule ON public.jobs(location_rule);
CREATE INDEX IF NOT EXISTS idx_jobs_open_to_nigeria ON public.jobs(open_to_nigeria);
