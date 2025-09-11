-- Fix search_path security warning for all functions
-- Set proper search_path for security functions

-- Fix search_path for existing functions that don't have it set
CREATE OR REPLACE FUNCTION public.has_legitimate_tenant_access(tenant_property_owner_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  user_is_admin boolean;
  user_owns_property boolean;
  access_granted boolean;
BEGIN
  -- Check if user is admin
  SELECT has_role(auth.uid(), 'admin'::app_role) INTO user_is_admin;
  
  -- Check if user is the property owner
  SELECT (auth.uid() = tenant_property_owner_id) INTO user_owns_property;
  
  access_granted := (user_is_admin OR user_owns_property);
  
  -- Log access attempt for audit trail
  INSERT INTO public.audit_log (
    table_name, action, user_id, details
  ) VALUES (
    'tenants', 'ACCESS_CHECK', auth.uid(),
    jsonb_build_object(
      'target_property_owner_id', tenant_property_owner_id,
      'user_is_admin', user_is_admin,
      'user_owns_property', user_owns_property,
      'access_granted', access_granted,
      'timestamp', now()
    )
  );
  
  RETURN access_granted;
END;
$function$;

-- Fix search_path for bootstrap function
CREATE OR REPLACE FUNCTION public.bootstrap_first_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  admin_count integer;
  bootstrap_email text;
BEGIN
  -- Get bootstrap admin email from secrets or set a default
  SELECT decrypted_secret INTO bootstrap_email 
  FROM vault.decrypted_secrets 
  WHERE name = 'BOOTSTRAP_ADMIN_EMAIL'
  LIMIT 1;
  
  -- If no bootstrap email is set, use a default pattern
  IF bootstrap_email IS NULL THEN
    bootstrap_email := 'admin@leily.no';
  END IF;

  -- Check if this is the first user and matches bootstrap email
  SELECT COUNT(*) INTO admin_count
  FROM public.user_roles
  WHERE role = 'admin'::app_role;

  -- If no admins exist and this user matches bootstrap email, make them admin
  IF admin_count = 0 AND NEW.email = bootstrap_email THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role);
    
    -- Log the bootstrap admin creation
    INSERT INTO public.audit_log (
      table_name, 
      action, 
      user_id, 
      details
    ) VALUES (
      'user_roles',
      'bootstrap_admin_created',
      NEW.id,
      jsonb_build_object('email', NEW.email, 'timestamp', now())
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix search_path for security monitoring functions
CREATE OR REPLACE FUNCTION public.detect_security_violations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  violation_count integer;
  suspicious_user uuid;
BEGIN
  -- Monitor for users trying to access data they shouldn't
  FOR suspicious_user IN 
    SELECT user_id 
    FROM public.audit_log 
    WHERE table_name IN ('tenants', 'deposit_accounts', 'payment_records')
      AND action LIKE 'SENSITIVE_DATA_%'
      AND created_at > now() - interval '10 minutes'
    GROUP BY user_id 
    HAVING COUNT(*) > 20  -- More than 20 sensitive operations in 10 minutes
  LOOP
    -- Log security violation
    INSERT INTO public.audit_log (
      table_name, action, user_id, details
    ) VALUES (
      'security_monitoring', 'POTENTIAL_SECURITY_VIOLATION_DETECTED', suspicious_user,
      jsonb_build_object(
        'violation_type', 'EXCESSIVE_SENSITIVE_DATA_ACCESS',
        'detection_time', now(),
        'security_level', 'CRITICAL_ALERT',
        'recommendation', 'Review user access patterns and consider account suspension',
        'user_email', (SELECT email FROM auth.users WHERE id = suspicious_user)
      )
    );
  END LOOP;
END;
$function$;

-- Update all other security functions with proper search_path
CREATE OR REPLACE FUNCTION public.detect_suspicious_tenant_access()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  suspicious_user uuid;
BEGIN
  -- Check for users accessing multiple tenant records in short time
  FOR suspicious_user IN 
    SELECT user_id 
    FROM public.audit_log 
    WHERE table_name = 'tenants' 
      AND created_at > now() - interval '5 minutes'
      AND (action LIKE 'SECURE_DATA_ACCESS' OR action LIKE 'MODIFICATION_%')
    GROUP BY user_id 
    HAVING COUNT(DISTINCT details->>'tenant_id') > 10
  LOOP
    -- Log suspicious activity
    INSERT INTO public.audit_log (
      table_name, action, user_id, details
    ) VALUES (
      'security', 'SUSPICIOUS_TENANT_ACCESS_DETECTED', suspicious_user,
      jsonb_build_object(
        'detection_type', 'BULK_TENANT_ACCESS',
        'timestamp', now(),
        'security_level', 'CRITICAL',
        'recommended_action', 'INVESTIGATE_USER_ACTIVITY'
      )
    );
  END LOOP;
END;
$function$;

-- Update monitor admin function
CREATE OR REPLACE FUNCTION public.monitor_admin_tenant_access()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  suspicious_admin uuid;
  access_count integer;
BEGIN
  -- Check for admins accessing too many tenant records in short time
  FOR suspicious_admin IN 
    SELECT user_id 
    FROM public.audit_log 
    WHERE table_name = 'tenants' 
      AND action LIKE 'ADMIN_ACCESS%'
      AND created_at > now() - interval '1 hour'
    GROUP BY user_id 
    HAVING COUNT(*) > 5  -- More than 5 tenant accesses per hour is suspicious
  LOOP
    -- Log suspicious admin activity
    INSERT INTO public.audit_log (
      table_name, action, user_id, details
    ) VALUES (
      'security', 'SUSPICIOUS_ADMIN_ACTIVITY_DETECTED', suspicious_admin,
      jsonb_build_object(
        'detection_type', 'EXCESSIVE_TENANT_ACCESS',
        'timestamp', now(),
        'security_level', 'CRITICAL_ALERT',
        'admin_email', (SELECT email FROM auth.users WHERE id = suspicious_admin),
        'recommendation', 'Review admin access patterns immediately'
      )
    );
  END LOOP;
END;
$function$;