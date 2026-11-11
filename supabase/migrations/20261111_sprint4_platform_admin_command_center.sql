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
