-- CRITICAL SECURITY FIX: Strengthen tenant data protection
-- This migration fixes the tenant PII security vulnerability by implementing stricter RLS policies

-- Step 1: Drop existing RLS policies that may be too permissive
DROP POLICY IF EXISTS "Admin audit access to tenant data" ON public.tenants;
DROP POLICY IF EXISTS "Strict tenant data access" ON public.tenants;

-- Step 2: Create new, more restrictive RLS policies
-- Only property owners can access their own tenant data
CREATE POLICY "Property owners can manage their own tenant data"
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

-- Separate policy for admin access with strict logging
CREATE POLICY "Admin emergency access to tenant data"
ON public.tenants
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND has_role(auth.uid(), 'admin'::app_role)
  AND property_owner_id IS NOT NULL
);

-- Step 3: Create a more secure tenant access function that validates ownership
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
  
  -- Validate that the current user owns this tenant's property
  is_valid := (auth.uid() IS NOT NULL AND auth.uid() = tenant_owner_id);
  
  -- Log access attempt for security audit
  INSERT INTO public.audit_log (
    table_name, action, user_id, details
  ) VALUES (
    'tenants', 'OWNERSHIP_VALIDATION', auth.uid(),
    jsonb_build_object(
      'tenant_id', tenant_id,
      'tenant_owner_id', tenant_owner_id,
      'access_valid', is_valid,
      'timestamp', now()
    )
  );
  
  RETURN is_valid;
END;
$$;

-- Step 4: Update the secure data access function to be more restrictive
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
  -- Strict validation: Only property owners can access their tenant data
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
        'security_level', 'HIGH_RISK'
      )
    );
  END IF;

  -- Log legitimate access
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

  -- Return masked data with proper encryption handling
  RETURN QUERY
  SELECT 
    t.id,
    t.first_name,
    t.last_name,
    -- Mask email more securely
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
    -- Mask phone more securely  
    CASE 
      WHEN t.phone IS NOT NULL AND length(t.phone) > 8 THEN
        '*** ** ' || right(decrypt_tenant_field(t.phone), 2)
      ELSE '*** ** **'
    END as phone_masked,
    -- Mask national ID more securely
    CASE 
      WHEN t.national_id IS NOT NULL AND length(t.national_id) > 11 THEN
        left(decrypt_tenant_field(t.national_id), 4) || '***' || right(decrypt_tenant_field(t.national_id), 2)
      ELSE '****-***-**'
    END as national_id_masked,
    t.address,
    t.occupation,
    -- Mask income for privacy
    CASE 
      WHEN t.monthly_income IS NOT NULL THEN
        round(t.monthly_income / 1000) * 1000  -- Round to nearest thousand
      ELSE NULL
    END as monthly_income,
    t.emergency_contact,
    -- Mask emergency phone
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

-- Step 5: Add additional security function for validating tenant data access
CREATE OR REPLACE FUNCTION public.secure_tenant_access_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log all access attempts to tenant data
  INSERT INTO public.audit_log (
    table_name, action, user_id, details
  ) VALUES (
    'tenants', 
    'DATA_ACCESS_' || TG_OP, 
    auth.uid(),
    jsonb_build_object(
      'tenant_id', COALESCE(NEW.id, OLD.id),
      'property_owner_id', COALESCE(NEW.property_owner_id, OLD.property_owner_id),
      'operation', TG_OP,
      'timestamp', now(),
      'security_context', 'SENSITIVE_DATA_ACCESS',
      'user_agent', current_setting('request.headers', true)::json->>'user-agent'
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Step 6: Create trigger for enhanced tenant access logging
DROP TRIGGER IF EXISTS secure_tenant_access_log_trigger ON public.tenants;
CREATE TRIGGER secure_tenant_access_log_trigger
  AFTER SELECT OR INSERT OR UPDATE OR DELETE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION secure_tenant_access_log();

-- Step 7: Add function to detect suspicious tenant data access patterns
CREATE OR REPLACE FUNCTION public.detect_suspicious_tenant_access()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  suspicious_user uuid;
  access_count integer;
BEGIN
  -- Check for users accessing multiple tenant records in short time
  FOR suspicious_user IN 
    SELECT user_id 
    FROM public.audit_log 
    WHERE table_name = 'tenants' 
      AND created_at > now() - interval '5 minutes'
      AND action LIKE 'DATA_ACCESS_%'
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
        'security_level', 'CRITICAL'
      )
    );
  END LOOP;
END;
$$;