-- Update the app_role enum to include ambassador role
ALTER TYPE public.app_role ADD VALUE 'ambassador';

-- Create a function to promote user to ambassador
CREATE OR REPLACE FUNCTION public.promote_user_to_ambassador(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_caller_admin boolean;
BEGIN
  -- Check if caller is admin
  SELECT has_role(auth.uid(), 'admin') INTO is_caller_admin;
  
  IF NOT is_caller_admin THEN
    RAISE EXCEPTION 'Only administrators can promote users to ambassadors';
  END IF;
  
  -- Insert ambassador role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'ambassador')
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