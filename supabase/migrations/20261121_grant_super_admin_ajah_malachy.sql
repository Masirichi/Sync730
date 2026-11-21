-- ==============================================================================
-- Migration: 20261121_grant_super_admin_ajah_malachy.sql
-- Assigns actual Platform Super Admin Manager access to ajahmalachy@gmail.com
-- ==============================================================================

-- 1. Ensure admin_roles table exists
CREATE TABLE IF NOT EXISTS public.admin_roles (
  user_id TEXT PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'super_admin' CHECK (role IN ('super_admin', 'moderator', 'vetting_reviewer', 'finance', 'support')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 2. Update existing auth.users record if ajahmalachy@gmail.com exists
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'ajahmalachy@gmail.com' LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    -- Update auth.users raw metadata
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{role}',
      '"PLATFORM_ADMIN"'
    ),
    raw_app_meta_data = jsonb_set(
      COALESCE(raw_app_meta_data, '{}'::jsonb),
      '{role}',
      '"PLATFORM_ADMIN"'
    )
    WHERE id = v_user_id;

    -- Upsert profile with admin role
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (v_user_id, 'ajahmalachy@gmail.com', 'Ajah Malachy', 'admin')
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin',
        full_name = 'Ajah Malachy',
        email = 'ajahmalachy@gmail.com';

    -- Upsert admin_roles with super_admin role
    INSERT INTO public.admin_roles (user_id, role, updated_at)
    VALUES (v_user_id::text, 'super_admin', now())
    ON CONFLICT (user_id) DO UPDATE
    SET role = 'super_admin',
        updated_at = now();
  END IF;
END $$;

-- 3. Also insert by email into admin_roles for text-based ID fallback
INSERT INTO public.admin_roles (user_id, role, updated_at)
VALUES ('ajahmalachy@gmail.com', 'super_admin', now())
ON CONFLICT (user_id) DO UPDATE
SET role = 'super_admin',
    updated_at = now();

-- 4. Update the handle_new_user trigger so ANY future signup with ajahmalachy@gmail.com automatically becomes Super Admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  IF lower(NEW.email) = 'ajahmalachy@gmail.com' THEN
    v_role := 'admin';

    -- Ensure admin_roles record exists
    INSERT INTO public.admin_roles (user_id, role, updated_at)
    VALUES (NEW.id::text, 'super_admin', now())
    ON CONFLICT (user_id) DO UPDATE
    SET role = 'super_admin',
        updated_at = now();

    -- Also update user metadata
    NEW.raw_user_meta_data = jsonb_set(
      COALESCE(NEW.raw_user_meta_data, '{}'::jsonb),
      '{role}',
      '"PLATFORM_ADMIN"'
    );
  ELSE
    v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'candidate');
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    v_role,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
  SET role = v_role,
      full_name = EXCLUDED.full_name;

  RETURN NEW;
END;
$$;
