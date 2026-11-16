-- supabase/migrations/20261116_phase2_trustworthy_metrics_and_demo_flag.sql
-- Phase 2: Make every number trustworthy. Add is_demo markers and backfill.

-- 1. Add is_demo column to corporate_workspaces
ALTER TABLE IF EXISTS public.corporate_workspaces
ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;

-- 2. Add is_demo column to remote_jobs
ALTER TABLE IF EXISTS public.remote_jobs
ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;

-- 3. Add is_demo column to employer_jobs
ALTER TABLE IF EXISTS public.employer_jobs
ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;

-- 4. Add is_demo column to profiles
ALTER TABLE IF EXISTS public.profiles
ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;

-- 5. Add is_demo column to platform_transactions
ALTER TABLE IF EXISTS public.platform_transactions
ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;

-- 6. Add is_demo column to video_assessments
ALTER TABLE IF EXISTS public.video_assessments
ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;

-- 7. Add index for efficient filtering on live metrics
CREATE INDEX IF NOT EXISTS idx_corporate_workspaces_is_demo ON public.corporate_workspaces(is_demo);
CREATE INDEX IF NOT EXISTS idx_remote_jobs_is_demo ON public.remote_jobs(is_demo);
CREATE INDEX IF NOT EXISTS idx_platform_transactions_is_demo ON public.platform_transactions(is_demo);

-- 8. Backfill Workspaces: ws-sync730-demo, TEST CORP
UPDATE public.corporate_workspaces
SET is_demo = true
WHERE id = 'ws-sync730-demo'
   OR company_name ILIKE '%TEST CORP%'
   OR company_name ILIKE '%test%';

-- 9. Backfill Jobs: ws-sync730-demo, TEST CORP, $0 salary, titles with "Test"
UPDATE public.remote_jobs
SET is_demo = true
WHERE workspace_id = 'ws-sync730-demo'
   OR company ILIKE '%TEST CORP%'
   OR company ILIKE '%test%'
   OR title ILIKE '%test%'
   OR salary = '$0'
   OR salary = '0'
   OR salary = '0 USD'
   OR salary_max = 0;

UPDATE public.employer_jobs
SET is_demo = true
WHERE workspace_id = 'ws-sync730-demo'
   OR job_title ILIKE '%test%'
   OR salary_max = 0;

-- 10. Backfill Transactions: ws-sync730-demo, Mock Fees (MOCK_PREP_FEE)
UPDATE public.platform_transactions
SET is_demo = true
WHERE workspace_id = 'ws-sync730-demo'
   OR transaction_type = 'MOCK_PREP_FEE'
   OR notes ILIKE '%mock%'
   OR notes ILIKE '%test%';

-- 11. Backfill Profiles & Assessments
UPDATE public.profiles
SET is_demo = true
WHERE email ILIKE '%@test.%'
   OR email ILIKE '%@example.%'
   OR email ILIKE '%demo%';

UPDATE public.video_assessments
SET is_demo = true
WHERE candidate_id ILIKE '%test%'
   OR target_role ILIKE '%test%';
