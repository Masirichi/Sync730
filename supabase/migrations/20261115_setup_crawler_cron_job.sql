-- ==============================================================================
-- Migration: 20261115_setup_crawler_cron_job.sql
-- Description: Configures Supabase pg_cron and pg_net integrations to automatically
--              execute the multi-source job ingestion crawler (/api/cron/crawl-jobs)
--              every 6 hours and perform daily stale role verification maintenance.
-- ==============================================================================

-- 1. Enable required PostgreSQL extensions in Supabase
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Grant execution privileges on the cron schema to postgres and service_role
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- 2. Define helper function to trigger the crawler endpoint via pg_net
CREATE OR REPLACE FUNCTION public.invoke_crawl_jobs(
  p_secret TEXT DEFAULT NULL,
  p_base_url TEXT DEFAULT 'https://sync730.vercel.app'
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = extensions, net, public
AS $$
DECLARE
  v_secret TEXT;
  v_url TEXT;
  v_request_id BIGINT;
BEGIN
  -- Determine authorization secret (Parameter > DB Setting > empty)
  v_secret := COALESCE(
    p_secret,
    NULLIF(current_setting('app.settings.cron_secret', true), ''),
    ''
  );

  -- Construct the endpoint URL with query secret fallback
  IF v_secret <> '' THEN
    v_url := rtrim(p_base_url, '/') || '/api/cron/crawl-jobs?secret=' || v_secret;
  ELSE
    v_url := rtrim(p_base_url, '/') || '/api/cron/crawl-jobs';
  END IF;

  -- Dispatch async HTTP POST request using pg_net
  SELECT net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'User-Agent', 'Supabase-pg_cron/Sync730-Ingestion',
      'Authorization', CASE WHEN v_secret <> '' THEN 'Bearer ' || v_secret ELSE '' END
    ),
    body := jsonb_build_object(
      'triggered_by', 'supabase_pg_cron',
      'timestamp', timezone('utc'::text, now())
    )
  ) INTO v_request_id;

  RETURN v_request_id;
END;
$$;

COMMENT ON FUNCTION public.invoke_crawl_jobs IS 'Triggers the Sync730 multi-source job crawler endpoint asynchronously via pg_net';

-- 3. Idempotently unschedule existing jobs before re-creating to prevent duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sync730-crawl-jobs-recurring') THEN
    PERFORM cron.unschedule('sync730-crawl-jobs-recurring');
  END IF;

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sync730-mark-stale-roles-daily') THEN
    PERFORM cron.unschedule('sync730-mark-stale-roles-daily');
  END IF;
END $$;

-- 4. Schedule Job Ingestion: Runs every 6 hours (00:00, 06:00, 12:00, 18:00 UTC)
-- To change to every 2 hours: '0 */2 * * *'
-- To change to once daily: '0 6 * * *'
SELECT cron.schedule(
  'sync730-crawl-jobs-recurring',
  '0 */6 * * *',
  $$SELECT public.invoke_crawl_jobs();$$
);

-- 5. Schedule Role Verification Maintenance: Runs daily at 03:00 UTC
-- Roles not re-verified within the 14-day freshness window are un-published automatically
SELECT cron.schedule(
  'sync730-mark-stale-roles-daily',
  '0 3 * * *',
  $$
  UPDATE public.remote_jobs
  SET is_active = false,
      updated_at = timezone('utc'::text, now())
  WHERE is_active = true
    AND role_verified_at IS NOT NULL
    AND role_verified_at < (timezone('utc'::text, now()) - INTERVAL '14 days');
  $$
);

-- ==============================================================================
-- MONITORING & OPERATIONAL QUERIES:
--
-- View all scheduled cron jobs:
--   SELECT jobid, jobname, schedule, command, nodename, active FROM cron.job;
--
-- View recent cron execution history and errors:
--   SELECT jobid, runid, job_pid, status, return_message, start_time, end_time 
--   FROM cron.job_run_details 
--   ORDER BY start_time DESC LIMIT 20;
--
-- View pg_net HTTP response status and payloads:
--   SELECT id, status_code, content, error_msg, created 
--   FROM net._http_response 
--   ORDER BY id DESC LIMIT 10;
--
-- Manually trigger a crawl right now via SQL:
--   SELECT public.invoke_crawl_jobs();
--
-- Configure your CRON_SECRET in Postgres settings (optional):
--   ALTER DATABASE postgres SET app.settings.cron_secret = 'your-secret-here';
-- ==============================================================================
