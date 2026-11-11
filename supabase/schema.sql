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
