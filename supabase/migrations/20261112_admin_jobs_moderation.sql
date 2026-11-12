-- ==============================================================================
-- Migration: 20261112_admin_jobs_moderation.sql
-- Description: Adds moderation controls, active state, and featured pinning for remote & employer jobs
-- ==============================================================================

-- 1. Extend remote_jobs table
ALTER TABLE IF EXISTS public.remote_jobs 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'CRAWLER';

-- Index for performant querying of featured and active candidate jobs
CREATE INDEX IF NOT EXISTS idx_remote_jobs_active_featured ON public.remote_jobs (is_active, is_featured DESC, published_at DESC);

-- 2. Extend employer_jobs table
ALTER TABLE IF EXISTS public.employer_jobs
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. Policy update for Platform Admins to insert and update remote_jobs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'remote_jobs' 
    AND policyname = 'Admins can manage all remote_jobs'
  ) THEN
    CREATE POLICY "Admins can manage all remote_jobs" 
    ON public.remote_jobs
    FOR ALL
    USING (
      auth.role() = 'service_role' OR 
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.id = auth.uid()
        AND (user_profiles.role = 'PLATFORM_ADMIN' OR user_profiles.role = 'admin')
      )
    )
    WITH CHECK (
      auth.role() = 'service_role' OR 
      EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.id = auth.uid()
        AND (user_profiles.role = 'PLATFORM_ADMIN' OR user_profiles.role = 'admin')
      )
    );
  END IF;
END $$;
