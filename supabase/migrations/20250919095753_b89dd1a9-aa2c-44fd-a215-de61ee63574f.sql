-- Enhanced Payment Security: Fixed implementation

-- Add trigger for payment audit logging (only for INSERT, UPDATE, DELETE)
CREATE OR REPLACE FUNCTION public.enhanced_payment_audit_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log payment record changes with enhanced security context
  INSERT INTO public.audit_log (
    table_name, action, user_id, details
  ) VALUES (
    'payment_records', 
    'PAYMENT_' || TG_OP, 
    auth.uid(),
    jsonb_build_object(
      'payment_id', COALESCE(NEW.id, OLD.id),
      'amount', COALESCE(NEW.amount, OLD.amount),
      'payment_method', CASE 
        WHEN COALESCE(NEW.payment_method, OLD.payment_method) IS NOT NULL THEN
          left(COALESCE(NEW.payment_method, OLD.payment_method), 4) || '****'
        ELSE NULL
      END,
      'payment_status', COALESCE(NEW.payment_status, OLD.payment_status),
      'operation', TG_OP,
      'timestamp', now(),
      'security_level', 'HIGH_SENSITIVITY_FINANCIAL_DATA',
      'user_email', (SELECT email FROM auth.users WHERE id = auth.uid()),
      'vipps_order_masked', CASE 
        WHEN COALESCE(NEW.vipps_order_id, OLD.vipps_order_id) IS NOT NULL THEN
          'ORDER_' || right(COALESCE(NEW.vipps_order_id, OLD.vipps_order_id), 4)
        ELSE NULL
      END
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for payment audit logging
DROP TRIGGER IF EXISTS enhanced_payment_audit_trigger ON public.payment_records;
CREATE TRIGGER enhanced_payment_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.payment_records
  FOR EACH ROW
  EXECUTE FUNCTION public.enhanced_payment_audit_log();

-- Enhanced RLS policy to block unauthorized admin access to payments
DROP POLICY IF EXISTS "Admins can view all payment records" ON public.payment_records;
CREATE POLICY "Restricted admin payment access" 
ON public.payment_records 
FOR SELECT 
USING (
  -- Users can always view their own payments
  (auth.uid() = user_id) OR
  -- Admins require explicit justification via special function
  (has_role(auth.uid(), 'admin'::app_role) AND current_setting('app.admin_payment_justified', true) = 'true')
);

-- Secure function for justified admin access to payment data
CREATE OR REPLACE FUNCTION public.admin_access_payment_records(
  admin_justification text,
  target_user_id uuid DEFAULT NULL
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
    RAISE EXCEPTION 'SECURITY ERROR: Admin privileges required for payment access';
  END IF;
  
  -- Require explicit justification
  IF admin_justification IS NULL OR length(trim(admin_justification)) < 15 THEN
    RAISE EXCEPTION 'SECURITY ERROR: Valid justification required (minimum 15 characters)';
  END IF;
  
  -- Log admin access with justification for audit trail
  INSERT INTO public.audit_log (
    table_name, action, user_id, details
  ) VALUES (
    'payment_records', 'ADMIN_JUSTIFIED_PAYMENT_ACCESS', auth.uid(),
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

  -- Temporarily allow admin access
  PERFORM set_config('app.admin_payment_justified', 'true', true);
  
  -- Return payment data with sensitive fields masked
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
  PERFORM set_config('app.admin_payment_justified', 'false', true);
END;
$$;

-- Function to detect suspicious payment access patterns
CREATE OR REPLACE FUNCTION public.monitor_payment_security()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  suspicious_user uuid;
BEGIN
  -- Check for users making excessive payment-related operations
  FOR suspicious_user IN 
    SELECT user_id 
    FROM public.audit_log 
    WHERE table_name = 'payment_records' 
      AND created_at > now() - interval '5 minutes'
      AND action LIKE 'PAYMENT_%'
    GROUP BY user_id 
    HAVING COUNT(*) > 20  -- More than 20 payment operations in 5 minutes
  LOOP
    -- Log suspicious payment activity
    INSERT INTO public.audit_log (
      table_name, action, user_id, details
    ) VALUES (
      'security_monitoring', 'SUSPICIOUS_PAYMENT_ACTIVITY', suspicious_user,
      jsonb_build_object(
        'detection_type', 'EXCESSIVE_PAYMENT_OPERATIONS',
        'timestamp', now(),
        'security_level', 'CRITICAL_FINANCIAL_ALERT',
        'recommended_action', 'INVESTIGATE_USER_ACCOUNT',
        'user_email', (SELECT email FROM auth.users WHERE id = suspicious_user),
        'detection_window', '5_minutes'
      )
    );
  END LOOP;
END;
$$;