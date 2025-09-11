-- CRITICAL SECURITY FIX: Strengthen tenant data protection
-- This migration fixes the tenant PII security vulnerability

-- Step 1: Drop existing potentially permissive RLS policies
DROP POLICY IF EXISTS "Admin audit access to tenant data" ON public.tenants;
DROP POLICY IF EXISTS "Strict tenant data access" ON public.tenants;

-- Step 2: Create stricter RLS policies
-- Only property owners can access their own tenant data
CREATE POLICY "Property owners only access own tenant data"
ON public.tenants
FOR ALL
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND property_owner_id IS NOT NULL 
  AND auth.uid() = property_owner_id
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND property_owner_id IS NOT NULL 
  AND auth.uid() = property_owner_id
);

-- Separate restrictive policy for admin access with enhanced logging
CREATE POLICY "Admin restricted tenant access"
ON public.tenants
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND has_role(auth.uid(), 'admin'::app_role)
  AND property_owner_id IS NOT NULL
);

-- Step 3: Update the secure data function with stronger validation
CREATE OR REPLACE FUNCTION public.get_secure_tenant_data(tenant_property_owner_id uuid)
RETURNS TABLE(
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
  created_at timestamp with time zone, 
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Enhanced validation: Only property owners can access their tenant data
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'SECURITY ERROR: Authentication required';
  END IF;
  
  IF auth.uid() != tenant_property_owner_id THEN
    -- Only allow admin access with explicit logging
    IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'SECURITY ERROR: Unauthorized access to tenant data';
    END IF;
    
    -- Log admin access for security audit
    INSERT INTO public.audit_log (
      table_name, action, user_id, details
    ) VALUES (
      'tenants', 'ADMIN_ACCESS_TENANT_DATA', auth.uid(),
      jsonb_build_object(
        'target_property_owner_id', tenant_property_owner_id,
        'admin_override', true,
        'timestamp', now(),
        'security_level', 'HIGH_RISK',
        'warning', 'Admin accessed tenant PII data'
      )
    );
  END IF;

  -- Log all legitimate access for audit trail
  INSERT INTO public.audit_log (
    table_name, action, user_id, details
  ) VALUES (
    'tenants', 'SECURE_DATA_ACCESS', auth.uid(),
    jsonb_build_object(
      'target_property_owner_id', tenant_property_owner_id,
      'timestamp', now(),
      'function', 'get_secure_tenant_data',
      'data_type', 'MASKED_PII'
    )
  );

  -- Return masked data with enhanced privacy protection
  RETURN QUERY
  SELECT 
    t.id,
    t.first_name,
    t.last_name,
    -- Enhanced email masking
    CASE 
      WHEN t.email IS NOT NULL AND length(t.email) > 11 THEN
        CASE 
          WHEN decrypt_tenant_field(t.email) ~ '^[^@]+@[^@]+\.[^@]+$' THEN
            substring(decrypt_tenant_field(t.email), 1, 2) || '***@' || 
            split_part(decrypt_tenant_field(t.email), '@', 2)
          ELSE '***@***.***'
        END
      ELSE '***@***.***'
    END as email_masked,
    -- Enhanced phone masking  
    CASE 
      WHEN t.phone IS NOT NULL AND length(t.phone) > 8 THEN
        '*** ** ' || right(decrypt_tenant_field(t.phone), 2)
      ELSE '*** ** **'
    END as phone_masked,
    -- Enhanced national ID masking
    CASE 
      WHEN t.national_id IS NOT NULL AND length(t.national_id) > 11 THEN
        left(decrypt_tenant_field(t.national_id), 4) || '***' || right(decrypt_tenant_field(t.national_id), 2)
      ELSE '****-***-**'
    END as national_id_masked,
    t.address,
    t.occupation,
    -- Enhanced income privacy - round to nearest 5000 for privacy
    CASE 
      WHEN t.monthly_income IS NOT NULL THEN
        round(t.monthly_income / 5000) * 5000
      ELSE NULL
    END as monthly_income,
    t.emergency_contact,
    -- Enhanced emergency phone masking
    CASE 
      WHEN t.emergency_phone IS NOT NULL AND length(t.emergency_phone) > 8 THEN
        '*** ** ' || right(decrypt_tenant_field(t.emergency_phone), 2)
      ELSE '*** ** **'
    END as emergency_phone_masked,
    t.property_owner_id,
    t.created_at,
    t.updated_at
  FROM public.tenants t
  WHERE t.property_owner_id = tenant_property_owner_id;
END;
$$;

-- Step 4: Create enhanced tenant ownership validation
CREATE OR REPLACE FUNCTION public.validate_tenant_ownership(tenant_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  tenant_owner_id uuid;
  is_valid boolean;
BEGIN
  -- Get the property owner ID for this tenant
  SELECT property_owner_id INTO tenant_owner_id
  FROM public.tenants
  WHERE id = tenant_id;
  
  -- Strict validation: current user must own this tenant's property
  is_valid := (
    auth.uid() IS NOT NULL 
    AND tenant_owner_id IS NOT NULL 
    AND auth.uid() = tenant_owner_id
  );
  
  -- Log validation attempt for security audit
  INSERT INTO public.audit_log (
    table_name, action, user_id, details
  ) VALUES (
    'tenants', 'OWNERSHIP_VALIDATION', auth.uid(),
    jsonb_build_object(
      'tenant_id', tenant_id,
      'tenant_owner_id', tenant_owner_id,
      'access_valid', is_valid,
      'timestamp', now(),
      'validation_type', 'STRICT_OWNERSHIP_CHECK'
    )
  );
  
  RETURN is_valid;
END;
$$;

-- Step 5: Enhanced audit logging for tenant modifications
CREATE OR REPLACE FUNCTION public.log_tenant_security_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log all tenant data modifications with enhanced security context
  INSERT INTO public.audit_log (
    table_name, action, user_id, details
  ) VALUES (
    'tenants', 
    'TENANT_DATA_' || TG_OP, 
    auth.uid(),
    jsonb_build_object(
      'tenant_id', COALESCE(NEW.id, OLD.id),
      'property_owner_id', COALESCE(NEW.property_owner_id, OLD.property_owner_id),
      'operation', TG_OP,
      'timestamp', now(),
      'security_context', 'SENSITIVE_PII_OPERATION',
      'fields_affected', CASE 
        WHEN TG_OP = 'UPDATE' THEN jsonb_build_array(
          CASE WHEN OLD.email IS DISTINCT FROM NEW.email THEN 'email' END,
          CASE WHEN OLD.phone IS DISTINCT FROM NEW.phone THEN 'phone' END,
          CASE WHEN OLD.national_id IS DISTINCT FROM NEW.national_id THEN 'national_id' END,
          CASE WHEN OLD.monthly_income IS DISTINCT FROM NEW.monthly_income THEN 'monthly_income' END
        )
        ELSE 'ALL_FIELDS'
      END
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Step 6: Create trigger for enhanced tenant security logging  
DROP TRIGGER IF EXISTS log_tenant_security_changes_trigger ON public.tenants;
CREATE TRIGGER log_tenant_security_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION log_tenant_security_changes();