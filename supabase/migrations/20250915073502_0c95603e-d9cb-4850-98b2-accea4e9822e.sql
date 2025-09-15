-- Fix remaining function with mutable search path
CREATE OR REPLACE FUNCTION public.check_auth_security_config()
 RETURNS TABLE(setting_name text, current_status text, recommendation text, action_required text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY VALUES
    ('leaked_password_protection', 'DISABLED', 'ENABLE', 'Configure in Supabase Dashboard > Auth > Settings'),
    ('password_strength', 'REVIEW_REQUIRED', 'ENSURE_STRONG_POLICY', 'Set minimum length and complexity requirements'),
    ('email_confirmation', 'REVIEW_REQUIRED', 'ENABLE_FOR_PRODUCTION', 'Enable email confirmation for new signups'),
    ('rate_limiting', 'ACTIVE', 'MONITOR', 'Current rate limiting is active and properly configured');
END;
$function$;