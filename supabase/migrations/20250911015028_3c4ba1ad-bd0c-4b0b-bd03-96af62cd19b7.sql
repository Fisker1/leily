-- FINAL SECURITY FIX: Restrict admin access to tenant data
-- This addresses the remaining critical security issue with overly broad admin access

-- Step 1: Remove the current admin policy that's too permissive
DROP POLICY IF EXISTS "Admin restricted tenant access" ON public.tenants;

-- Step 2: Create a much more restrictive admin access policy
-- Admins can only access tenant data for legitimate system administration purposes
-- and only through specific secure functions, not direct table access
CREATE POLICY "No direct admin access to tenant data"
ON public.tenants
FOR SELECT
TO authenticated
USING (
  -- Only property owners can directly access tenant data
  -- Admins must use secure functions with proper logging
  auth.uid() IS NOT NULL 
  AND property_owner_id IS NOT NULL 
  AND auth.uid() = property_owner_id
);

-- Step 3: Create a specific admin function for legitimate system administration
-- This function requires explicit justification and creates detailed audit logs
CREATE OR REPLACE FUNCTION public.admin_access_tenant_data(
  tenant_property_owner_id uuid,
  admin_justification text
)
RETURNS TABLE(
  id uuid, 
  first_name text, 
  last_name text, 
  email_partially_masked text, 
  phone_partially_masked text, 
  national_id_partially_masked text, 
  property_owner_id uuid,
  access_timestamp timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

-- Step 4: Create function to monitor and alert on suspicious admin activity
CREATE OR REPLACE FUNCTION public.monitor_admin_tenant_access()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

-- Step 5: Update existing secure function to be even more restrictive
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
  -- Ultra-strict validation: ONLY property owners can access their data
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'SECURITY ERROR: Authentication required';
  END IF;
  
  IF auth.uid() != tenant_property_owner_id THEN
    RAISE EXCEPTION 'SECURITY ERROR: Only property owners can access their tenant data. Admins must use admin_access_tenant_data() function with justification.';
  END IF;

  -- Log legitimate property owner access
  INSERT INTO public.audit_log (
    table_name, action, user_id, details
  ) VALUES (
    'tenants', 'PROPERTY_OWNER_ACCESS', auth.uid(),
    jsonb_build_object(
      'property_owner_id', tenant_property_owner_id,
      'timestamp', now(),
      'function', 'get_secure_tenant_data',
      'data_type', 'MASKED_PII',
      'access_type', 'LEGITIMATE_OWNER_ACCESS'
    )
  );

  -- Return masked data for property owners
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