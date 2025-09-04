-- Enhanced Security for Tenant Personal Information
-- This migration implements multiple layers of security for sensitive tenant data

-- 1. Create enhanced audit logging function for tenant data access
CREATE OR REPLACE FUNCTION public.audit_tenant_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log all access to tenant data with detailed information
  INSERT INTO public.audit_log (
    table_name,
    action,
    user_id,
    details
  ) VALUES (
    'tenants',
    CASE 
      WHEN TG_OP = 'SELECT' THEN 'DATA_ACCESS'
      ELSE TG_OP
    END,
    auth.uid(),
    jsonb_build_object(
      'tenant_id', COALESCE(NEW.id, OLD.id),
      'property_owner_id', COALESCE(NEW.property_owner_id, OLD.property_owner_id),
      'operation', TG_OP,
      'timestamp', now(),
      'user_email', (SELECT email FROM auth.users WHERE id = auth.uid()),
      'sensitive_fields_accessed', CASE 
        WHEN TG_OP = 'SELECT' THEN jsonb_build_array('national_id', 'email', 'phone', 'monthly_income')
        ELSE NULL
      END
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Create function to encrypt sensitive tenant data
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_tenant_data()
RETURNS TRIGGER AS $$
DECLARE
  encryption_key text;
BEGIN
  -- Get encryption key from vault (you'll need to add this secret)
  SELECT decrypted_secret INTO encryption_key 
  FROM vault.decrypted_secrets 
  WHERE name = 'TENANT_ENCRYPTION_KEY'
  LIMIT 1;
  
  -- If no encryption key, log warning but don't block operation
  IF encryption_key IS NULL THEN
    INSERT INTO public.audit_log (
      table_name, action, user_id, details
    ) VALUES (
      'tenants', 'ENCRYPTION_WARNING', auth.uid(),
      jsonb_build_object('message', 'No encryption key found for tenant data', 'timestamp', now())
    );
    RETURN NEW;
  END IF;
  
  -- Encrypt sensitive fields if they are provided and not already encrypted
  IF NEW.national_id IS NOT NULL AND length(NEW.national_id) = 11 AND NEW.national_id ~ '^[0-9]{11}$' THEN
    NEW.national_id := encode(encrypt(NEW.national_id::bytea, encryption_key::bytea, 'aes'), 'base64');
  END IF;
  
  IF NEW.email IS NOT NULL AND NEW.email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    NEW.email := encode(encrypt(NEW.email::bytea, encryption_key::bytea, 'aes'), 'base64');
  END IF;
  
  IF NEW.phone IS NOT NULL AND NEW.phone ~ '^\+?47[0-9]{8}$|^[0-9]{8}$' THEN
    NEW.phone := encode(encrypt(NEW.phone::bytea, encryption_key::bytea, 'aes'), 'base64');
  END IF;
  
  IF NEW.emergency_phone IS NOT NULL AND NEW.emergency_phone ~ '^\+?47[0-9]{8}$|^[0-9]{8}$' THEN
    NEW.emergency_phone := encode(encrypt(NEW.emergency_phone::bytea, encryption_key::bytea, 'aes'), 'base64');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Create function to check if user has legitimate access to tenant data
CREATE OR REPLACE FUNCTION public.has_legitimate_tenant_access(tenant_property_owner_id uuid)
RETURNS boolean AS $$
DECLARE
  user_is_admin boolean;
  user_owns_property boolean;
BEGIN
  -- Check if user is admin
  SELECT has_role(auth.uid(), 'admin') INTO user_is_admin;
  
  -- Check if user is the property owner
  SELECT (auth.uid() = tenant_property_owner_id) INTO user_owns_property;
  
  -- Log access attempt
  INSERT INTO public.audit_log (
    table_name, action, user_id, details
  ) VALUES (
    'tenants', 'ACCESS_CHECK', auth.uid(),
    jsonb_build_object(
      'target_property_owner_id', tenant_property_owner_id,
      'user_is_admin', user_is_admin,
      'user_owns_property', user_owns_property,
      'access_granted', (user_is_admin OR user_owns_property),
      'timestamp', now()
    )
  );
  
  RETURN (user_is_admin OR user_owns_property);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Drop existing policies and create enhanced ones
DROP POLICY IF EXISTS "Property owners can manage their tenants" ON public.tenants;
DROP POLICY IF EXISTS "Property owners can view their tenants" ON public.tenants;

-- Enhanced RLS policies with additional security checks
CREATE POLICY "Enhanced tenant access policy"
ON public.tenants
FOR ALL
USING (
  has_legitimate_tenant_access(property_owner_id) 
  AND auth.uid() IS NOT NULL
  AND property_owner_id IS NOT NULL
)
WITH CHECK (
  has_legitimate_tenant_access(property_owner_id)
  AND auth.uid() IS NOT NULL
  AND property_owner_id IS NOT NULL
  AND property_owner_id = auth.uid() -- Only property owners can insert/update
);

-- 5. Create read-only policy for admins with full audit logging
CREATE POLICY "Admin read access to tenant data"
ON public.tenants
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND auth.uid() IS NOT NULL
);

-- 6. Create triggers for enhanced security

-- Trigger for encrypting sensitive data before insert/update
DROP TRIGGER IF EXISTS encrypt_tenant_data_trigger ON public.tenants;
CREATE TRIGGER encrypt_tenant_data_trigger
  BEFORE INSERT OR UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_sensitive_tenant_data();

-- Trigger for audit logging (after all operations to capture final state)
DROP TRIGGER IF EXISTS audit_tenant_access_trigger ON public.tenants;
CREATE TRIGGER audit_tenant_access_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_tenant_access();

-- 7. Create view for property owners to access decrypted data safely
CREATE OR REPLACE VIEW public.tenant_safe_view AS
SELECT 
  t.id,
  t.property_owner_id,
  t.first_name,
  t.last_name,
  -- Decrypt sensitive fields only for legitimate access
  CASE 
    WHEN has_legitimate_tenant_access(t.property_owner_id) THEN
      COALESCE(
        convert_from(decrypt(decode(t.email, 'base64'), 
          (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'TENANT_ENCRYPTION_KEY' LIMIT 1)::bytea, 'aes'), 'UTF8'),
        t.email
      )
    ELSE '[ENCRYPTED]'
  END as email,
  CASE 
    WHEN has_legitimate_tenant_access(t.property_owner_id) THEN
      COALESCE(
        convert_from(decrypt(decode(t.phone, 'base64'), 
          (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'TENANT_ENCRYPTION_KEY' LIMIT 1)::bytea, 'aes'), 'UTF8'),
        t.phone
      )
    ELSE '[ENCRYPTED]'
  END as phone,
  CASE 
    WHEN has_legitimate_tenant_access(t.property_owner_id) THEN
      COALESCE(
        convert_from(decrypt(decode(t.national_id, 'base64'), 
          (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'TENANT_ENCRYPTION_KEY' LIMIT 1)::bytea, 'aes'), 'UTF8'),
        t.national_id
      )
    ELSE '[ENCRYPTED]'
  END as national_id,
  t.address,
  t.occupation,
  t.monthly_income,
  t.emergency_contact,
  CASE 
    WHEN has_legitimate_tenant_access(t.property_owner_id) THEN
      COALESCE(
        convert_from(decrypt(decode(t.emergency_phone, 'base64'), 
          (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'TENANT_ENCRYPTION_KEY' LIMIT 1)::bytea, 'aes'), 'UTF8'),
        t.emergency_phone
      )
    ELSE '[ENCRYPTED]'
  END as emergency_phone,
  t.created_at,
  t.updated_at
FROM public.tenants t
WHERE has_legitimate_tenant_access(t.property_owner_id);

-- Enable RLS on the view
ALTER VIEW public.tenant_safe_view SET (security_barrier = true);

-- 8. Create policy for the safe view
CREATE POLICY "Tenant safe view access"
ON public.tenants
FOR SELECT
USING (has_legitimate_tenant_access(property_owner_id));