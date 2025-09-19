-- Enhanced Payment Security: Add additional audit logging and stricter controls

-- Add trigger for enhanced payment audit logging
CREATE OR REPLACE FUNCTION public.enhanced_payment_audit_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log all payment record access with enhanced security context
  INSERT INTO public.audit_log (
    table_name, action, user_id, details
  ) VALUES (
    'payment_records', 
    'PAYMENT_' || TG_OP, 
    auth.uid(),
    jsonb_build_object(
      'payment_id', COALESCE(NEW.id, OLD.id),
      'amount', COALESCE(NEW.amount, OLD.amount),
      'payment_method', COALESCE(NEW.payment_method, OLD.payment_method),
      'payment_status', COALESCE(NEW.payment_status, OLD.payment_status),
      'operation', TG_OP,
      'timestamp', now(),
      'security_level', 'HIGH_SENSITIVITY_FINANCIAL_DATA',
      'user_email', (SELECT email FROM auth.users WHERE id = auth.uid()),
      'vipps_order_id', CASE 
        WHEN TG_OP = 'SELECT' THEN '[REDACTED_FOR_AUDIT]'
        ELSE COALESCE(NEW.vipps_order_id, OLD.vipps_order_id)
      END
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for payment audit logging
DROP TRIGGER IF EXISTS enhanced_payment_audit_trigger ON public.payment_records;
CREATE TRIGGER enhanced_payment_audit_trigger
  AFTER SELECT OR INSERT OR UPDATE OR DELETE ON public.payment_records
  FOR EACH ROW
  EXECUTE FUNCTION public.enhanced_payment_audit_log();

-- Enhanced RLS policy to block any potential admin overreach on payments
DROP POLICY IF EXISTS "Admins can view all payment records" ON public.payment_records;
CREATE POLICY "Admins require justification for payment access" 
ON public.payment_records 
FOR SELECT 
USING (
  -- Users can always view their own payments
  (auth.uid() = user_id) OR
  -- Admins can only view with explicit function call (for audit trail)
  (has_role(auth.uid(), 'admin'::app_role) AND current_setting('app.admin_payment_access', true) = 'justified')
);

-- Function for admin to access payment data with justification
CREATE OR REPLACE FUNCTION public.admin_access_payment_data(
  target_user_id uuid DEFAULT NULL,
  admin_justification text DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  amount numeric,
  payment_type text,
  payment_status text,
  created_at timestamp with time zone,
  currency text,
  payment_method_masked text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  IF admin_justification IS NULL OR length(trim(admin_justification)) < 15 THEN
    RAISE EXCEPTION 'SECURITY ERROR: Valid justification required (minimum 15 characters)';
  END IF;
  
  -- Set configuration to allow admin access
  PERFORM set_config('app.admin_payment_access', 'justified', true);
  
  -- Log admin access with justification
  INSERT INTO public.audit_log (
    table_name, action, user_id, details
  ) VALUES (
    'payment_records', 'ADMIN_JUSTIFIED_ACCESS', auth.uid(),
    jsonb_build_object(
      'target_user_id', target_user_id,
      'justification', admin_justification,
      'timestamp', now(),
      'security_level', 'CRITICAL_ADMIN_FINANCIAL_ACCESS',
      'admin_email', (SELECT email FROM auth.users WHERE id = auth.uid()),
      'access_scope', CASE 
        WHEN target_user_id IS NULL THEN 'ALL_PAYMENT_RECORDS'
        ELSE 'SPECIFIC_USER_PAYMENTS'
      END
    )
  );

  -- Return payment data with sensitive fields masked even for admins
  RETURN QUERY
  SELECT 
    pr.id,
    pr.user_id,
    pr.amount,
    pr.payment_type,
    pr.payment_status,
    pr.created_at,
    pr.currency,
    -- Mask payment method details even for admins
    CASE 
      WHEN pr.payment_method IS NOT NULL THEN
        left(pr.payment_method, 4) || '****'
      ELSE NULL
    END as payment_method_masked
  FROM public.payment_records pr
  WHERE (target_user_id IS NULL OR pr.user_id = target_user_id);
  
  -- Reset the configuration
  PERFORM set_config('app.admin_payment_access', '', true);
END;
$$;

-- Add function to detect suspicious payment access patterns
CREATE OR REPLACE FUNCTION public.detect_payment_fraud_patterns()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  suspicious_user uuid;
  access_count integer;
BEGIN
  -- Check for users making excessive payment queries
  FOR suspicious_user IN 
    SELECT user_id 
    FROM public.audit_log 
    WHERE table_name = 'payment_records' 
      AND action LIKE 'PAYMENT_%'
      AND created_at > now() - interval '10 minutes'
    GROUP BY user_id 
    HAVING COUNT(*) > 50  -- More than 50 payment operations in 10 minutes
  LOOP
    -- Log suspicious payment activity
    INSERT INTO public.audit_log (
      table_name, action, user_id, details
    ) VALUES (
      'security_monitoring', 'SUSPICIOUS_PAYMENT_ACCESS_DETECTED', suspicious_user,
      jsonb_build_object(
        'detection_type', 'EXCESSIVE_PAYMENT_QUERIES',
        'timestamp', now(),
        'security_level', 'CRITICAL_FINANCIAL_SECURITY_ALERT',
        'recommended_action', 'IMMEDIATE_ACCOUNT_INVESTIGATION',
        'user_email', (SELECT email FROM auth.users WHERE id = suspicious_user)
      )
    );
  END LOOP;
END;
$$;