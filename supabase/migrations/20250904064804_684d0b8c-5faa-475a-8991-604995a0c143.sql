-- CRITICAL SECURITY FIX: Phase 1 - Tenant Data Protection (Fixed)

-- 1. Drop the insecure tenant_safe_view since we can't add RLS to views
DROP VIEW IF EXISTS public.tenant_safe_view;

-- 2. Enhanced server-side encryption functions using proper AES
CREATE OR REPLACE FUNCTION public.encrypt_tenant_field(plain_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- 3. Enhanced server-side decryption function
CREATE OR REPLACE FUNCTION public.decrypt_tenant_field(encrypted_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- 4. Secure tenant data access function with proper encryption and masking
CREATE OR REPLACE FUNCTION public.get_secure_tenant_data(tenant_property_owner_id uuid)
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  email_masked text,
  phone_masked text,
  national_id_masked text,
  address text,
  occupation text,
  monthly_income numeric,
  emergency_contact text,
  emergency_phone_masked text,
  property_owner_id uuid,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify legitimate access
  IF NOT has_legitimate_tenant_access(tenant_property_owner_id) THEN
    RAISE EXCEPTION 'SECURITY ERROR: Unauthorized tenant data access attempt';
  END IF;

  -- Log access for audit
  INSERT INTO public.audit_log (
    table_name, action, user_id, details
  ) VALUES (
    'tenants', 'SECURE_DATA_ACCESS', auth.uid(),
    jsonb_build_object(
      'target_property_owner_id', tenant_property_owner_id,
      'timestamp', now(),
      'function', 'get_secure_tenant_data'
    )
  );

  -- Return masked/decrypted data based on access level
  RETURN QUERY
  SELECT 
    t.id,
    t.first_name,
    t.last_name,
    -- Mask email (show first 3 chars + domain)
    CASE 
      WHEN t.email IS NOT NULL AND length(t.email) > 11 THEN
        substring(decrypt_tenant_field(t.email), 1, 3) || '***@' || 
        split_part(decrypt_tenant_field(t.email), '@', 2)
      ELSE '***@***.***'
    END as email_masked,
    -- Mask phone (show last 4 digits)
    CASE 
      WHEN t.phone IS NOT NULL AND length(t.phone) > 8 THEN
        '*** *** ' || right(decrypt_tenant_field(t.phone), 4)
      ELSE '*** *** ****'
    END as phone_masked,
    -- Mask national ID (show first 6 digits)
    CASE 
      WHEN t.national_id IS NOT NULL AND length(t.national_id) > 11 THEN
        left(decrypt_tenant_field(t.national_id), 6) || '*****'
      ELSE '******/*****'
    END as national_id_masked,
    t.address,
    t.occupation,
    t.monthly_income,
    t.emergency_contact,
    -- Mask emergency phone
    CASE 
      WHEN t.emergency_phone IS NOT NULL AND length(t.emergency_phone) > 8 THEN
        '*** *** ' || right(decrypt_tenant_field(t.emergency_phone), 4)
      ELSE '*** *** ****'
    END as emergency_phone_masked,
    t.property_owner_id,
    t.created_at,
    t.updated_at
  FROM public.tenants t
  WHERE t.property_owner_id = tenant_property_owner_id;
END;
$$;

-- 5. Update the encrypt_sensitive_tenant_data function to use proper encryption
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_tenant_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Encrypt sensitive fields using proper AES encryption
  IF NEW.national_id IS NOT NULL AND length(NEW.national_id) = 11 AND NEW.national_id ~ '^[0-9]{11}$' THEN
    NEW.national_id := encrypt_tenant_field(NEW.national_id);
  END IF;
  
  IF NEW.email IS NOT NULL AND NEW.email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    NEW.email := encrypt_tenant_field(NEW.email);
  END IF;
  
  IF NEW.phone IS NOT NULL AND NEW.phone ~ '^\+?47[0-9]{8}$|^[0-9]{8}$' THEN
    NEW.phone := encrypt_tenant_field(NEW.phone);
  END IF;
  
  IF NEW.emergency_phone IS NOT NULL AND NEW.emergency_phone ~ '^\+?47[0-9]{8}$|^[0-9]{8}$' THEN
    NEW.emergency_phone := encrypt_tenant_field(NEW.emergency_phone);
  END IF;
  
  -- Log encryption activity
  INSERT INTO public.audit_log (
    table_name, action, user_id, details
  ) VALUES (
    'tenants', 'DATA_ENCRYPTED', auth.uid(),
    jsonb_build_object(
      'tenant_id', NEW.id,
      'fields_encrypted', jsonb_build_array(
        CASE WHEN NEW.national_id IS DISTINCT FROM OLD.national_id THEN 'national_id' END,
        CASE WHEN NEW.email IS DISTINCT FROM OLD.email THEN 'email' END,
        CASE WHEN NEW.phone IS DISTINCT FROM OLD.phone THEN 'phone' END,
        CASE WHEN NEW.emergency_phone IS DISTINCT FROM OLD.emergency_phone THEN 'emergency_phone' END
      ),
      'timestamp', now()
    )
  );
  
  RETURN NEW;
END;
$$;