-- Set up Stager test user with admin access and pro subscription
-- This is for staging environment testing only

-- First, let's update the full_name in profiles for stager user if it exists
UPDATE public.profiles 
SET 
  full_name = 'Stager',
  subscription_tier = 'pro',
  subscription_end = now() + interval '1 year'
WHERE email = 'anderslundoy@protonmail.com';

-- Insert admin role for stager user (if user exists)
-- We'll use a function to safely insert the role
DO $$
DECLARE
  stager_user_id uuid;
BEGIN
  -- Get the user ID for stager from auth.users
  SELECT id INTO stager_user_id 
  FROM auth.users 
  WHERE email = 'anderslundoy@protonmail.com' 
  LIMIT 1;
  
  -- If user exists, give them admin role
  IF stager_user_id IS NOT NULL THEN
    -- Insert admin role (ignore if already exists)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (stager_user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Log this action
    INSERT INTO public.audit_log (
      table_name, action, user_id, details
    ) VALUES (
      'user_roles', 'STAGING_ADMIN_SETUP', stager_user_id,
      jsonb_build_object(
        'staging_setup', true,
        'role_granted', 'admin',
        'subscription_tier', 'pro',
        'setup_timestamp', now(),
        'environment', 'staging'
      )
    );
  END IF;
END $$;