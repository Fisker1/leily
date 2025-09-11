-- Final security fix: Complete search_path configuration for all remaining functions
-- Check and fix any remaining functions without proper search_path

-- Update functions that may still be missing search_path
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::app_role);
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.promote_user_to_admin(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  is_caller_admin boolean;
BEGIN
  -- Check if caller is admin
  SELECT has_role(auth.uid(), 'admin'::app_role) INTO is_caller_admin;
  
  IF NOT is_caller_admin THEN
    RAISE EXCEPTION 'Only administrators can promote users';
  END IF;
  
  -- Insert admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Log the promotion
  INSERT INTO public.audit_log (
    table_name, 
    action, 
    user_id, 
    details
  ) VALUES (
    'user_roles',
    'user_promoted_to_admin',
    auth.uid(),
    jsonb_build_object('target_user_id', target_user_id, 'timestamp', now())
  );
  
  RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.promote_user_to_ambassador(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  is_caller_admin boolean;
BEGIN
  -- Check if caller is admin
  SELECT has_role(auth.uid(), 'admin'::app_role) INTO is_caller_admin;
  
  IF NOT is_caller_admin THEN
    RAISE EXCEPTION 'Only administrators can promote users to ambassadors';
  END IF;
  
  -- Insert ambassador role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'ambassador'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Update user profile to premium subscription with extended end date (1 year from now)
  UPDATE public.profiles
  SET 
    subscription_tier = 'premium',
    subscription_end = now() + interval '1 year'
  WHERE id = target_user_id;
  
  -- Log the promotion
  INSERT INTO public.audit_log (
    table_name, 
    action, 
    user_id, 
    details
  ) VALUES (
    'user_roles',
    'user_promoted_to_ambassador',
    auth.uid(),
    jsonb_build_object(
      'target_user_id', target_user_id, 
      'subscription_granted', 'premium',
      'subscription_end', now() + interval '1 year',
      'timestamp', now()
    )
  );
  
  RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Delete rate limit records older than 1 hour
  DELETE FROM public.rate_limits 
  WHERE window_start < now() - interval '1 hour';
END;
$function$;

-- Create security summary function
CREATE OR REPLACE FUNCTION public.get_security_status_summary()
RETURNS TABLE(
  security_feature text,
  status text,
  description text,
  requires_manual_config boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY VALUES
    ('Subscription Privilege Escalation Prevention', 'ACTIVE', 'Users cannot upgrade their own subscriptions without payment', false),
    ('Admin Subscription Management', 'ACTIVE', 'Secure admin functions with justification logging', false),
    ('Tenant Data Encryption', 'ACTIVE', 'PII data encrypted at database level', false),
    ('Row Level Security (RLS)', 'ACTIVE', 'All sensitive tables protected with RLS policies', false),
    ('Audit Logging', 'ACTIVE', 'Comprehensive security event logging', false),
    ('Rate Limiting', 'ACTIVE', 'API endpoints protected with rate limiting', false),
    ('Leaked Password Protection', 'REQUIRES_CONFIG', 'Must be enabled in Supabase Dashboard > Auth Settings', true),
    ('Security Monitoring', 'ACTIVE', 'Automated detection of suspicious activities', false);
END;
$function$;