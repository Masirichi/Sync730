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
