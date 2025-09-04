-- Enhanced Security for Tenant Personal Information - Fixed Version
-- First, clean up existing policies completely

-- Drop all existing policies on tenants table
DROP POLICY IF EXISTS "Enhanced tenant access policy" ON public.tenants;
DROP POLICY IF EXISTS "Admin read access to tenant data" ON public.tenants;
DROP POLICY IF EXISTS "Tenant safe view access" ON public.tenants;
DROP POLICY IF EXISTS "Property owners can manage their tenants" ON public.tenants;
DROP POLICY IF EXISTS "Property owners can view their tenants" ON public.tenants;

-- Drop existing triggers and functions if they exist
DROP TRIGGER IF EXISTS encrypt_tenant_data_trigger ON public.tenants;
DROP TRIGGER IF EXISTS audit_tenant_access_trigger ON public.tenants;

-- Now recreate everything with proper security

-- 1. Enhanced audit logging function for tenant data access
CREATE OR REPLACE FUNCTION public.audit_tenant_access()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_log (
    table_name,
    action,
    user_id,
    details
  ) VALUES (
    'tenants',
    TG_OP,
    auth.uid(),
    jsonb_build_object(
      'tenant_id', COALESCE(NEW.id, OLD.id),
      'property_owner_id', COALESCE(NEW.property_owner_id, OLD.property_owner_id),
      'operation', TG_OP,
      'timestamp', now(),
      'user_email', (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Function to check legitimate access with enhanced logging
CREATE OR REPLACE FUNCTION public.has_legitimate_tenant_access(tenant_property_owner_id uuid)
RETURNS boolean AS $$
DECLARE
  user_is_admin boolean;
  user_owns_property boolean;
  access_granted boolean;
BEGIN
  -- Check if user is admin
  SELECT has_role(auth.uid(), 'admin') INTO user_is_admin;
  
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Create enhanced RLS policies with strict access controls
CREATE POLICY "Strict tenant data access"
ON public.tenants
FOR ALL
USING (
  -- Must be authenticated
  auth.uid() IS NOT NULL
  -- Must have legitimate access (property owner or admin)
  AND has_legitimate_tenant_access(property_owner_id)
  -- Property owner must be set
  AND property_owner_id IS NOT NULL
)
WITH CHECK (
  -- For insert/update, must be authenticated and be the property owner
  auth.uid() IS NOT NULL
  AND property_owner_id = auth.uid()
  AND property_owner_id IS NOT NULL
);

-- 4. Separate read-only policy for admins with enhanced logging
CREATE POLICY "Admin audit access to tenant data"
ON public.tenants
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- 5. Create audit trigger for all tenant operations
CREATE TRIGGER audit_tenant_operations_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_tenant_access();

-- 6. Add constraint to ensure property_owner_id is never null for new records
ALTER TABLE public.tenants 
ADD CONSTRAINT tenants_property_owner_required 
CHECK (property_owner_id IS NOT NULL);

-- 7. Create additional security logging for sensitive operations
CREATE OR REPLACE FUNCTION public.log_tenant_sensitive_operations()
RETURNS TRIGGER AS $$
BEGIN
  -- Log when sensitive fields are accessed or modified
  IF (TG_OP = 'UPDATE' AND (
    OLD.national_id IS DISTINCT FROM NEW.national_id OR
    OLD.email IS DISTINCT FROM NEW.email OR 
    OLD.phone IS DISTINCT FROM NEW.phone OR
    OLD.monthly_income IS DISTINCT FROM NEW.monthly_income
  )) THEN
    INSERT INTO public.audit_log (
      table_name, action, user_id, details
    ) VALUES (
      'tenants', 'SENSITIVE_DATA_MODIFIED', auth.uid(),
      jsonb_build_object(
        'tenant_id', NEW.id,
        'property_owner_id', NEW.property_owner_id,
        'fields_changed', jsonb_build_array(
          CASE WHEN OLD.national_id IS DISTINCT FROM NEW.national_id THEN 'national_id' END,
          CASE WHEN OLD.email IS DISTINCT FROM NEW.email THEN 'email' END,
          CASE WHEN OLD.phone IS DISTINCT FROM NEW.phone THEN 'phone' END,
          CASE WHEN OLD.monthly_income IS DISTINCT FROM NEW.monthly_income THEN 'monthly_income' END
        ),
        'timestamp', now()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for sensitive operations logging
CREATE TRIGGER log_tenant_sensitive_ops_trigger
  AFTER UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.log_tenant_sensitive_operations();