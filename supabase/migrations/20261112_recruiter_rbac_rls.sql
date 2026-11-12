-- ==============================================================================
-- Security & RBAC Row-Level Security Migration for Recruiter Console (/console/*)
-- Enforces: OWNER, ADMIN, INTERVIEWER roles and strict organization scoping.
-- ==============================================================================

-- 1. CANDIDATE NOTES TABLE (Internal notes and evaluation scores)
CREATE TABLE IF NOT EXISTS public.candidate_notes (
  id TEXT PRIMARY KEY DEFAULT ('note-' || substr(md5(random()::text), 1, 10)),
  workspace_id TEXT NOT NULL REFERENCES public.corporate_workspaces(id) ON DELETE CASCADE,
  candidate_id TEXT NOT NULL,
  author_email TEXT NOT NULL,
  author_role TEXT NOT NULL CHECK (author_role IN ('OWNER', 'ADMIN', 'INTERVIEWER')),
  note TEXT NOT NULL,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_candidate_notes_ws_cand ON public.candidate_notes(workspace_id, candidate_id);

-- 2. HELPER FUNCTION TO GET CALLER'S ROLE IN A WORKSPACE
CREATE OR REPLACE FUNCTION public.get_recruiter_workspace_role(ws_id TEXT)
RETURNS TEXT AS $$
  SELECT role FROM public.workspace_members
  WHERE workspace_id = ws_id
    AND (user_id = auth.uid()::text OR email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 3. ENABLE RLS ON ALL B2B TABLES
ALTER TABLE public.corporate_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employer_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_notes ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES: CORPORATE WORKSPACES
-- A user can only view their own organization's workspace
DROP POLICY IF EXISTS "Workspaces viewed only by members" ON public.corporate_workspaces;
CREATE POLICY "Workspaces viewed only by members" ON public.corporate_workspaces
  FOR SELECT USING (
    id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()::text
         OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
    OR billing_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Only OWNER can update workspace settings
DROP POLICY IF EXISTS "Workspaces updated only by OWNER or ADMIN" ON public.corporate_workspaces;
CREATE POLICY "Workspaces updated only by OWNER or ADMIN" ON public.corporate_workspaces
  FOR UPDATE USING (
    public.get_recruiter_workspace_role(id) IN ('OWNER', 'ADMIN')
  );

-- 5. POLICIES: WORKSPACE MEMBERS
-- Members can view their colleagues in the same workspace
DROP POLICY IF EXISTS "Members can view workspace members" ON public.workspace_members;
CREATE POLICY "Members can view workspace members" ON public.workspace_members
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()::text
         OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Only OWNER and ADMIN can invite, edit, or remove members (INTERVIEWER cannot)
DROP POLICY IF EXISTS "Only OWNER and ADMIN can manage members" ON public.workspace_members;
CREATE POLICY "Only OWNER and ADMIN can manage members" ON public.workspace_members
  FOR INSERT WITH CHECK (
    public.get_recruiter_workspace_role(workspace_id) IN ('OWNER', 'ADMIN')
  );

DROP POLICY IF EXISTS "Only OWNER and ADMIN can update members" ON public.workspace_members;
CREATE POLICY "Only OWNER and ADMIN can update members" ON public.workspace_members
  FOR UPDATE USING (
    public.get_recruiter_workspace_role(workspace_id) IN ('OWNER', 'ADMIN')
  );

DROP POLICY IF EXISTS "Only OWNER and ADMIN can delete members" ON public.workspace_members;
CREATE POLICY "Only OWNER and ADMIN can delete members" ON public.workspace_members
  FOR DELETE USING (
    public.get_recruiter_workspace_role(workspace_id) IN ('OWNER', 'ADMIN')
  );

-- 6. POLICIES: EMPLOYER JOBS
-- Members of the workspace can view jobs
DROP POLICY IF EXISTS "Members can view workspace employer jobs" ON public.employer_jobs;
CREATE POLICY "Members can view workspace employer jobs" ON public.employer_jobs
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()::text
         OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Only OWNER and ADMIN can create, update, or close jobs (INTERVIEWER cannot)
DROP POLICY IF EXISTS "Only OWNER and ADMIN can create employer jobs" ON public.employer_jobs;
CREATE POLICY "Only OWNER and ADMIN can create employer jobs" ON public.employer_jobs
  FOR INSERT WITH CHECK (
    public.get_recruiter_workspace_role(workspace_id) IN ('OWNER', 'ADMIN')
  );

DROP POLICY IF EXISTS "Only OWNER and ADMIN can update employer jobs" ON public.employer_jobs;
CREATE POLICY "Only OWNER and ADMIN can update employer jobs" ON public.employer_jobs
  FOR UPDATE USING (
    public.get_recruiter_workspace_role(workspace_id) IN ('OWNER', 'ADMIN')
  );

-- 7. POLICIES: TOKEN UNLOCKS
-- Members can view candidate unlocks for their workspace
DROP POLICY IF EXISTS "Members can view token unlocks" ON public.token_unlocks;
CREATE POLICY "Members can view token unlocks" ON public.token_unlocks
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()::text
         OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Only OWNER and ADMIN can spend tokens to unlock candidates (INTERVIEWER cannot)
DROP POLICY IF EXISTS "Only OWNER and ADMIN can spend tokens" ON public.token_unlocks;
CREATE POLICY "Only OWNER and ADMIN can spend tokens" ON public.token_unlocks
  FOR INSERT WITH CHECK (
    public.get_recruiter_workspace_role(workspace_id) IN ('OWNER', 'ADMIN')
  );

-- 8. POLICIES: CANDIDATE NOTES
-- Workspace members (including INTERVIEWER) can view and add evaluation notes and scores
DROP POLICY IF EXISTS "Workspace members can view notes" ON public.candidate_notes;
CREATE POLICY "Workspace members can view notes" ON public.candidate_notes
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()::text
         OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Workspace members can add evaluation notes" ON public.candidate_notes;
CREATE POLICY "Workspace members can add evaluation notes" ON public.candidate_notes
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()::text
         OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );
