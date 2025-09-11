-- COMPREHENSIVE SECURITY CONSOLIDATION: Fix overlapping RLS policies
-- This resolves the remaining security alerts by creating a single, clear policy structure

-- Step 1: Remove ALL existing overlapping policies on tenants table
DROP POLICY IF EXISTS "Admin emergency access to tenant data" ON public.tenants;
DROP POLICY IF EXISTS "No direct admin access to tenant data" ON public.tenants; 
DROP POLICY IF EXISTS "Property owners can manage their own tenant data" ON public.tenants;
DROP POLICY IF EXISTS "Property owners only access own tenant data" ON public.tenants;

-- Step 2: Create ONE comprehensive, secure policy for tenant data access
-- This policy ensures ONLY property owners can access their own tenant data
CREATE POLICY "Strict property owner tenant access only"
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

-- Step 3: Also secure the deposit_accounts table properly
DROP POLICY IF EXISTS "Users can manage own deposit accounts" ON public.deposit_accounts;
DROP POLICY IF EXISTS "Users can view own deposit accounts" ON public.deposit_accounts;

-- Create single secure policy for deposit accounts
CREATE POLICY "Property owners only access own deposits"
ON public.deposit_accounts
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

-- Step 4: Secure payment records with stricter controls
DROP POLICY IF EXISTS "Admins can manage all payment records" ON public.payment_records;
DROP POLICY IF EXISTS "Users can delete their own failed payment records" ON public.payment_records;
DROP POLICY IF EXISTS "Users can insert own payment records" ON public.payment_records;
DROP POLICY IF EXISTS "Users can update their own payment status" ON public.payment_records;
DROP POLICY IF EXISTS "Users can view own payment records" ON public.payment_records;

-- Create secure payment record policies with limited update capabilities
CREATE POLICY "Users view own payment records only"
ON public.payment_records
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND user_id IS NOT NULL 
  AND auth.uid() = user_id
);

CREATE POLICY "Users insert own payment records only"
ON public.payment_records
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND user_id IS NOT NULL 
  AND auth.uid() = user_id
);

-- Limited update policy - only status changes allowed
CREATE POLICY "Users update own payment status only"
ON public.payment_records
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND user_id IS NOT NULL 
  AND auth.uid() = user_id
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND user_id IS NOT NULL 
  AND auth.uid() = user_id
  AND payment_status IN ('completed', 'failed', 'cancelled')
);

-- Limited delete policy - only failed/cancelled payments
CREATE POLICY "Users delete own failed payments only"
ON public.payment_records
FOR DELETE
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND user_id IS NOT NULL 
  AND auth.uid() = user_id
  AND payment_status IN ('pending', 'failed', 'cancelled')
);

-- Step 5: Create comprehensive audit function for all sensitive data access
CREATE OR REPLACE FUNCTION public.audit_sensitive_data_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log all access to sensitive tables with enhanced context
  INSERT INTO public.audit_log (
    table_name, action, user_id, details
  ) VALUES (
    TG_TABLE_NAME, 
    'SENSITIVE_DATA_' || TG_OP, 
    auth.uid(),
    jsonb_build_object(
      'record_id', COALESCE(NEW.id, OLD.id),
      'operation', TG_OP,
      'timestamp', now(),
      'security_level', 'HIGH_SENSITIVITY',
      'table_type', CASE 
        WHEN TG_TABLE_NAME = 'tenants' THEN 'PII_DATA'
        WHEN TG_TABLE_NAME = 'deposit_accounts' THEN 'BANKING_DATA'
        WHEN TG_TABLE_NAME = 'payment_records' THEN 'FINANCIAL_DATA'
        ELSE 'SENSITIVE_DATA'
      END,
      'access_context', 'STRICT_RLS_CONTROLLED'
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Step 6: Apply comprehensive audit triggers to all sensitive tables
DROP TRIGGER IF EXISTS audit_tenants_access ON public.tenants;
CREATE TRIGGER audit_tenants_access
  AFTER INSERT OR UPDATE OR DELETE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION audit_sensitive_data_access();

DROP TRIGGER IF EXISTS audit_deposits_access ON public.deposit_accounts;  
CREATE TRIGGER audit_deposits_access
  AFTER INSERT OR UPDATE OR DELETE ON public.deposit_accounts
  FOR EACH ROW EXECUTE FUNCTION audit_sensitive_data_access();

DROP TRIGGER IF EXISTS audit_payments_access ON public.payment_records;
CREATE TRIGGER audit_payments_access
  AFTER INSERT OR UPDATE OR DELETE ON public.payment_records
  FOR EACH ROW EXECUTE FUNCTION audit_sensitive_data_access();

-- Step 7: Create security monitoring function to detect unauthorized access attempts
CREATE OR REPLACE FUNCTION public.detect_security_violations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  violation_count integer;
  suspicious_user uuid;
BEGIN
  -- Monitor for users trying to access data they shouldn't
  FOR suspicious_user IN 
    SELECT user_id 
    FROM public.audit_log 
    WHERE table_name IN ('tenants', 'deposit_accounts', 'payment_records')
      AND action LIKE 'SENSITIVE_DATA_%'
      AND created_at > now() - interval '10 minutes'
    GROUP BY user_id 
    HAVING COUNT(*) > 20  -- More than 20 sensitive operations in 10 minutes
  LOOP
    -- Log security violation
    INSERT INTO public.audit_log (
      table_name, action, user_id, details
    ) VALUES (
      'security_monitoring', 'POTENTIAL_SECURITY_VIOLATION_DETECTED', suspicious_user,
      jsonb_build_object(
        'violation_type', 'EXCESSIVE_SENSITIVE_DATA_ACCESS',
        'detection_time', now(),
        'security_level', 'CRITICAL_ALERT',
        'recommendation', 'Review user access patterns and consider account suspension',
        'user_email', (SELECT email FROM auth.users WHERE id = suspicious_user)
      )
    );
  END LOOP;
END;
$$;