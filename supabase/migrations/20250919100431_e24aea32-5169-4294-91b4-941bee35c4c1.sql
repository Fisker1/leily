-- Enhanced Property Financial Data Security

-- Add comprehensive audit logging for property access
CREATE OR REPLACE FUNCTION public.audit_property_financial_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log all property operations with financial data security context
  INSERT INTO public.audit_log (
    table_name, action, user_id, details
  ) VALUES (
    'properties', 
    'PROPERTY_' || TG_OP, 
    auth.uid(),
    jsonb_build_object(
      'property_id', COALESCE(NEW.id, OLD.id),
      'owner_id', COALESCE(NEW.owner_id, OLD.owner_id),
      'operation', TG_OP,
      'timestamp', now(),
      'security_level', 'HIGH_SENSITIVITY_FINANCIAL_DATA',
      'user_email', (SELECT email FROM auth.users WHERE id = auth.uid()),
      'address', COALESCE(NEW.address, OLD.address),
      -- Mask financial data in logs for privacy
      'purchase_price_masked', CASE 
        WHEN COALESCE(NEW.purchase_price, OLD.purchase_price) IS NOT NULL THEN
          'NOK ***' || right(COALESCE(NEW.purchase_price, OLD.purchase_price)::text, 3)
        ELSE NULL
      END,
      'loan_amount_masked', CASE 
        WHEN COALESCE(NEW.loan_amount, OLD.loan_amount) IS NOT NULL THEN
          'NOK ***' || right(COALESCE(NEW.loan_amount, OLD.loan_amount)::text, 3)
        ELSE NULL
      END,
      'current_value_masked', CASE 
        WHEN COALESCE(NEW.current_value, OLD.current_value) IS NOT NULL THEN
          'NOK ***' || right(COALESCE(NEW.current_value, OLD.current_value)::text, 3)
        ELSE NULL
      END,
      'financial_fields_accessed', CASE 
        WHEN TG_OP = 'UPDATE' THEN jsonb_build_array(
          CASE WHEN OLD.purchase_price IS DISTINCT FROM NEW.purchase_price THEN 'purchase_price' END,
          CASE WHEN OLD.loan_amount IS DISTINCT FROM NEW.loan_amount THEN 'loan_amount' END,
          CASE WHEN OLD.interest_rate IS DISTINCT FROM NEW.interest_rate THEN 'interest_rate' END,
          CASE WHEN OLD.current_value IS DISTINCT FROM NEW.current_value THEN 'current_value' END
        )
        ELSE 'ALL_FIELDS'
      END
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for property audit logging
DROP TRIGGER IF EXISTS property_financial_audit_trigger ON public.properties;
CREATE TRIGGER property_financial_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_property_financial_access();

-- Enhanced RLS policies with separate granular controls
DROP POLICY IF EXISTS "Users can manage own properties" ON public.properties;

-- Separate policies for different operations
CREATE POLICY "Users can view own properties" 
ON public.properties 
FOR SELECT 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can create own properties" 
ON public.properties 
FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own properties" 
ON public.properties 
FOR UPDATE 
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete own properties" 
ON public.properties 
FOR DELETE 
USING (auth.uid() = owner_id);

-- Function for secure property financial data access with additional validation
CREATE OR REPLACE FUNCTION public.get_property_financial_summary(property_owner_id uuid)
RETURNS TABLE(
  id uuid,
  address text,
  purchase_price_range text,
  estimated_equity_range text,
  monthly_rent numeric,
  property_type text,
  purchase_date date
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Strict validation: Only property owners can access financial data  
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'SECURITY ERROR: Authentication required';
  END IF;
  
  IF auth.uid() != property_owner_id THEN
    RAISE EXCEPTION 'SECURITY ERROR: Only property owners can access financial data';
  END IF;

  -- Log legitimate property owner access
  INSERT INTO public.audit_log (
    table_name, action, user_id, details
  ) VALUES (
    'properties', 'FINANCIAL_SUMMARY_ACCESS', auth.uid(),
    jsonb_build_object(
      'property_owner_id', property_owner_id,
      'timestamp', now(),
      'function', 'get_property_financial_summary',
      'data_type', 'FINANCIAL_SUMMARY_RANGES',
      'access_type', 'LEGITIMATE_OWNER_ACCESS'
    )
  );

  -- Return financial data with privacy-preserving ranges
  RETURN QUERY
  SELECT 
    p.id,
    p.address,
    -- Provide ranges instead of exact amounts for additional privacy
    CASE 
      WHEN p.purchase_price IS NULL THEN 'Not specified'
      WHEN p.purchase_price < 2000000 THEN 'Under 2M NOK'
      WHEN p.purchase_price < 5000000 THEN '2-5M NOK' 
      WHEN p.purchase_price < 10000000 THEN '5-10M NOK'
      ELSE 'Over 10M NOK'
    END as purchase_price_range,
    -- Calculate estimated equity in ranges
    CASE 
      WHEN p.current_value IS NULL OR p.loan_amount IS NULL THEN 'Cannot calculate'
      WHEN (p.current_value - COALESCE(p.loan_amount, 0)) < 500000 THEN 'Under 500K NOK'
      WHEN (p.current_value - COALESCE(p.loan_amount, 0)) < 1000000 THEN '500K-1M NOK'
      WHEN (p.current_value - COALESCE(p.loan_amount, 0)) < 2000000 THEN '1-2M NOK'
      ELSE 'Over 2M NOK'
    END as estimated_equity_range,
    p.monthly_rent,
    p.property_type,
    p.purchase_date
  FROM public.properties p
  WHERE p.owner_id = property_owner_id;
END;
$$;

-- Function to detect suspicious property access patterns
CREATE OR REPLACE FUNCTION public.monitor_property_security()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  suspicious_user uuid;
BEGIN
  -- Check for users accessing multiple properties in short time
  FOR suspicious_user IN 
    SELECT user_id 
    FROM public.audit_log 
    WHERE table_name = 'properties' 
      AND created_at > now() - interval '10 minutes'
      AND action LIKE 'PROPERTY_%'
    GROUP BY user_id 
    HAVING COUNT(DISTINCT details->>'property_id') > 10
  LOOP
    -- Log suspicious property access activity
    INSERT INTO public.audit_log (
      table_name, action, user_id, details
    ) VALUES (
      'security_monitoring', 'SUSPICIOUS_PROPERTY_ACCESS', suspicious_user,
      jsonb_build_object(
        'detection_type', 'BULK_PROPERTY_ACCESS',
        'timestamp', now(),
        'security_level', 'CRITICAL_FINANCIAL_ALERT',
        'recommended_action', 'INVESTIGATE_USER_ACTIVITY',
        'user_email', (SELECT email FROM auth.users WHERE id = suspicious_user),
        'detection_window', '10_minutes',
        'potential_threat', 'FINANCIAL_DATA_HARVESTING'
      )
    );
  END LOOP;
END;
$$;

-- Function to validate property ownership before sensitive operations
CREATE OR REPLACE FUNCTION public.validate_property_ownership(property_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  property_owner_id uuid;
  is_valid boolean;
BEGIN
  -- Get the property owner ID
  SELECT owner_id INTO property_owner_id
  FROM public.properties
  WHERE id = property_id;
  
  -- Validate ownership
  is_valid := (auth.uid() IS NOT NULL AND auth.uid() = property_owner_id);
  
  -- Log ownership validation for audit trail
  INSERT INTO public.audit_log (
    table_name, action, user_id, details
  ) VALUES (
    'properties', 'OWNERSHIP_VALIDATION', auth.uid(),
    jsonb_build_object(
      'property_id', property_id,
      'property_owner_id', property_owner_id,
      'ownership_valid', is_valid,
      'timestamp', now(),
      'validation_context', 'SENSITIVE_FINANCIAL_OPERATION'
    )
  );
  
  RETURN is_valid;
END;
$$;