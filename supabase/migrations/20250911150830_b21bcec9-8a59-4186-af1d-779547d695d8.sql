-- Final security fix: Set search_path for all remaining functions
-- This should resolve the function search path mutable warning

CREATE OR REPLACE FUNCTION public.admin_access_tenant_data(tenant_property_owner_id uuid, admin_justification text)
RETURNS TABLE(id uuid, first_name text, last_name text, email_partially_masked text, phone_partially_masked text, national_id_partially_masked text, property_owner_id uuid, access_timestamp timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

CREATE OR REPLACE FUNCTION public.admin_update_subscription(
  target_user_id uuid,
  new_subscription_tier text,
  new_subscription_end timestamp with time zone,
  admin_justification text
) RETURNS boolean 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

CREATE OR REPLACE FUNCTION public.decrypt_tenant_field(encrypted_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

CREATE OR REPLACE FUNCTION public.encrypt_tenant_field(plain_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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