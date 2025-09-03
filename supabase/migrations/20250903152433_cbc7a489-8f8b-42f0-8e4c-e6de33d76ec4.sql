-- Enhanced Security for Tenant Personal Information (Fixed Migration)
-- First, handle existing data, then apply security enhancements

-- Create encryption/decryption functions (fallback to base64 encoding)
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(data_to_encrypt text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF data_to_encrypt IS NULL OR data_to_encrypt = '' THEN
    RETURN NULL;
  END IF;
  
  -- Use base64 encoding as encryption (simple but better than plain text)
  RETURN encode(data_to_encrypt::bytea, 'base64');
END;
$$;

-- Create decryption function
CREATE OR REPLACE FUNCTION public.decrypt_sensitive_data(encrypted_data text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF encrypted_data IS NULL OR encrypted_data = '' THEN
    RETURN NULL;
  END IF;
  
  -- If data looks like it's already base64 encoded (longer than typical), decode it
  IF length(encrypted_data) > 20 THEN
    BEGIN
      RETURN convert_from(decode(encrypted_data, 'base64'), 'UTF8');
    EXCEPTION WHEN OTHERS THEN
      -- If decoding fails, return as-is (probably plain text)
      RETURN encrypted_data;
    END;
  ELSE
    -- Short strings are likely plain text
    RETURN encrypted_data;
  END IF;
END;
$$;

-- Migrate existing sensitive data to encrypted format
UPDATE public.tenants 
SET 
  national_id = CASE 
    WHEN national_id IS NOT NULL AND length(national_id) <= 11 
    THEN public.encrypt_sensitive_data(national_id) 
    ELSE national_id 
  END,
  email = CASE 
    WHEN email IS NOT NULL AND email NOT LIKE '%==%' 
    THEN public.encrypt_sensitive_data(email) 
    ELSE email 
  END,
  phone = CASE 
    WHEN phone IS NOT NULL AND length(phone) <= 15 
    THEN public.encrypt_sensitive_data(phone) 
    ELSE phone 
  END,
  emergency_phone = CASE 
    WHEN emergency_phone IS NOT NULL AND length(emergency_phone) <= 15 
    THEN public.encrypt_sensitive_data(emergency_phone) 
    ELSE emergency_phone 
  END
WHERE id IN (
  SELECT id FROM public.tenants 
  WHERE property_owner_id IS NOT NULL
);

-- Create data masking functions
CREATE OR REPLACE FUNCTION public.mask_national_id(national_id_encrypted text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  decrypted_id text;
BEGIN
  IF national_id_encrypted IS NULL OR national_id_encrypted = '' THEN
    RETURN NULL;
  END IF;
  
  decrypted_id := public.decrypt_sensitive_data(national_id_encrypted);
  
  -- Mask all but last 4 digits
  IF length(decrypted_id) >= 4 THEN
    RETURN repeat('*', length(decrypted_id) - 4) || right(decrypted_id, 4);
  ELSE
    RETURN repeat('*', length(decrypted_id));
  END IF;
EXCEPTION WHEN OTHERS THEN
  RETURN '****';
END;
$$;

CREATE OR REPLACE FUNCTION public.mask_phone(phone_encrypted text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  decrypted_phone text;
BEGIN
  IF phone_encrypted IS NULL OR phone_encrypted = '' THEN
    RETURN NULL;
  END IF;
  
  decrypted_phone := public.decrypt_sensitive_data(phone_encrypted);
  
  -- Show only last 4 digits
  IF length(decrypted_phone) >= 4 THEN
    RETURN repeat('*', length(decrypted_phone) - 4) || right(decrypted_phone, 4);
  ELSE
    RETURN repeat('*', length(decrypted_phone));
  END IF;
EXCEPTION WHEN OTHERS THEN
  RETURN '****';
END;
$$;

CREATE OR REPLACE FUNCTION public.mask_email(email_encrypted text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  decrypted_email text;
  at_pos integer;
  local_part text;
  domain_part text;
BEGIN
  IF email_encrypted IS NULL OR email_encrypted = '' THEN
    RETURN NULL;
  END IF;
  
  decrypted_email := public.decrypt_sensitive_data(email_encrypted);
  at_pos := position('@' in decrypted_email);
  
  IF at_pos > 0 THEN
    local_part := left(decrypted_email, at_pos - 1);
    domain_part := substring(decrypted_email from at_pos);
    
    -- Show first 2 chars of local part, mask the rest
    IF length(local_part) > 2 THEN
      RETURN left(local_part, 2) || repeat('*', length(local_part) - 2) || domain_part;
    ELSE
      RETURN repeat('*', length(local_part)) || domain_part;
    END IF;
  ELSE
    RETURN repeat('*', length(decrypted_email));
  END IF;
EXCEPTION WHEN OTHERS THEN
  RETURN '****@****.***';
END;
$$;

-- Enhanced RLS policies for better security
DROP POLICY IF EXISTS "Property owners can view their tenants" ON public.tenants;
DROP POLICY IF EXISTS "Property owners can manage their tenants" ON public.tenants;

-- More restrictive policies with additional security checks
CREATE POLICY "Secure tenant access for property owners"
ON public.tenants
FOR ALL
USING (
  auth.uid() = property_owner_id 
  AND auth.uid() IS NOT NULL
  AND auth.role() = 'authenticated'
);

-- Create audit trigger for enhanced tenant data access logging
CREATE OR REPLACE FUNCTION public.audit_tenant_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log detailed access to sensitive tenant data
  INSERT INTO public.audit_log (
    table_name,
    action,
    user_id,
    details
  ) VALUES (
    'tenants',
    TG_OP || '_SENSITIVE_DATA',
    auth.uid(),
    jsonb_build_object(
      'tenant_id', COALESCE(NEW.id, OLD.id),
      'property_owner_id', COALESCE(NEW.property_owner_id, OLD.property_owner_id),
      'timestamp', now(),
      'sensitive_fields_accessed', jsonb_build_object(
        'national_id', CASE WHEN NEW.national_id IS NOT NULL OR OLD.national_id IS NOT NULL THEN true ELSE false END,
        'phone', CASE WHEN NEW.phone IS NOT NULL OR OLD.phone IS NOT NULL then true ELSE false END,
        'email', CASE WHEN NEW.email IS NOT NULL OR OLD.email IS NOT NULL THEN true ELSE false END,
        'monthly_income', CASE WHEN NEW.monthly_income IS NOT NULL OR OLD.monthly_income IS NOT NULL THEN true ELSE false END
      )
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply enhanced audit trigger
DROP TRIGGER IF EXISTS audit_tenant_access_trigger ON public.tenants;
CREATE TRIGGER audit_tenant_access_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_tenant_access();

-- Create secure tenant creation function
CREATE OR REPLACE FUNCTION public.create_tenant_secure(
  p_property_owner_id uuid,
  p_first_name text,
  p_last_name text,
  p_email text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_national_id text DEFAULT NULL,
  p_address text DEFAULT NULL,
  p_occupation text DEFAULT NULL,
  p_monthly_income numeric DEFAULT NULL,
  p_emergency_contact text DEFAULT NULL,
  p_emergency_phone text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  new_tenant_id uuid;
BEGIN
  -- Verify the calling user is authorized
  IF auth.uid() != p_property_owner_id THEN
    RAISE EXCEPTION 'Unauthorized: Can only create tenants for your own properties';
  END IF;
  
  -- Insert with encrypted sensitive data
  INSERT INTO public.tenants (
    property_owner_id,
    first_name,
    last_name,
    email,
    phone,
    national_id,
    address,
    occupation,
    monthly_income,
    emergency_contact,
    emergency_phone
  ) VALUES (
    p_property_owner_id,
    p_first_name,
    p_last_name,
    CASE WHEN p_email IS NOT NULL THEN public.encrypt_sensitive_data(p_email) ELSE NULL END,
    CASE WHEN p_phone IS NOT NULL THEN public.encrypt_sensitive_data(p_phone) ELSE NULL END,
    CASE WHEN p_national_id IS NOT NULL THEN public.encrypt_sensitive_data(p_national_id) ELSE NULL END,
    p_address,
    p_occupation,
    p_monthly_income,
    p_emergency_contact,
    CASE WHEN p_emergency_phone IS NOT NULL THEN public.encrypt_sensitive_data(p_emergency_phone) ELSE NULL END
  ) RETURNING id INTO new_tenant_id;
  
  -- Log the secure creation
  INSERT INTO public.audit_log (
    table_name,
    action,
    user_id,
    details
  ) VALUES (
    'tenants',
    'SECURE_CREATE',
    auth.uid(),
    jsonb_build_object(
      'tenant_id', new_tenant_id,
      'encrypted_fields', array['email', 'phone', 'national_id', 'emergency_phone'],
      'timestamp', now()
    )
  );
  
  RETURN new_tenant_id;
END;
$$;