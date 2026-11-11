-- ==============================================================================
-- Sync730 Hub: Production Role-Based Access Control (RBAC) & Database Schema
-- Compatible with Supabase Postgres & Auth
-- ==============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Custom Types & Enums
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('candidate', 'recruiter', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.job_type AS ENUM ('full-time', 'part-time', 'contract', 'internship');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.job_status AS ENUM ('draft', 'open', 'closed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.application_status AS ENUM ('pending', 'reviewing', 'accepted', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'candidate' CHECK (role IN ('candidate', 'recruiter', 'admin')),
  avatar_url TEXT,
  phone TEXT,
  headline TEXT,
  bio TEXT,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. JOBS TABLE
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  salary_range TEXT,
  job_type TEXT NOT NULL DEFAULT 'full-time' CHECK (job_type IN ('full-time', 'part-time', 'contract', 'internship')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('draft', 'open', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cover_letter TEXT,
  resume_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_candidate_job_application UNIQUE (job_id, candidate_id)
);

-- 6. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_jobs_recruiter_id ON public.jobs(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON public.applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate_id ON public.applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);

-- 8. RBAC HELPER FUNCTIONS (Security Definer to prevent RLS recursion)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid()), false);
$$;

CREATE OR REPLACE FUNCTION public.is_recruiter()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT role IN ('recruiter', 'admin') FROM public.profiles WHERE id = auth.uid()), false);
$$;

CREATE OR REPLACE FUNCTION public.is_candidate()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT role = 'candidate' FROM public.profiles WHERE id = auth.uid()), false);
$$;

-- 9. AUTH TRIGGER TO CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'candidate'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Public profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- JOBS POLICIES
DROP POLICY IF EXISTS "Anyone can view open jobs" ON public.jobs;
CREATE POLICY "Anyone can view open jobs"
  ON public.jobs FOR SELECT
  USING (
    status = 'open' 
    OR (auth.uid() = recruiter_id) 
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Recruiters and admins can insert jobs" ON public.jobs;
CREATE POLICY "Recruiters and admins can insert jobs"
  ON public.jobs FOR INSERT
  TO authenticated
  WITH CHECK (
    (public.is_recruiter() AND auth.uid() = recruiter_id)
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Recruiters can update own jobs, admins update any" ON public.jobs;
CREATE POLICY "Recruiters can update own jobs, admins update any"
  ON public.jobs FOR UPDATE
  TO authenticated
  USING (auth.uid() = recruiter_id OR public.is_admin())
  WITH CHECK (auth.uid() = recruiter_id OR public.is_admin());

DROP POLICY IF EXISTS "Recruiters can delete own jobs, admins delete any" ON public.jobs;
CREATE POLICY "Recruiters can delete own jobs, admins delete any"
  ON public.jobs FOR DELETE
  TO authenticated
  USING (auth.uid() = recruiter_id OR public.is_admin());

-- APPLICATIONS POLICIES
DROP POLICY IF EXISTS "Candidates view own applications, Recruiters view for their jobs, Admins view all" ON public.applications;
CREATE POLICY "Candidates view own applications, Recruiters view for their jobs, Admins view all"
  ON public.applications FOR SELECT
  TO authenticated
  USING (
    candidate_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = applications.job_id
        AND jobs.recruiter_id = auth.uid()
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Candidates can submit applications" ON public.applications;
CREATE POLICY "Candidates can submit applications"
  ON public.applications FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = candidate_id
    AND EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = applications.job_id
        AND jobs.status = 'open'
    )
  );

DROP POLICY IF EXISTS "Recruiters can update status, Candidates can update pending application" ON public.applications;
CREATE POLICY "Recruiters can update status, Candidates can update pending application"
  ON public.applications FOR UPDATE
  TO authenticated
  USING (
    (candidate_id = auth.uid() AND status = 'pending')
    OR EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = applications.job_id
        AND jobs.recruiter_id = auth.uid()
    )
    OR public.is_admin()
  )
  WITH CHECK (
    (candidate_id = auth.uid() AND status = 'pending')
    OR EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = applications.job_id
        AND jobs.recruiter_id = auth.uid()
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Admins or candidates can withdraw applications" ON public.applications;
CREATE POLICY "Admins or candidates can withdraw applications"
  ON public.applications FOR DELETE
  TO authenticated
  USING (candidate_id = auth.uid() OR public.is_admin());

-- AUDIT LOGS POLICIES
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Authenticated users and system can append audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users and system can append audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL OR public.is_admin());
-- ==============================================================================
-- Sync730 Hub: Role Isolation, Token Unlocks & Candidate Privacy Masking
-- ==============================================================================

