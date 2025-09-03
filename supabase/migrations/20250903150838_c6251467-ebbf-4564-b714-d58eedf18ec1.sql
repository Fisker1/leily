-- Phase 1: Critical Security Fix - Admin Bootstrap Mechanism

-- Create a function to safely bootstrap the first admin user
CREATE OR REPLACE FUNCTION public.bootstrap_first_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  admin_count integer;
  bootstrap_email text;
BEGIN
  -- Get bootstrap admin email from secrets or set a default
  SELECT decrypted_secret INTO bootstrap_email 
  FROM vault.decrypted_secrets 
  WHERE name = 'BOOTSTRAP_ADMIN_EMAIL'
  LIMIT 1;
  
  -- If no bootstrap email is set, use a default pattern
  IF bootstrap_email IS NULL THEN
    bootstrap_email := 'admin@leily.no';
  END IF;

  -- Check if this is the first user and matches bootstrap email
  SELECT COUNT(*) INTO admin_count
  FROM public.user_roles
  WHERE role = 'admin';

  -- If no admins exist and this user matches bootstrap email, make them admin
  IF admin_count = 0 AND NEW.email = bootstrap_email THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
    
    -- Log the bootstrap admin creation
    INSERT INTO public.audit_log (
      table_name, 
      action, 
      user_id, 
      details
    ) VALUES (
      'user_roles',
      'bootstrap_admin_created',
      NEW.id,
      jsonb_build_object('email', NEW.email, 'timestamp', now())
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create audit log table for security events
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  action text NOT NULL,
  user_id uuid,
  details jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_log
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Create trigger for bootstrap admin on user creation
CREATE OR REPLACE TRIGGER bootstrap_admin_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.bootstrap_first_admin();

-- Add function to securely promote users to admin (only by existing admins)
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  is_caller_admin boolean;
BEGIN
  -- Check if caller is admin
  SELECT has_role(auth.uid(), 'admin') INTO is_caller_admin;
  
  IF NOT is_caller_admin THEN
    RAISE EXCEPTION 'Only administrators can promote users';
  END IF;
  
  -- Insert admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
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
$$;

-- Add data validation trigger for sensitive tenant data
CREATE OR REPLACE FUNCTION public.validate_tenant_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Validate Norwegian national ID format (basic check)
  IF NEW.national_id IS NOT NULL AND 
     NEW.national_id !~ '^[0-9]{11}$' THEN
    RAISE EXCEPTION 'Invalid national ID format';
  END IF;
  
  -- Validate email format
  IF NEW.email IS NOT NULL AND 
     NEW.email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Validate phone format (Norwegian)
  IF NEW.phone IS NOT NULL AND 
     NEW.phone !~ '^\+?47[0-9]{8}$|^[0-9]{8}$' THEN
    RAISE EXCEPTION 'Invalid Norwegian phone number format';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create validation trigger for tenants
CREATE TRIGGER validate_tenant_data_trigger
  BEFORE INSERT OR UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_tenant_data();

-- Enhanced RLS policy for more secure tenant access
DROP POLICY IF EXISTS "Users can manage own tenants" ON public.tenants;
DROP POLICY IF EXISTS "Users can view own tenants" ON public.tenants;

-- More restrictive tenant policies with audit logging
CREATE POLICY "Property owners can view their tenants"
ON public.tenants
FOR SELECT
USING (
  auth.uid() = property_owner_id AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Property owners can manage their tenants"
ON public.tenants
FOR ALL
USING (
  auth.uid() = property_owner_id AND
  auth.uid() IS NOT NULL
);

-- Add trigger to log sensitive data access
CREATE OR REPLACE FUNCTION public.log_tenant_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log access to sensitive tenant data
  IF TG_OP = 'SELECT' OR TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
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
        'timestamp', now(),
        'accessed_sensitive_data', true
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create audit trigger for tenant access
CREATE TRIGGER log_tenant_access_trigger
  AFTER SELECT OR UPDATE OR DELETE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.log_tenant_access();

-- Add constraints to prevent data quality issues
ALTER TABLE public.tenants 
ADD CONSTRAINT check_monthly_income_positive 
CHECK (monthly_income IS NULL OR monthly_income > 0);

ALTER TABLE public.properties
ADD CONSTRAINT check_purchase_price_positive 
CHECK (purchase_price IS NULL OR purchase_price > 0);

ALTER TABLE public.properties
ADD CONSTRAINT check_monthly_rent_positive 
CHECK (monthly_rent IS NULL OR monthly_rent > 0);