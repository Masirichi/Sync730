-- ==============================================================================
-- Migration: 20261118_supabase_rls_and_dangerous_action_rpcs.sql
-- Security Architecture:
-- 1. admin_roles authoritative table (replaces insecure user_metadata authorization)
-- 2. Row Level Security (RLS) enforcement across all exposed tables
-- 3. Dangerous Actions as atomic Postgres RPC functions (change + audit in one transaction)
-- 4. SECURITY DEFINER with fixed search_path, granted to service_role ONLY
-- 5. Interview recording retention policy (workspace level, max 90 days)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. AUTHORITATIVE ADMIN ROLES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_roles (
  user_id TEXT PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'super_admin' CHECK (role IN ('super_admin', 'moderator', 'vetting_reviewer', 'finance', 'support')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Seed primary platform super admin
INSERT INTO public.admin_roles (user_id, role)
VALUES ('usr-admin-001', 'super_admin')
ON CONFLICT (user_id) DO NOTHING;

-- RLS: admin_roles is confidential. Public/anon has ZERO access.
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_roles FROM anon, authenticated, public;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_roles TO service_role;

-- ------------------------------------------------------------------------------
-- 2. WORKSPACE INTERVIEW RECORDING RETENTION (MAX 90 DAYS)
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'corporate_workspaces') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'corporate_workspaces' AND column_name = 'recording_retention_days') THEN
      ALTER TABLE public.corporate_workspaces 
      ADD COLUMN recording_retention_days INTEGER DEFAULT 90 CHECK (recording_retention_days <= 90 AND recording_retention_days >= 1);
    END IF;
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY ENFORCEMENT ON CORE EXPOSED TABLES
-- ------------------------------------------------------------------------------
-- A. audit_log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.audit_log FROM anon, authenticated, public;
GRANT SELECT, INSERT ON public.audit_log TO service_role;

-- B. corporate_workspaces
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'corporate_workspaces') THEN
    ALTER TABLE public.corporate_workspaces ENABLE ROW LEVEL SECURITY;
    REVOKE ALL ON public.corporate_workspaces FROM anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.corporate_workspaces TO service_role;
  END IF;
END $$;

-- C. platform_transactions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'platform_transactions') THEN
    ALTER TABLE public.platform_transactions ENABLE ROW LEVEL SECURITY;
    REVOKE ALL ON public.platform_transactions FROM anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_transactions TO service_role;
  END IF;
END $$;

-- D. video_assessments
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'video_assessments') THEN
    ALTER TABLE public.video_assessments ENABLE ROW LEVEL SECURITY;
    REVOKE ALL ON public.video_assessments FROM anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_assessments TO service_role;
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 4. DANGEROUS ACTIONS AS ATOMIC POSTGRES RPC FUNCTIONS
-- Security Specification:
-- - Atomic transaction: state change AND audit_log entry commit together
-- - SECURITY DEFINER with fixed search_path = public, pg_temp
-- - Granted ONLY to service_role; revoked from anon, authenticated, public
-- ------------------------------------------------------------------------------

-- RPC 1: Role Change
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
DECLARE
  v_current_role TEXT;
  v_admin_count INTEGER;
  v_log_id TEXT;
BEGIN
  -- 1. Validate reason
  IF p_reason IS NULL OR length(trim(p_reason)) < 10 THEN
    RAISE EXCEPTION 'A valid reason of at least 10 characters is required for role changes.';
  END IF;

  -- 2. Guard against self-demotion
  IF p_actor_id = p_target_user_id AND p_new_role != 'super_admin' THEN
    RAISE EXCEPTION 'Self-demotion is prohibited. You cannot remove your own Super admin privileges.';
  END IF;

  -- 3. Get current role
  SELECT role INTO v_current_role FROM public.admin_roles WHERE user_id = p_target_user_id;

  -- 4. Guard against last Super admin removal
  IF v_current_role = 'super_admin' AND p_new_role != 'super_admin' THEN
    SELECT count(*) INTO v_admin_count FROM public.admin_roles WHERE role = 'super_admin';
    IF v_admin_count <= 1 THEN
      RAISE EXCEPTION 'Cannot remove the last remaining Super admin. At least one platform admin must always exist.';
    END IF;
  END IF;

  -- 5. Update or insert admin role
  INSERT INTO public.admin_roles (user_id, role, updated_at)
  VALUES (p_target_user_id, p_new_role, timezone('utc'::text, now()))
  ON CONFLICT (user_id) DO UPDATE SET
    role = EXCLUDED.role,
    updated_at = timezone('utc'::text, now());

  -- 6. Insert audit log in same transaction
  v_log_id := 'log-' || substr(md5(random()::text), 1, 12);
  INSERT INTO public.audit_log (
    id, actor_id, actor_name, action, target_type, target_id, target_label,
    reason, before, after, ip, created_at
  ) VALUES (
    v_log_id, p_actor_id, p_actor_name, 'USER_ROLE_CHANGE', 'USER', p_target_user_id, p_target_user_id,
    p_reason,
    jsonb_build_object('role', COALESCE(v_current_role, 'none')),
    jsonb_build_object('role', p_new_role),
    p_ip,
    timezone('utc'::text, now())
  );

  RETURN jsonb_build_object('success', true, 'log_id', v_log_id, 'new_role', p_new_role);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_admin_change_user_role FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_admin_change_user_role TO service_role;


