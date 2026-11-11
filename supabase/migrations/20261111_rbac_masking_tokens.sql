-- ==============================================================================
-- Sync730 Hub: Role Isolation, Token Unlocks & Candidate Privacy Masking
-- ==============================================================================

-- 1. Ensure user_profiles View/Compatibility with Profiles
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT 
  id,
  email,
  full_name,
  role,
  avatar_url,
  phone,
  headline,
  bio,
  location,
  created_at,
  updated_at
FROM public.profiles;

-- 2. Token Unlocks Table (Recruiter Candidate Masking / Unlock Mechanism)
CREATE TABLE IF NOT EXISTS public.token_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tokens_spent INTEGER NOT NULL DEFAULT 1 CHECK (tokens_spent > 0),
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_recruiter_candidate_unlock UNIQUE (recruiter_id, candidate_id)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_token_unlocks_recruiter ON public.token_unlocks(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_token_unlocks_candidate ON public.token_unlocks(candidate_id);
CREATE INDEX IF NOT EXISTS idx_token_unlocks_active ON public.token_unlocks(recruiter_id, candidate_id, is_active);

-- Enable RLS on token_unlocks
ALTER TABLE public.token_unlocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Recruiters can view their own unlocks" ON public.token_unlocks;
CREATE POLICY "Recruiters can view their own unlocks"
  ON public.token_unlocks FOR SELECT
  TO authenticated
  USING (recruiter_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Recruiters can insert unlocks" ON public.token_unlocks;
CREATE POLICY "Recruiters can insert unlocks"
  ON public.token_unlocks FOR INSERT
  TO authenticated
  WITH CHECK (
    recruiter_id = auth.uid() 
    AND (public.is_recruiter() OR public.is_admin())
  );

-- 3. Masked Candidate View for Recruiter Queries (Enforcing is_masked = TRUE by default)
CREATE OR REPLACE VIEW public.recruiter_candidates_masked AS
SELECT 
  p.id,
  CASE 
    WHEN tu.is_active = true OR p.id = auth.uid() OR public.is_admin() THEN false 
    ELSE true 
  END AS is_masked,
  CASE 
    WHEN tu.is_active = true OR p.id = auth.uid() OR public.is_admin() THEN p.full_name 
    ELSE 'Candidate #' || UPPER(SUBSTRING(p.id::text, 1, 6))
  END AS display_name,
  CASE 
    WHEN tu.is_active = true OR p.id = auth.uid() OR public.is_admin() THEN p.email 
    ELSE 'masked@sync730.com'
  END AS display_email,
  CASE 
    WHEN tu.is_active = true OR p.id = auth.uid() OR public.is_admin() THEN p.phone 
    ELSE NULL 
  END AS display_phone,
  p.role,
  p.headline,
  p.bio,
  p.location,
  CASE 
    WHEN tu.is_active = true OR p.id = auth.uid() OR public.is_admin() THEN p.avatar_url 
    ELSE NULL 
  END AS avatar_url,
  p.created_at,
  COALESCE(tu.is_active, false) AS is_unlocked
FROM public.profiles p
LEFT JOIN public.token_unlocks tu 
  ON tu.candidate_id = p.id 
  AND tu.recruiter_id = auth.uid() 
  AND tu.is_active = true
WHERE p.role = 'candidate';

-- 4. Unlock Candidate Stored Procedure
CREATE OR REPLACE FUNCTION public.unlock_candidate(target_candidate_id UUID, token_cost INTEGER DEFAULT 1)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recruiter_id UUID;
  v_existing_unlock UUID;
  v_result JSONB;
BEGIN
  v_recruiter_id := auth.uid();
  
  IF v_recruiter_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Ensure caller is recruiter or admin
  IF NOT (public.is_recruiter() OR public.is_admin()) THEN
    RAISE EXCEPTION 'Only recruiters or admins can unlock candidate profiles';
  END IF;

  -- Check if already unlocked
  SELECT id INTO v_existing_unlock
  FROM public.token_unlocks
  WHERE recruiter_id = v_recruiter_id AND candidate_id = target_candidate_id AND is_active = true;

  IF v_existing_unlock IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_unlocked', true,
      'unlock_id', v_existing_unlock
    );
  END IF;

  -- Insert token unlock record
  INSERT INTO public.token_unlocks (
    recruiter_id,
    candidate_id,
    tokens_spent,
    is_active
  ) VALUES (
    v_recruiter_id,
    target_candidate_id,
    token_cost,
    true
  )
  ON CONFLICT (recruiter_id, candidate_id)
  DO UPDATE SET
    is_active = true,
    unlocked_at = timezone('utc'::text, now()),
    tokens_spent = public.token_unlocks.tokens_spent + token_cost
  RETURNING id INTO v_existing_unlock;

  -- Audit log record
  INSERT INTO public.audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    metadata
  ) VALUES (
    v_recruiter_id,
    'candidate_profile_unlocked',
    'candidate',
    target_candidate_id::text,
    jsonb_build_object('tokens_spent', token_cost)
  );

  RETURN jsonb_build_object(
    'success', true,
    'already_unlocked', false,
    'unlock_id', v_existing_unlock
  );
END;
$$;