-- 1. Ensure user_profiles View/Compatibility with Profiles
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT 
  id,
  email,
  full_name,
  role,
  avatar_url,
  phone,
  headline,
  bio,
  location,
  created_at,
  updated_at
FROM public.profiles;

-- 2. Token Unlocks Table (Recruiter Candidate Masking / Unlock Mechanism)
CREATE TABLE IF NOT EXISTS public.token_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tokens_spent INTEGER NOT NULL DEFAULT 1 CHECK (tokens_spent > 0),
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_recruiter_candidate_unlock UNIQUE (recruiter_id, candidate_id)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_token_unlocks_recruiter ON public.token_unlocks(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_token_unlocks_candidate ON public.token_unlocks(candidate_id);
CREATE INDEX IF NOT EXISTS idx_token_unlocks_active ON public.token_unlocks(recruiter_id, candidate_id, is_active);

-- Enable RLS on token_unlocks
ALTER TABLE public.token_unlocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Recruiters can view their own unlocks" ON public.token_unlocks;
CREATE POLICY "Recruiters can view their own unlocks"
  ON public.token_unlocks FOR SELECT
  TO authenticated
  USING (recruiter_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Recruiters can insert unlocks" ON public.token_unlocks;
CREATE POLICY "Recruiters can insert unlocks"
  ON public.token_unlocks FOR INSERT
  TO authenticated
  WITH CHECK (
    recruiter_id = auth.uid() 
    AND (public.is_recruiter() OR public.is_admin())
  );

-- 3. Masked Candidate View for Recruiter Queries (Enforcing is_masked = TRUE by default)
CREATE OR REPLACE VIEW public.recruiter_candidates_masked AS
SELECT 
  p.id,
  CASE 
    WHEN tu.is_active = true OR p.id = auth.uid() OR public.is_admin() THEN false 
    ELSE true 
  END AS is_masked,
  CASE 
    WHEN tu.is_active = true OR p.id = auth.uid() OR public.is_admin() THEN p.full_name 
    ELSE 'Candidate #' || UPPER(SUBSTRING(p.id::text, 1, 6))
  END AS display_name,
  CASE 
    WHEN tu.is_active = true OR p.id = auth.uid() OR public.is_admin() THEN p.email 
    ELSE 'masked@sync730.com'
  END AS display_email,
  CASE 
    WHEN tu.is_active = true OR p.id = auth.uid() OR public.is_admin() THEN p.phone 
    ELSE NULL 
  END AS display_phone,
  p.role,
  p.headline,
  p.bio,
  p.location,
  CASE 
    WHEN tu.is_active = true OR p.id = auth.uid() OR public.is_admin() THEN p.avatar_url 
    ELSE NULL 
  END AS avatar_url,
  p.created_at,
  COALESCE(tu.is_active, false) AS is_unlocked
FROM public.profiles p
LEFT JOIN public.token_unlocks tu 
  ON tu.candidate_id = p.id 
  AND tu.recruiter_id = auth.uid() 
  AND tu.is_active = true
WHERE p.role = 'candidate';

-- 4. Unlock Candidate Stored Procedure
CREATE OR REPLACE FUNCTION public.unlock_candidate(target_candidate_id UUID, token_cost INTEGER DEFAULT 1)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recruiter_id UUID;
  v_existing_unlock UUID;
  v_result JSONB;
BEGIN
  v_recruiter_id := auth.uid();
  
  IF v_recruiter_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Ensure caller is recruiter or admin
  IF NOT (public.is_recruiter() OR public.is_admin()) THEN
    RAISE EXCEPTION 'Only recruiters or admins can unlock candidate profiles';
  END IF;

  -- Check if already unlocked
  SELECT id INTO v_existing_unlock
  FROM public.token_unlocks
  WHERE recruiter_id = v_recruiter_id AND candidate_id = target_candidate_id AND is_active = true;

  IF v_existing_unlock IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_unlocked', true,
      'unlock_id', v_existing_unlock
    );
  END IF;

  -- Insert token unlock record
  INSERT INTO public.token_unlocks (
    recruiter_id,
    candidate_id,
    tokens_spent,
    is_active
  ) VALUES (
    v_recruiter_id,
    target_candidate_id,
    token_cost,
    true
  )
  ON CONFLICT (recruiter_id, candidate_id)
  DO UPDATE SET
    is_active = true,
    unlocked_at = timezone('utc'::text, now()),
    tokens_spent = public.token_unlocks.tokens_spent + token_cost
  RETURNING id INTO v_existing_unlock;

  -- Audit log record
  INSERT INTO public.audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    metadata
  ) VALUES (
    v_recruiter_id,
    'candidate_profile_unlocked',
    'candidate',
    target_candidate_id::text,
    jsonb_build_object('tokens_spent', token_cost)
  );

  RETURN jsonb_build_object(
    'success', true,
    'already_unlocked', false,
    'unlock_id', v_existing_unlock
  );
