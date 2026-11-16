-- ==============================================================================
-- Migration: 20261116_phase1_safe_dangerous_actions.sql
-- Phase 1: Make dangerous actions safe with append-only audit logs & server-side enforcement
-- ==============================================================================

-- 1. Create append-only audit_log table
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

-- 2. Indexes for audit log querying & performance
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor_id ON public.audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_target ON public.audit_log(target_type, target_id);

-- 3. Row Level Security: Append-Only (No UPDATE or DELETE)
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow platform admins to read audit logs" ON public.audit_log;
CREATE POLICY "Allow platform admins to read audit logs"
  ON public.audit_log FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow platform admins to insert audit logs" ON public.audit_log;
CREATE POLICY "Allow platform admins to insert audit logs"
  ON public.audit_log FOR INSERT
  WITH CHECK (true);

-- 4. Database Trigger: strictly forbid any UPDATE or DELETE on audit_log
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
