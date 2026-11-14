-- ==============================================================================
-- Schema: Demo Requests & Enterprise Interest (Strict RLS, No Public Read)
-- ==============================================================================

-- 1. DEMO REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.demo_requests (
  id TEXT PRIMARY KEY DEFAULT ('demo-' || substr(md5(random()::text), 1, 10)),
  name TEXT NOT NULL,
  work_email TEXT NOT NULL,
  company TEXT NOT NULL,
  company_size TEXT NOT NULL,
  roles_hiring_for TEXT NOT NULL,
  message TEXT,
  consent_given BOOLEAN NOT NULL DEFAULT true,
  ip_address TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONTACTED', 'COMPLETED', 'ARCHIVED')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_demo_requests_created_at ON public.demo_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_demo_requests_work_email ON public.demo_requests(work_email);

-- 2. ENTERPRISE INTEREST TABLE
CREATE TABLE IF NOT EXISTS public.enterprise_interest (
  id TEXT PRIMARY KEY DEFAULT ('ent-' || substr(md5(random()::text), 1, 10)),
  name TEXT NOT NULL,
  work_email TEXT NOT NULL,
  company TEXT NOT NULL,
  company_size TEXT NOT NULL,
  use_cases TEXT NOT NULL,
  message TEXT,
  consent_given BOOLEAN NOT NULL DEFAULT true,
  ip_address TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONTACTED', 'COMPLETED', 'ARCHIVED')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_enterprise_interest_created_at ON public.enterprise_interest(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enterprise_interest_work_email ON public.enterprise_interest(work_email);

-- 3. STRICT ROW-LEVEL SECURITY (RLS)
-- Rule: NO public read on either table. Only authenticated platform admins (or service role) can view.
ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_interest ENABLE ROW LEVEL SECURITY;

-- Deny all public reads explicitly
DROP POLICY IF EXISTS "Deny public select on demo_requests" ON public.demo_requests;
CREATE POLICY "Deny public select on demo_requests" ON public.demo_requests FOR SELECT USING (false);

-- Allow public inserts via rate-limited API handlers
DROP POLICY IF EXISTS "Allow public insert on demo_requests" ON public.demo_requests;
CREATE POLICY "Allow public insert on demo_requests" ON public.demo_requests FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Deny public select on enterprise_interest" ON public.enterprise_interest;
CREATE POLICY "Deny public select on enterprise_interest" ON public.enterprise_interest FOR SELECT USING (false);

DROP POLICY IF EXISTS "Allow public insert on enterprise_interest" ON public.enterprise_interest;
CREATE POLICY "Allow public insert on enterprise_interest" ON public.enterprise_interest FOR INSERT WITH CHECK (true);
