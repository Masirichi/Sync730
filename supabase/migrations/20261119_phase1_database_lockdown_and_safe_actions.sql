-- ==============================================================================
-- Migration: 20261119_phase1_database_lockdown_and_safe_actions.sql
-- PHASE 1: Lock the database, then make dangerous actions safe.
--
-- 1A. RLS AUDIT & DEFAULT DENY
-- - Enable RLS on every table in the public schema
-- - Drop lingering Sprint 3 open policies ("Public can manage...")
-- - Revoke unneeded anon privileges across all tables
-- - Maintain public SELECT on remote_jobs (active roles only) for public board
-- - Authoritative admin_roles(user_id, role, granted_by, granted_at)
--
-- 1B. AUDIT LOG (APPEND-ONLY)
-- - Immutable append-only audit_log table
-- - Trigger preventing UPDATE and DELETE (FOR EACH ROW)
-- - Trigger preventing TRUNCATE (FOR EACH STATEMENT)
-- - REVOKE UPDATE, DELETE, TRUNCATE from PUBLIC, anon, authenticated
--
-- 1D. DANGEROUS ACTIONS AS ATOMIC POSTGRES RPC FUNCTIONS
-- - change_user_role
-- - adjust_tokens
-- - take_down_role
-- - suspend_user
-- - trigger_crawler_run
-- All functions: SECURITY DEFINER with fixed search_path = public, pg_temp
-- Granted strictly to service_role; revoked from PUBLIC, anon, authenticated
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1A. AUTHORITATIVE ADMIN ROLES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_roles (
  user_id TEXT PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'super_admin' CHECK (role IN ('super_admin', 'moderator', 'vetting_reviewer', 'finance', 'support')),
  granted_by TEXT DEFAULT 'system',
  granted_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Ensure granted_by and granted_at columns exist if table was previously created
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'admin_roles' AND column_name = 'granted_by') THEN
    ALTER TABLE public.admin_roles ADD COLUMN granted_by TEXT DEFAULT 'system';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'admin_roles' AND column_name = 'granted_at') THEN
    ALTER TABLE public.admin_roles ADD COLUMN granted_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
  END IF;
END $$;

-- Seed existing platform admin users as super_admin
INSERT INTO public.admin_roles (user_id, role, granted_by, granted_at)
VALUES 
  ('usr-admin-001', 'super_admin', 'system_seed', timezone('utc'::text, now())),
  ('demo-platform_admin-user', 'super_admin', 'system_seed', timezone('utc'::text, now()))
ON CONFLICT (user_id) DO UPDATE SET
  role = EXCLUDED.role,
  updated_at = timezone('utc'::text, now());

-- Also seed any user with PLATFORM_ADMIN or admin role in profiles
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    INSERT INTO public.admin_roles (user_id, role, granted_by, granted_at)
    SELECT id::text, 'super_admin', 'profiles_migration', timezone('utc'::text, now())
    FROM public.profiles
    WHERE role IN ('PLATFORM_ADMIN', 'admin')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;

-- Security Definer helper function to read admin role (immutable from client)
CREATE OR REPLACE FUNCTION public.get_admin_role(p_user_id TEXT)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT role FROM public.admin_roles WHERE user_id = p_user_id LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_admin_role(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_role(TEXT) TO authenticated, service_role;

-- Lockdown admin_roles: Zero anon access, service_role only
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_roles FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_roles TO service_role;


-- ------------------------------------------------------------------------------
-- 1B. APPEND-ONLY AUDIT LOG TABLE & IMMUTABILITY TRIGGERS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_log (
  id TEXT PRIMARY KEY DEFAULT ('log-' || substr(md5(random()::text), 1, 12)),
  actor_id TEXT NOT NULL,
  actor_name TEXT,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  target_label TEXT,
  reason TEXT NOT NULL,
  before JSONB DEFAULT '{}'::jsonb,
  after JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  ip TEXT
);

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor_id ON public.audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_target ON public.audit_log(target_type, target_id);

-- Row-level trigger: Exception on UPDATE or DELETE
CREATE OR REPLACE FUNCTION public.prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only. UPDATE and DELETE operations are strictly prohibited.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_log_immutable ON public.audit_log;
CREATE TRIGGER trg_audit_log_immutable
BEFORE UPDATE OR DELETE ON public.audit_log
FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_modification();

-- Statement-level trigger: Exception on TRUNCATE
CREATE OR REPLACE FUNCTION public.prevent_audit_log_truncate()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only. TRUNCATE operation is strictly prohibited.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_log_no_truncate ON public.audit_log;
CREATE TRIGGER trg_audit_log_no_truncate
BEFORE TRUNCATE ON public.audit_log
FOR EACH STATEMENT EXECUTE FUNCTION public.prevent_audit_log_truncate();

-- RLS & Revocation on audit_log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.audit_log FROM PUBLIC, anon, authenticated;
REVOKE UPDATE, DELETE, TRUNCATE ON public.audit_log FROM service_role;
GRANT SELECT, INSERT ON public.audit_log TO service_role;


-- ------------------------------------------------------------------------------
-- 1A (cont). RLS AUDIT & LOCKDOWN ACROSS ALL PUBLIC SCHEMA TABLES
-- ------------------------------------------------------------------------------

-- 1. token_unlocks: Clean lingering Sprint 3 public policy
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'token_unlocks') THEN
    ALTER TABLE public.token_unlocks ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Public can manage token unlocks" ON public.token_unlocks;
    REVOKE ALL ON public.token_unlocks FROM anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.token_unlocks TO service_role;
  END IF;