END;
$$;
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


-- ==============================================================================
-- Sprint 2: Paid B2C AI Mock Video Interview Sandbox (Paystack & Feedback)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.mock_prep_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_role TEXT NOT NULL,
  company_name TEXT,
  amount INTEGER NOT NULL DEFAULT 250000, -- 250,000 kobo = ₦2,500
  currency TEXT NOT NULL DEFAULT 'NGN',
  payment_reference TEXT UNIQUE,
  payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'COMPLETED', 'FAILED', 'BYPASSED')),
  interview_questions JSONB DEFAULT '[]'::jsonb,
  candidate_answers JSONB DEFAULT '[]'::jsonb,
  feedback_payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_mock_prep_candidate_id ON public.mock_prep_sessions(candidate_id);
CREATE INDEX IF NOT EXISTS idx_mock_prep_payment_reference ON public.mock_prep_sessions(payment_reference);
CREATE INDEX IF NOT EXISTS idx_mock_prep_payment_status ON public.mock_prep_sessions(payment_status);

ALTER TABLE public.mock_prep_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Candidates can manage their own mock prep sessions" ON public.mock_prep_sessions;
CREATE POLICY "Candidates can manage their own mock prep sessions"
  ON public.mock_prep_sessions FOR ALL
  TO authenticated
  USING (candidate_id = auth.uid() OR candidate_id IS NULL OR public.is_admin())
  WITH CHECK (candidate_id = auth.uid() OR candidate_id IS NULL OR public.is_admin());

DROP POLICY IF EXISTS "Allow anon insert and select for mock sessions" ON public.mock_prep_sessions;
CREATE POLICY "Allow anon insert and select for mock sessions"
  ON public.mock_prep_sessions FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);


-- ==============================================================================
-- Sprint 3: Recruiter & Employer B2B Console & Token Paywall Schema
-- ==============================================================================

