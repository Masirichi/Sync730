-- ==============================================================================
-- Sprint 1: The Candidate Magnet (Remote Jobs Ingestion & Kanban Tracker)
-- ==============================================================================

-- 1. REMOTE JOBS TABLE
CREATE TABLE IF NOT EXISTS public.remote_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  company_logo TEXT,
  description TEXT,
  category TEXT,
  job_type TEXT DEFAULT 'full-time',
  candidate_required_location TEXT NOT NULL,
  location_tier TEXT NOT NULL DEFAULT 'Worldwide' CHECK (location_tier IN ('Worldwide', 'EMEA', 'Africa Only')),
  salary TEXT,
  url TEXT,
  source TEXT NOT NULL DEFAULT 'remotive',
  tags JSONB DEFAULT '[]'::jsonb,
  published_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_remote_jobs_location_tier ON public.remote_jobs(location_tier);
CREATE INDEX IF NOT EXISTS idx_remote_jobs_published_at ON public.remote_jobs(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_remote_jobs_external_id ON public.remote_jobs(external_id);

-- RLS: remote_jobs is viewable by everyone
ALTER TABLE public.remote_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Remote jobs are viewable by everyone" ON public.remote_jobs;
CREATE POLICY "Remote jobs are viewable by everyone"
  ON public.remote_jobs FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage remote jobs" ON public.remote_jobs;
CREATE POLICY "Admins can manage remote jobs"
  ON public.remote_jobs FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Allow insert/upsert via authenticated/cron with service role or admin
DROP POLICY IF EXISTS "Authenticated users can insert remote jobs" ON public.remote_jobs;
CREATE POLICY "Authenticated users can insert remote jobs"
  ON public.remote_jobs FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update remote jobs" ON public.remote_jobs;
CREATE POLICY "Authenticated users can update remote jobs"
  ON public.remote_jobs FOR UPDATE
  TO authenticated
  USING (true);

-- 2. CANDIDATE TRACKER TABLE (Kanban Board)
CREATE TABLE IF NOT EXISTS public.candidate_tracker (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.remote_jobs(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'SAVED' CHECK (status IN ('SAVED', 'APPLIED', 'INTERVIEWING', 'OFFERED', 'REJECTED')),
  company TEXT NOT NULL,
  title TEXT NOT NULL,
  location TEXT,
  salary TEXT,
  url TEXT,
  notes TEXT,
  applied_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_candidate_job_tracker UNIQUE (candidate_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_candidate_tracker_candidate_id ON public.candidate_tracker(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_tracker_status ON public.candidate_tracker(status);

ALTER TABLE public.candidate_tracker ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Candidates can manage their own tracker" ON public.candidate_tracker;
CREATE POLICY "Candidates can manage their own tracker"
  ON public.candidate_tracker FOR ALL
  TO authenticated
  USING (candidate_id = auth.uid() OR public.is_admin())
  WITH CHECK (candidate_id = auth.uid() OR public.is_admin());
