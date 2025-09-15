-- Fix database function security by adding immutable search_path to all security-critical functions
-- This prevents SQL injection and privilege escalation attacks

-- 1. Fix tenant encryption functions
CREATE OR REPLACE FUNCTION public.encrypt_tenant_field(plain_text text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  encryption_key text;
  encrypted_data text;
BEGIN
  -- Get encryption key from vault
  SELECT decrypted_secret INTO encryption_key 
  FROM vault.decrypted_secrets 
  WHERE name = 'TENANT_ENCRYPTION_KEY'
  LIMIT 1;
  
  -- If no encryption key, raise error
  IF encryption_key IS NULL THEN
    RAISE EXCEPTION 'SECURITY ERROR: Encryption key not found';
  END IF;
  
  -- Use proper AES encryption (not base64)
  SELECT encode(
    encrypt(
      plain_text::bytea, 
      encryption_key::bytea, 
      'aes'
    ), 
    'hex'
  ) INTO encrypted_data;
  
  RETURN encrypted_data;
EXCEPTION 
  WHEN OTHERS THEN
    -- Log security error
    INSERT INTO public.audit_log (
      table_name, action, user_id, details
    ) VALUES (
      'encryption', 'ENCRYPTION_ERROR', auth.uid(),
      jsonb_build_object('error', SQLERRM, 'timestamp', now())
    );
    RAISE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.decrypt_tenant_field(encrypted_text text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  encryption_key text;
  decrypted_data text;
BEGIN
  -- Get encryption key from vault
  SELECT decrypted_secret INTO encryption_key 
  FROM vault.decrypted_secrets 
  WHERE name = 'TENANT_ENCRYPTION_KEY'
  LIMIT 1;
  
  -- If no encryption key, raise error
  IF encryption_key IS NULL THEN
    RAISE EXCEPTION 'SECURITY ERROR: Encryption key not found';
  END IF;
  
  -- Decrypt using proper AES
  SELECT convert_from(
    decrypt(
      decode(encrypted_text, 'hex'), 
      encryption_key::bytea, 
      'aes'
    ), 
    'UTF8'
  ) INTO decrypted_data;
  
  RETURN decrypted_data;
EXCEPTION 
  WHEN OTHERS THEN
    -- Log security error
    INSERT INTO public.audit_log (
      table_name, action, user_id, details
    ) VALUES (
      'decryption', 'DECRYPTION_ERROR', auth.uid(),
      jsonb_build_object('error', SQLERRM, 'timestamp', now())
    );
    RETURN '[ENCRYPTED]';
END;
$function$;

-- 2. Fix admin functions
CREATE OR REPLACE FUNCTION public.admin_update_subscription(target_user_id uuid, new_subscription_tier text, new_subscription_end timestamp with time zone, admin_justification text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  is_caller_admin boolean;
BEGIN
  -- Strict admin validation
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'SECURITY ERROR: Authentication required';
  END IF;
  
  SELECT has_role(auth.uid(), 'admin'::app_role) INTO is_caller_admin;
  
  IF NOT is_caller_admin THEN
    RAISE EXCEPTION 'SECURITY ERROR: Admin privileges required for subscription management';
  END IF;
  
  -- Require justification
  IF admin_justification IS NULL OR length(trim(admin_justification)) < 10 THEN
    RAISE EXCEPTION 'SECURITY ERROR: Valid justification required (minimum 10 characters)';
  END IF;
  
  -- Update subscription with admin override
  UPDATE public.profiles
  SET 
    subscription_tier = new_subscription_tier,
    subscription_end = new_subscription_end,
    updated_at = now()
  WHERE id = target_user_id;
  
  -- Log admin subscription change with justification
  INSERT INTO public.audit_log (
    table_name, action, user_id, details
  ) VALUES (
    'profiles', 'ADMIN_SUBSCRIPTION_UPDATE_WITH_JUSTIFICATION', auth.uid(),
    jsonb_build_object(
      'target_user_id', target_user_id,
      'new_subscription_tier', new_subscription_tier,
      'new_subscription_end', new_subscription_end,
      'justification', admin_justification,
      'timestamp', now(),
      'security_level', 'ADMIN_PRIVILEGED_OPERATION',
      'admin_email', (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );
  
  RETURN TRUE;
END;
$function$;

-- 3. Fix promotion functions
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(target_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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
 SET search_path TO 'public'
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

-- 4. Fix process paid subscription function
CREATE OR REPLACE FUNCTION public.process_paid_subscription_upgrade(user_id uuid, payment_id uuid, new_tier text, duration_months integer DEFAULT 12)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  payment_verified boolean DEFAULT FALSE;
BEGIN
  -- Verify payment record exists and is completed
  SELECT (payment_status = 'completed') INTO payment_verified
  FROM public.payment_records
  WHERE id = payment_id AND user_id = process_paid_subscription_upgrade.user_id;
  
  IF NOT payment_verified THEN
    RAISE EXCEPTION 'SECURITY ERROR: Valid completed payment required for subscription upgrade';
  END IF;
  
  -- Process legitimate paid upgrade
  UPDATE public.profiles
  SET 
    subscription_tier = new_tier,
    subscription_end = now() + (duration_months || ' months')::interval,
    updated_at = now()
  WHERE id = process_paid_subscription_upgrade.user_id;
  
  -- Log legitimate paid upgrade
  INSERT INTO public.audit_log (
    table_name, action, user_id, details
  ) VALUES (
    'profiles', 'PAID_SUBSCRIPTION_UPGRADE', process_paid_subscription_upgrade.user_id,
    jsonb_build_object(
      'payment_id', payment_id,
      'new_tier', new_tier,
      'duration_months', duration_months,
      'timestamp', now(),
      'verification_method', 'PAYMENT_VERIFIED'
    )
  );
  
  RETURN TRUE;
END;
$function$;

-- 5. Fix tenant access functions  
CREATE OR REPLACE FUNCTION public.has_legitimate_tenant_access(tenant_property_owner_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

-- 6. Fix admin tenant access function
CREATE OR REPLACE FUNCTION public.admin_access_tenant_data(tenant_property_owner_id uuid, admin_justification text)
 RETURNS TABLE(id uuid, first_name text, last_name text, email_partially_masked text, phone_partially_masked text, national_id_partially_masked text, property_owner_id uuid, access_timestamp timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Strict validation: Only authenticated admins
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'SECURITY ERROR: Authentication required';
  END IF;
  
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'SECURITY ERROR: Admin privileges required';
  END IF;
  
  -- Require explicit justification
  IF admin_justification IS NULL OR length(trim(admin_justification)) < 10 THEN
    RAISE EXCEPTION 'SECURITY ERROR: Valid justification required (minimum 10 characters)';
  END IF;
  
  -- Log admin access with justification for security audit
  INSERT INTO public.audit_log (
    table_name, action, user_id, details
  ) VALUES (
    'tenants', 'ADMIN_ACCESS_WITH_JUSTIFICATION', auth.uid(),
    jsonb_build_object(
      'target_property_owner_id', tenant_property_owner_id,
      'justification', admin_justification,
      'timestamp', now(),
      'security_level', 'CRITICAL_ADMIN_ACCESS',
      'warning', 'Admin accessed tenant PII with justification',
      'admin_email', (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

  -- Return minimal data with enhanced masking even for admins
  RETURN QUERY
  SELECT 
    t.id,
    t.first_name,
    t.last_name,
    -- Even for admins, show only partial email
    CASE 
      WHEN t.email IS NOT NULL AND length(t.email) > 11 THEN
        substring(decrypt_tenant_field(t.email), 1, 1) || '***@' || 
        split_part(decrypt_tenant_field(t.email), '@', 2)
      ELSE '***@***.***'
    END as email_partially_masked,
    -- Even for admins, show only partial phone
    CASE 
      WHEN t.phone IS NOT NULL AND length(t.phone) > 8 THEN
        '*** ** ' || right(decrypt_tenant_field(t.phone), 1)
      ELSE '*** ** *'
    END as phone_partially_masked,
    -- Even for admins, show only partial national ID
    CASE 
      WHEN t.national_id IS NOT NULL AND length(t.national_id) > 11 THEN
        left(decrypt_tenant_field(t.national_id), 2) || '****' || right(decrypt_tenant_field(t.national_id), 1)
      ELSE '**-****-*'
    END as national_id_partially_masked,
    t.property_owner_id,
    now() as access_timestamp
  FROM public.tenants t
  WHERE t.property_owner_id = tenant_property_owner_id;
END;
$function$;

-- Log the security fix completion
INSERT INTO public.audit_log (
  table_name, action, user_id, details
) VALUES (
  'security_system', 'CRITICAL_SECURITY_FIXES_APPLIED', auth.uid(),
  jsonb_build_object(
    'fix_type', 'DATABASE_FUNCTION_SECURITY_HARDENING',
    'timestamp', now(),
    'changes_applied', jsonb_build_array(
      'Added immutable search_path to all security-critical functions',
      'Fixed tenant encryption/decryption functions',
      'Secured admin subscription management functions',
      'Hardened user promotion functions',
      'Enhanced tenant access control functions'
    ),
    'security_level', 'PRODUCTION_READY'
  )
);