-- 1. CORPORATE WORKSPACES TABLE
CREATE TABLE IF NOT EXISTS public.corporate_workspaces (
  id TEXT PRIMARY KEY DEFAULT ('ws-' || substr(md5(random()::text), 1, 10)),
  company_name TEXT NOT NULL,
  billing_email TEXT NOT NULL,
  token_balance INTEGER NOT NULL DEFAULT 2, -- 2 Free trial tokens on signup
  industry TEXT DEFAULT 'Technology',
  company_size TEXT DEFAULT '10-50',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_corporate_workspaces_billing_email ON public.corporate_workspaces(billing_email);

-- 2. WORKSPACE MEMBERS TABLE (RBAC: OWNER, ADMIN, INTERVIEWER)
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id TEXT PRIMARY KEY DEFAULT ('mem-' || substr(md5(random()::text), 1, 10)),
  workspace_id TEXT NOT NULL REFERENCES public.corporate_workspaces(id) ON DELETE CASCADE,
  user_id TEXT,
  role TEXT NOT NULL DEFAULT 'OWNER' CHECK (role IN ('OWNER', 'ADMIN', 'INTERVIEWER')),
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON public.workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON public.workspace_members(user_id);

-- 3. EMPLOYER JOBS TABLE (Flowmingo Integrated)
CREATE TABLE IF NOT EXISTS public.employer_jobs (
  id TEXT PRIMARY KEY DEFAULT ('job-emp-' || substr(md5(random()::text), 1, 10)),
  workspace_id TEXT NOT NULL REFERENCES public.corporate_workspaces(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  department TEXT DEFAULT 'Engineering',
  location TEXT DEFAULT '100% Remote',
  job_type TEXT DEFAULT 'Full-time',
  salary_range TEXT DEFAULT '$90k - $130k USD',
  description TEXT,
  flowmingo_project_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'closed')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_employer_jobs_workspace_id ON public.employer_jobs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_employer_jobs_status ON public.employer_jobs(status);

-- 4. VIDEO ASSESSMENTS TABLE (Flowmingo Webhook & Candidate Vet-Once)
CREATE TABLE IF NOT EXISTS public.video_assessments (
  id TEXT PRIMARY KEY DEFAULT ('va-' || substr(md5(random()::text), 1, 10)),
  candidate_id TEXT NOT NULL,
  target_role TEXT NOT NULL,
  overall_match_score INTEGER NOT NULL DEFAULT 85,
  technical_depth_score INTEGER NOT NULL DEFAULT 85,
  communication_score INTEGER NOT NULL DEFAULT 85,
  ai_summary TEXT,
  secure_video_url TEXT,
  proctoring_flags JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FLAGGED')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_video_assessments_candidate_id ON public.video_assessments(candidate_id);
CREATE INDEX IF NOT EXISTS idx_video_assessments_status ON public.video_assessments(status);

-- 5. TOKEN UNLOCKS TABLE (1 Token Paywall per candidate)
CREATE TABLE IF NOT EXISTS public.token_unlocks (
  id TEXT PRIMARY KEY DEFAULT ('unl-' || substr(md5(random()::text), 1, 10)),
  workspace_id TEXT NOT NULL REFERENCES public.corporate_workspaces(id) ON DELETE CASCADE,
  candidate_id TEXT NOT NULL,
  tokens_spent INTEGER NOT NULL DEFAULT 1,
  unlocked_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_workspace_candidate_unlock UNIQUE (workspace_id, candidate_id)
);

CREATE INDEX IF NOT EXISTS idx_token_unlocks_workspace_candidate ON public.token_unlocks(workspace_id, candidate_id);

-- 6. RLS POLICIES
ALTER TABLE public.corporate_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employer_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_unlocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read and write B2B workspaces" ON public.corporate_workspaces;
CREATE POLICY "Public can read and write B2B workspaces" ON public.corporate_workspaces FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can manage workspace members" ON public.workspace_members;
CREATE POLICY "Public can manage workspace members" ON public.workspace_members FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can manage employer jobs" ON public.employer_jobs;
CREATE POLICY "Public can manage employer jobs" ON public.employer_jobs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can read video assessments" ON public.video_assessments;
CREATE POLICY "Public can read video assessments" ON public.video_assessments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can manage token unlocks" ON public.token_unlocks;
CREATE POLICY "Public can manage token unlocks" ON public.token_unlocks FOR ALL USING (true) WITH CHECK (true);


-- ==============================================================================
-- Sprint 4: Platform Admin Command Center Schema & RBAC Policies
-- ==============================================================================

-- 1. ADMIN AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id TEXT PRIMARY KEY DEFAULT ('log-' || substr(md5(random()::text), 1, 10)),
  admin_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  target_id TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON public.admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action_type ON public.admin_audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);

-- 2. PLATFORM TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.platform_transactions (
  id TEXT PRIMARY KEY DEFAULT ('tx-' || substr(md5(random()::text), 1, 10)),
  workspace_id TEXT NOT NULL,
  amount_ngn INTEGER NOT NULL DEFAULT 0,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('TOKEN_PURCHASE', 'ADMIN_ADJUSTMENT', 'MOCK_PREP_FEE')),
  payment_reference TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'SUCCESS',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_platform_transactions_workspace_id ON public.platform_transactions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_platform_transactions_type ON public.platform_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_platform_transactions_created_at ON public.platform_transactions(created_at DESC);

-- 3. ENSURE VIDEO ASSESSMENTS HAS MODERATION_STATUS
DO $$ BEGIN
  ALTER TABLE public.video_assessments ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'APPROVED';
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- 4. RLS POLICIES FOR PLATFORM ADMIN COMMAND CENTER
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view and manage audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can view and manage audit logs"
  ON public.admin_audit_logs FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view and manage transactions" ON public.platform_transactions;
CREATE POLICY "Admins can view and manage transactions"
  ON public.platform_transactions FOR ALL
  USING (true)
  WITH CHECK (true);
