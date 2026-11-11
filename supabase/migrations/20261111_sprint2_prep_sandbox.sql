-- ==============================================================================
-- Sprint 2: Paid B2C AI Mock Video Interview Sandbox (Paystack & Feedback)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.mock_prep_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_role TEXT NOT NULL,
  company_name TEXT,
  amount INTEGER NOT NULL DEFAULT 250000, -- 250,000 kobo = ₦2,500
  currency TEXT NOT NULL DEFAULT 'NGN',
  payment_reference TEXT UNIQUE,
  payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'COMPLETED', 'FAILED', 'BYPASSED')),
  interview_questions JSONB DEFAULT '[]'::jsonb,
  candidate_answers JSONB DEFAULT '[]'::jsonb,
  feedback_payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mock_prep_candidate_id ON public.mock_prep_sessions(candidate_id);
CREATE INDEX IF NOT EXISTS idx_mock_prep_payment_reference ON public.mock_prep_sessions(payment_reference);
CREATE INDEX IF NOT EXISTS idx_mock_prep_payment_status ON public.mock_prep_sessions(payment_status);

-- Enable RLS
ALTER TABLE public.mock_prep_sessions ENABLE ROW LEVEL SECURITY;

-- Candidates can view and manage their own mock prep sessions
DROP POLICY IF EXISTS "Candidates can manage their own mock prep sessions" ON public.mock_prep_sessions;
CREATE POLICY "Candidates can manage their own mock prep sessions"
  ON public.mock_prep_sessions FOR ALL
  TO authenticated
  USING (candidate_id = auth.uid() OR candidate_id IS NULL OR public.is_admin())
  WITH CHECK (candidate_id = auth.uid() OR candidate_id IS NULL OR public.is_admin());

-- Allow anonymous or service role insert/select for demo test bypass and initial paystack callbacks
DROP POLICY IF EXISTS "Allow anon insert and select for mock sessions" ON public.mock_prep_sessions;
CREATE POLICY "Allow anon insert and select for mock sessions"
  ON public.mock_prep_sessions FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
