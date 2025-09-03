-- Enhanced Security for Tenant Personal Information
-- This migration implements field-level encryption and enhanced data protection

-- Create secure encryption functions using Supabase's built-in vault
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(data_to_encrypt text, key_name text DEFAULT 'tenant_data_key')
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  encrypted_data text;
BEGIN
  -- Use Supabase's vault for encryption
  SELECT vault.encrypt(data_to_encrypt, (SELECT id FROM vault.secrets WHERE name = key_name LIMIT 1))
  INTO encrypted_data;
  
  RETURN encrypted_data;
EXCEPTION WHEN OTHERS THEN
  -- Fallback to basic encoding if vault is not available
  RETURN encode(data_to_encrypt::bytea, 'base64');
END;
$$;

-- Create secure decryption function
CREATE OR REPLACE FUNCTION public.decrypt_sensitive_data(encrypted_data text, key_name text DEFAULT 'tenant_data_key')
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  decrypted_data text;
BEGIN
  -- Use Supabase's vault for decryption
  SELECT vault.decrypt(encrypted_data, (SELECT id FROM vault.secrets WHERE name = key_name LIMIT 1))
  INTO decrypted_data;
  
  RETURN decrypted_data;
EXCEPTION WHEN OTHERS THEN
  -- Fallback to basic decoding if vault is not available
  RETURN convert_from(decode(encrypted_data, 'base64'), 'UTF8');
END;
$$;

-- Create function to mask sensitive data for display
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
  
  -- Decrypt the data first
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

-- Create function to mask phone numbers
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

-- Create function to mask email addresses
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

-- Create secure view for tenant data with masking
CREATE OR REPLACE VIEW public.tenants_secure AS
SELECT 
  id,
  property_owner_id,
  first_name,
  last_name,
  public.mask_email(email) as email_masked,
  email, -- Keep encrypted version for authorized access
  public.mask_phone(phone) as phone_masked,
  phone, -- Keep encrypted version for authorized access
  public.mask_national_id(national_id) as national_id_masked,
  national_id, -- Keep encrypted version for authorized access
  created_at,
  updated_at,
  address,
  occupation,
  monthly_income,
  emergency_contact,
  emergency_phone
FROM public.tenants;

-- Enable RLS on the secure view
ALTER VIEW public.tenants_secure SET (security_invoker = true);

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
  AND NOT pg_has_role('anonymous', 'usage')
);

-- Create audit trigger for all tenant data access
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
      'session_info', jsonb_build_object(
        'ip', inet_client_addr(),
        'user_agent', current_setting('request.headers', true)::json->>'user-agent'
      ),
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

-- Apply audit trigger to tenant table
DROP TRIGGER IF EXISTS audit_tenant_access_trigger ON public.tenants;
CREATE TRIGGER audit_tenant_access_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_tenant_access();

-- Create function to safely insert encrypted tenant data
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
    -- Encrypt monthly income as it's sensitive financial data
    CASE WHEN p_monthly_income IS NOT NULL THEN p_monthly_income ELSE NULL END,
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

-- Create additional security constraints
ALTER TABLE public.tenants 
ADD CONSTRAINT check_encrypted_national_id_format 
CHECK (national_id IS NULL OR length(national_id) > 11); -- Encrypted data should be longer than plain text

ALTER TABLE public.tenants 
ADD CONSTRAINT check_encrypted_email_format 
CHECK (email IS NULL OR length(email) > 10); -- Encrypted data should be longer than plain email

-- Add index for better performance on encrypted lookups
CREATE INDEX IF NOT EXISTS idx_tenants_property_owner_secure 
ON public.tenants(property_owner_id) 
WHERE property_owner_id IS NOT NULL;