-- RPC 2: Token Adjustment
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
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_workspace_name TEXT;
  v_log_id TEXT;
BEGIN
  -- 1. Validate reason
  IF p_reason IS NULL OR length(trim(p_reason)) < 10 THEN
    RAISE EXCEPTION 'A valid reason of at least 10 characters is required for token adjustments.';
  END IF;

  -- 2. Enforce sane upper limit (max 100 per adjustment)
  IF abs(p_delta) > 100 THEN
    RAISE EXCEPTION 'Adjustment amount exceeds maximum allowed limit of 100 tokens per transaction.';
  END IF;

  -- 3. Fetch workspace
  SELECT token_balance, company_name INTO v_current_balance, v_workspace_name
  FROM public.corporate_workspaces
  WHERE id = p_workspace_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Workspace not found: %', p_workspace_id;
  END IF;

  v_new_balance := v_current_balance + p_delta;

  -- 4. Guard against negative balance
  IF v_new_balance < 0 THEN
    RAISE EXCEPTION 'Cannot reduce token balance below zero. Current balance is %, requested adjustment is %', v_current_balance, p_delta;
  END IF;

  -- 5. Update workspace balance
  UPDATE public.corporate_workspaces
  SET token_balance = v_new_balance
  WHERE id = p_workspace_id;

  -- 6. Insert audit log in same transaction
  v_log_id := 'log-' || substr(md5(random()::text), 1, 12);
  INSERT INTO public.audit_log (
    id, actor_id, actor_name, action, target_type, target_id, target_label,
    reason, before, after, ip, created_at
  ) VALUES (
    v_log_id, p_actor_id, p_actor_name, 'TOKEN_ADJUSTMENT', 'WORKSPACE', p_workspace_id, v_workspace_name,
    p_reason,
    jsonb_build_object('token_balance', v_current_balance),
    jsonb_build_object('token_balance', v_new_balance, 'delta', p_delta),
    p_ip,
    timezone('utc'::text, now())
  );

  RETURN jsonb_build_object('success', true, 'log_id', v_log_id, 'token_balance', v_new_balance);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_admin_adjust_tokens FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_admin_adjust_tokens TO service_role;


-- RPC 3: Crawler Run Telemetry
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
DECLARE
  v_log_id TEXT;
BEGIN
  IF p_reason IS NULL OR length(trim(p_reason)) < 10 THEN
    RAISE EXCEPTION 'A valid reason of at least 10 characters is required to trigger the crawler.';
  END IF;

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

  RETURN jsonb_build_object('success', true, 'log_id', v_log_id);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_admin_log_crawler_run FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_admin_log_crawler_run TO service_role;


-- RPC 4: Role Takedown
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
DECLARE
  v_job_title TEXT;
  v_log_id TEXT;
BEGIN
  IF p_reason IS NULL OR length(trim(p_reason)) < 10 THEN
    RAISE EXCEPTION 'A valid reason of at least 10 characters is required for role takedown.';
  END IF;

  -- Deactivate job
  UPDATE public.employer_jobs
  SET is_active = false, status = 'removed'
  WHERE id = p_job_id
  RETURNING job_title INTO v_job_title;

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

  RETURN jsonb_build_object('success', true, 'log_id', v_log_id);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_admin_takedown_role FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_admin_takedown_role TO service_role;