END $$;

-- 2. workspace_members: Clean lingering Sprint 3 public policy
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workspace_members') THEN
    ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Public can manage workspace members" ON public.workspace_members;
    REVOKE ALL ON public.workspace_members FROM anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_members TO service_role;
  END IF;
END $$;

-- 3. employer_jobs: Clean lingering Sprint 3 public policy
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employer_jobs') THEN
    ALTER TABLE public.employer_jobs ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Public can manage employer jobs" ON public.employer_jobs;
    REVOKE ALL ON public.employer_jobs FROM anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.employer_jobs TO service_role;
  END IF;
END $$;

-- 4. admin_audit_logs (legacy): Clean lingering Sprint 4 public policy
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_audit_logs') THEN
    ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Admins can view and manage audit logs" ON public.admin_audit_logs;
    REVOKE ALL ON public.admin_audit_logs FROM anon;
    GRANT SELECT, INSERT ON public.admin_audit_logs TO service_role;
  END IF;
END $$;

-- 5. mock_prep_sessions: Clean anon policy
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'mock_prep_sessions') THEN
    ALTER TABLE public.mock_prep_sessions ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow anon insert and select for mock sessions" ON public.mock_prep_sessions;
    REVOKE ALL ON public.mock_prep_sessions FROM anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.mock_prep_sessions TO service_role;
  END IF;
END $$;

-- 6. corporate_workspaces: Revoke anon
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'corporate_workspaces') THEN
    ALTER TABLE public.corporate_workspaces ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Public can read and write B2B workspaces" ON public.corporate_workspaces;
    REVOKE ALL ON public.corporate_workspaces FROM anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.corporate_workspaces TO service_role;
  END IF;
END $$;

-- 7. video_assessments: Revoke anon
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'video_assessments') THEN
    ALTER TABLE public.video_assessments ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Public can read video assessments" ON public.video_assessments;
    REVOKE ALL ON public.video_assessments FROM anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_assessments TO service_role;
  END IF;
END $$;

-- 8. platform_transactions: Revoke anon
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'platform_transactions') THEN
    ALTER TABLE public.platform_transactions ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Admins can view and manage transactions" ON public.platform_transactions;
    REVOKE ALL ON public.platform_transactions FROM anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_transactions TO service_role;
  END IF;
END $$;

-- 9. remote_jobs: Public board read-only for active roles until Phase 4 view
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'remote_jobs') THEN
    ALTER TABLE public.remote_jobs ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Remote jobs are viewable by everyone" ON public.remote_jobs;
    CREATE POLICY "Remote jobs are viewable by everyone"
      ON public.remote_jobs FOR SELECT
      TO public
      USING (is_active IS NULL OR is_active = true);

    REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.remote_jobs FROM anon;
    GRANT SELECT ON public.remote_jobs TO anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.remote_jobs TO service_role;
  END IF;
END $$;


-- ------------------------------------------------------------------------------
-- 1D. DANGEROUS ACTIONS AS ATOMIC POSTGRES RPC FUNCTIONS
-- All functions run with SECURITY DEFINER and fixed search_path = public, pg_temp.
-- Granted ONLY to service_role; revoked from PUBLIC, anon, authenticated.
-- ------------------------------------------------------------------------------

-- 1. change_user_role
CREATE OR REPLACE FUNCTION public.change_user_role(
  p_actor_id TEXT,
  p_actor_name TEXT,
  p_target_user_id TEXT,
  p_new_role TEXT,
  p_reason TEXT,
  p_ip TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_current_role TEXT;
  v_admin_count INTEGER;
  v_log_id TEXT;
BEGIN
  -- Validate reason (minimum 10 characters)
  IF p_reason IS NULL OR length(trim(p_reason)) < 10 THEN
    RAISE EXCEPTION 'A valid reason of at least 10 characters is required for role changes.';
  END IF;

  -- Block self-demotion
  IF p_actor_id = p_target_user_id AND p_new_role != 'super_admin' THEN
    RAISE EXCEPTION 'Self-demotion is prohibited. You cannot remove your own Super admin privileges.';
  END IF;

  -- Get target current role
  SELECT role INTO v_current_role FROM public.admin_roles WHERE user_id = p_target_user_id;

  -- Block removing the last super_admin
  IF v_current_role = 'super_admin' AND p_new_role != 'super_admin' THEN
    SELECT count(*) INTO v_admin_count FROM public.admin_roles WHERE role = 'super_admin';
    IF v_admin_count <= 1 THEN
      RAISE EXCEPTION 'Cannot remove the last remaining Super admin. At least one platform admin must always exist.';
    END IF;
  END IF;

  -- Update or insert role in admin_roles
  INSERT INTO public.admin_roles (user_id, role, granted_by, granted_at, updated_at)
  VALUES (p_target_user_id, p_new_role, p_actor_id, timezone('utc'::text, now()), timezone('utc'::text, now()))
  ON CONFLICT (user_id) DO UPDATE SET
    role = EXCLUDED.role,
    granted_by = EXCLUDED.granted_by,
    granted_at = timezone('utc'::text, now()),
    updated_at = timezone('utc'::text, now());

  -- Update profiles table if user exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    UPDATE public.profiles
    SET role = CASE WHEN p_new_role = 'super_admin' THEN 'admin' ELSE p_new_role END
    WHERE id::text = p_target_user_id;
  END IF;

  -- Atomically insert into audit_log
  v_log_id := 'log-' || substr(md5(random()::text), 1, 12);
  INSERT INTO public.audit_log (
    id, actor_id, actor_name, action, target_type, target_id, target_label,
    reason, before, after, ip, created_at
  ) VALUES (
    v_log_id, p_actor_id, p_actor_name, 'USER_ROLE_CHANGE', 'USER_ROLE', p_target_user_id, p_target_user_id,
    p_reason,
    jsonb_build_object('role', COALESCE(v_current_role, 'none')),
    jsonb_build_object('role', p_new_role),
    p_ip,
    timezone('utc'::text, now())
  );

  RETURN jsonb_build_object('success', true, 'log_id', v_log_id, 'new_role', p_new_role);
END;
$$;

-- Alias for backward-compatibility
CREATE OR REPLACE FUNCTION public.rpc_admin_change_user_role(
  p_actor_id TEXT,
  p_actor_name TEXT,
  p_target_user_id TEXT,
  p_new_role TEXT,
  p_reason TEXT,
  p_ip TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN public.change_user_role(p_actor_id, p_actor_name, p_target_user_id, p_new_role, p_reason, p_ip);
END;
$$;

REVOKE ALL ON FUNCTION public.change_user_role FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.change_user_role TO service_role;
REVOKE ALL ON FUNCTION public.rpc_admin_change_user_role FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_admin_change_user_role TO service_role;


-- 2. adjust_tokens
CREATE OR REPLACE FUNCTION public.adjust_tokens(
  p_actor_id TEXT,
  p_actor_name TEXT,
  p_workspace_id TEXT,
  p_delta INTEGER,
  p_reason TEXT,
  p_ip TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_workspace_name TEXT;
  v_log_id TEXT;
  c_max_adjustment CONSTANT INTEGER := 100; -- Configurable limit constant
BEGIN
  -- Validate reason (minimum 10 characters)
  IF p_reason IS NULL OR length(trim(p_reason)) < 10 THEN
    RAISE EXCEPTION 'A valid reason of at least 10 characters is required for token adjustments.';
  END IF;

  -- Validate amount is non-zero
  IF p_delta = 0 THEN
    RAISE EXCEPTION 'Token adjustment amount must be a non-zero integer.';
  END IF;

  -- Enforce sane upper limit constant (max 100)
  IF abs(p_delta) > c_max_adjustment THEN
    RAISE EXCEPTION 'Adjustment amount exceeds maximum allowed limit of % tokens per transaction.', c_max_adjustment;
  END IF;

  -- Fetch current workspace balance
  SELECT token_balance, company_name INTO v_current_balance, v_workspace_name
  FROM public.corporate_workspaces
  WHERE id = p_workspace_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Workspace not found: %', p_workspace_id;
  END IF;

  v_new_balance := v_current_balance + p_delta;

  -- Guard against resulting negative balance
  IF v_new_balance < 0 THEN
    RAISE EXCEPTION 'Cannot reduce token balance below zero. Current balance is %, requested adjustment is %', v_current_balance, p_delta;
  END IF;

  -- Update workspace balance
  UPDATE public.corporate_workspaces
  SET token_balance = v_new_balance
  WHERE id = p_workspace_id;

  -- Atomically insert audit row
  v_log_id := 'log-' || substr(md5(random()::text), 1, 12);
  INSERT INTO public.audit_log (
    id, actor_id, actor_name, action, target_type, target_id, target_label,
    reason, before, after, ip, created_at
  ) VALUES (
    v_log_id, p_actor_id, p_actor_name, 'TOKEN_ADJUSTMENT', 'WORKSPACE_TOKENS', p_workspace_id, v_workspace_name,
    p_reason,
    jsonb_build_object('token_balance', v_current_balance),
    jsonb_build_object('token_balance', v_new_balance, 'delta', p_delta, 'direction', CASE WHEN p_delta > 0 THEN 'ADD' ELSE 'REMOVE' END),
    p_ip,
    timezone('utc'::text, now())
  );

  RETURN jsonb_build_object('success', true, 'log_id', v_log_id, 'token_balance', v_new_balance);
END;
$$;

-- Alias
CREATE OR REPLACE FUNCTION public.rpc_admin_adjust_tokens(
  p_actor_id TEXT,
  p_actor_name TEXT,
  p_workspace_id TEXT,
  p_delta INTEGER,
  p_reason TEXT,
  p_ip TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN public.adjust_tokens(p_actor_id, p_actor_name, p_workspace_id, p_delta, p_reason, p_ip);
END;
$$;

REVOKE ALL ON FUNCTION public.adjust_tokens FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_tokens TO service_role;
REVOKE ALL ON FUNCTION public.rpc_admin_adjust_tokens FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_admin_adjust_tokens TO service_role;


-- 3. take_down_role
CREATE OR REPLACE FUNCTION public.take_down_role(
  p_actor_id TEXT,
  p_actor_name TEXT,
  p_job_id TEXT,
  p_reason TEXT,
  p_ip TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_job_title TEXT := 'Role';
  v_log_id TEXT;
BEGIN
  -- Validate reason (minimum 10 characters)
  IF p_reason IS NULL OR length(trim(p_reason)) < 10 THEN
    RAISE EXCEPTION 'A valid reason of at least 10 characters is required for role takedown.';
  END IF;

  -- Deactivate in employer_jobs if exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employer_jobs') THEN
    UPDATE public.employer_jobs
    SET is_active = false, status = 'removed'
    WHERE id = p_job_id
    RETURNING job_title INTO v_job_title;
  END IF;

  -- Deactivate in remote_jobs if exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'remote_jobs') THEN
    UPDATE public.remote_jobs
    SET is_active = false, review_status = 'removed'
    WHERE id = p_job_id OR external_id = p_job_id;
  END IF;

  -- Atomically insert audit row
  v_log_id := 'log-' || substr(md5(random()::text), 1, 12);
  INSERT INTO public.audit_log (
    id, actor_id, actor_name, action, target_type, target_id, target_label,
    reason, before, after, ip, created_at
  ) VALUES (
    v_log_id, p_actor_id, p_actor_name, 'JOB_TAKEDOWN', 'JOB', p_job_id, COALESCE(v_job_title, p_job_id),
    p_reason,
    jsonb_build_object('is_active', true),
    jsonb_build_object('is_active', false, 'status', 'removed'),
    p_ip,
    timezone('utc'::text, now())
  );

  RETURN jsonb_build_object('success', true, 'log_id', v_log_id, 'job_id', p_job_id);
END;
$$;

-- Alias
CREATE OR REPLACE FUNCTION public.rpc_admin_takedown_role(
  p_actor_id TEXT,
  p_actor_name TEXT,
  p_job_id TEXT,
  p_reason TEXT,
  p_ip TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN public.take_down_role(p_actor_id, p_actor_name, p_job_id, p_reason, p_ip);
END;
$$;

REVOKE ALL ON FUNCTION public.take_down_role FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.take_down_role TO service_role;
REVOKE ALL ON FUNCTION public.rpc_admin_takedown_role FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_admin_takedown_role TO service_role;


-- 4. suspend_user
CREATE OR REPLACE FUNCTION public.suspend_user(
  p_actor_id TEXT,
  p_actor_name TEXT,
  p_target_user_id TEXT,
  p_new_status TEXT,
  p_reason TEXT,
  p_ip TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_log_id TEXT;
  v_action TEXT;
  v_prev_status TEXT := 'ACTIVE';
BEGIN
  -- Validate reason (minimum 10 characters)
  IF p_reason IS NULL OR length(trim(p_reason)) < 10 THEN
    RAISE EXCEPTION 'A valid reason of at least 10 characters is required.';
  END IF;

  -- Block self-suspension
  IF p_actor_id = p_target_user_id AND p_new_status = 'SUSPENDED' THEN
    RAISE EXCEPTION 'Self-suspension is prohibited. You cannot suspend your own account.';
  END IF;

  v_action := CASE WHEN p_new_status = 'SUSPENDED' THEN 'USER_SUSPENDED' ELSE 'USER_RESTORED' END;

  -- Update profiles if exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    SELECT status INTO v_prev_status FROM public.profiles WHERE id::text = p_target_user_id;
    UPDATE public.profiles
    SET status = p_new_status
    WHERE id::text = p_target_user_id;
  END IF;

  -- Atomically insert audit row
  v_log_id := 'log-' || substr(md5(random()::text), 1, 12);
  INSERT INTO public.audit_log (
    id, actor_id, actor_name, action, target_type, target_id, target_label,
    reason, before, after, ip, created_at
  ) VALUES (
    v_log_id, p_actor_id, p_actor_name, v_action, 'USER', p_target_user_id, p_target_user_id,
    p_reason,
    jsonb_build_object('status', COALESCE(v_prev_status, 'ACTIVE')),
    jsonb_build_object('status', p_new_status),
    p_ip,
    timezone('utc'::text, now())
  );

  RETURN jsonb_build_object('success', true, 'log_id', v_log_id, 'status', p_new_status);
END;
$$;

-- Alias
CREATE OR REPLACE FUNCTION public.rpc_admin_suspend_user(
  p_actor_id TEXT,
  p_actor_name TEXT,
  p_target_user_id TEXT,
  p_new_status TEXT,
  p_reason TEXT,
  p_ip TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN public.suspend_user(p_actor_id, p_actor_name, p_target_user_id, p_new_status, p_reason, p_ip);
END;
$$;

REVOKE ALL ON FUNCTION public.suspend_user FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.suspend_user TO service_role;
REVOKE ALL ON FUNCTION public.rpc_admin_suspend_user FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_admin_suspend_user TO service_role;


-- 5. trigger_crawler_run
CREATE OR REPLACE FUNCTION public.trigger_crawler_run(
  p_actor_id TEXT,
  p_actor_name TEXT,
  p_source TEXT,
  p_category TEXT,
  p_reason TEXT,
  p_jobs_count INTEGER DEFAULT 0,
  p_ip TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_log_id TEXT;
BEGIN
  -- Validate reason (minimum 10 characters)
  IF p_reason IS NULL OR length(trim(p_reason)) < 10 THEN
    RAISE EXCEPTION 'A valid reason of at least 10 characters is required to trigger the crawler.';
  END IF;

  -- Atomically insert audit row
  v_log_id := 'log-' || substr(md5(random()::text), 1, 12);
  INSERT INTO public.audit_log (
    id, actor_id, actor_name, action, target_type, target_id, target_label,
    reason, before, after, ip, created_at
  ) VALUES (
    v_log_id, p_actor_id, p_actor_name, 'TRIGGER_CRAWLER', 'CRAWLER', p_source, p_source,
    p_reason,
    jsonb_build_object('source', p_source, 'category', p_category),
    jsonb_build_object('source', p_source, 'category', p_category, 'status', 'needs_review', 'jobs_crawled', p_jobs_count),
    p_ip,
    timezone('utc'::text, now())
  );

  RETURN jsonb_build_object('success', true, 'log_id', v_log_id, 'jobs_crawled', p_jobs_count);
END;
$$;

-- Alias
CREATE OR REPLACE FUNCTION public.rpc_admin_log_crawler_run(
  p_actor_id TEXT,
  p_actor_name TEXT,
  p_source TEXT,
  p_category TEXT,
  p_reason TEXT,
  p_jobs_count INTEGER DEFAULT 0,
  p_ip TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN public.trigger_crawler_run(p_actor_id, p_actor_name, p_source, p_category, p_reason, p_jobs_count, p_ip);
END;
$$;

REVOKE ALL ON FUNCTION public.trigger_crawler_run FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_crawler_run TO service_role;
REVOKE ALL ON FUNCTION public.rpc_admin_log_crawler_run FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_admin_log_crawler_run TO service_role;