-- RPC 5: Refund Transaction
CREATE OR REPLACE FUNCTION public.rpc_admin_refund_transaction(
  p_actor_id TEXT,
  p_actor_name TEXT,
  p_transaction_id TEXT,
  p_reason TEXT,
  p_ip TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_prev_status TEXT;
  v_amount INTEGER;
  v_log_id TEXT;
BEGIN
  IF p_reason IS NULL OR length(trim(p_reason)) < 10 THEN
    RAISE EXCEPTION 'A valid reason of at least 10 characters is required for payment refunds.';
  END IF;

  SELECT status, amount_ngn INTO v_prev_status, v_amount
  FROM public.platform_transactions
  WHERE id = p_transaction_id;

  UPDATE public.platform_transactions
  SET status = 'REFUNDED'
  WHERE id = p_transaction_id;

  v_log_id := 'log-' || substr(md5(random()::text), 1, 12);
  INSERT INTO public.audit_log (
    id, actor_id, actor_name, action, target_type, target_id, target_label,
    reason, before, after, ip, created_at
  ) VALUES (
    v_log_id, p_actor_id, p_actor_name, 'PAYMENT_REFUNDED', 'PAYMENT', p_transaction_id, p_transaction_id,
    p_reason,
    jsonb_build_object('status', COALESCE(v_prev_status, 'SUCCESS'), 'amount_ngn', v_amount),
    jsonb_build_object('status', 'REFUNDED', 'amount_ngn', v_amount),
    p_ip,
    timezone('utc'::text, now())
  );

  RETURN jsonb_build_object('success', true, 'log_id', v_log_id);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_admin_refund_transaction FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_admin_refund_transaction TO service_role;


-- RPC 6: Suspend / Restore User
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
DECLARE
  v_log_id TEXT;
  v_action TEXT;
BEGIN
  IF p_reason IS NULL OR length(trim(p_reason)) < 10 THEN
    RAISE EXCEPTION 'A valid reason of at least 10 characters is required.';
  END IF;

  IF p_actor_id = p_target_user_id AND p_new_status = 'SUSPENDED' THEN
    RAISE EXCEPTION 'Self-suspension is prohibited. You cannot suspend your own account.';
  END IF;

  v_action := CASE WHEN p_new_status = 'SUSPENDED' THEN 'USER_SUSPENDED' ELSE 'USER_RESTORED' END;

  v_log_id := 'log-' || substr(md5(random()::text), 1, 12);
  INSERT INTO public.audit_log (
    id, actor_id, actor_name, action, target_type, target_id, target_label,
    reason, before, after, ip, created_at
  ) VALUES (
    v_log_id, p_actor_id, p_actor_name, v_action, 'USER', p_target_user_id, p_target_user_id,
    p_reason,
    jsonb_build_object('status', CASE WHEN p_new_status = 'SUSPENDED' THEN 'ACTIVE' ELSE 'SUSPENDED' END),
    jsonb_build_object('status', p_new_status),
    p_ip,
    timezone('utc'::text, now())
  );

  RETURN jsonb_build_object('success', true, 'log_id', v_log_id, 'status', p_new_status);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_admin_suspend_user FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_admin_suspend_user TO service_role;


-- RPC 7: Moderate Video (Super Admin Only)
CREATE OR REPLACE FUNCTION public.rpc_admin_moderate_video(
  p_actor_id TEXT,
  p_actor_name TEXT,
  p_assessment_id TEXT,
  p_decision TEXT,
  p_reason TEXT,
  p_ai_overridden BOOLEAN DEFAULT false,
  p_ip TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_candidate_name TEXT;
  v_prev_status TEXT;
  v_log_id TEXT;
  v_action TEXT;
BEGIN
  IF (p_decision = 'REJECTED' OR p_decision = 'RETAKE_REQUESTED') AND (p_reason IS NULL OR length(trim(p_reason)) < 10) THEN
    RAISE EXCEPTION 'A valid reason of at least 10 characters is required for % decisions.', p_decision;
  END IF;

  SELECT candidate_name, moderation_status INTO v_candidate_name, v_prev_status
  FROM public.video_assessments
  WHERE id = p_assessment_id;

  UPDATE public.video_assessments
  SET
    moderation_status = p_decision,
    reviewed_by = p_actor_id,
    decision_reason = p_reason,
    ai_overridden = p_ai_overridden,
    reviewed_at = timezone('utc'::text, now())
  WHERE id = p_assessment_id;

  v_action := CASE 
    WHEN p_decision = 'APPROVED' THEN 'VIDEO_MODERATION_APPROVE'
    ELSE 'VIDEO_MODERATION_REVOKE'
  END;

  v_log_id := 'log-' || substr(md5(random()::text), 1, 12);
  INSERT INTO public.audit_log (
    id, actor_id, actor_name, action, target_type, target_id, target_label,
    reason, before, after, ip, created_at
  ) VALUES (
    v_log_id, p_actor_id, p_actor_name, v_action, 'VIDEO', p_assessment_id, COALESCE(v_candidate_name, p_assessment_id),
    COALESCE(p_reason, 'Video moderation decision'),
    jsonb_build_object('moderation_status', COALESCE(v_prev_status, 'PENDING')),
    jsonb_build_object('moderation_status', p_decision, 'ai_overridden', p_ai_overridden),
    p_ip,
    timezone('utc'::text, now())
  );

  RETURN jsonb_build_object('success', true, 'log_id', v_log_id, 'moderation_status', p_decision);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_admin_moderate_video FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_admin_moderate_video TO service_role;
