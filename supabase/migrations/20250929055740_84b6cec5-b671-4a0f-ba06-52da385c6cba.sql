-- Fix the audit trigger functions that are causing JSON parsing errors

CREATE OR REPLACE FUNCTION public.audit_property_financial_access()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
        WHEN TG_OP = 'UPDATE' THEN 
          (SELECT jsonb_agg(field) FROM (
            SELECT unnest(ARRAY[
              CASE WHEN OLD.purchase_price IS DISTINCT FROM NEW.purchase_price THEN 'purchase_price' END,
              CASE WHEN OLD.loan_amount IS DISTINCT FROM NEW.loan_amount THEN 'loan_amount' END,
              CASE WHEN OLD.interest_rate IS DISTINCT FROM NEW.interest_rate THEN 'interest_rate' END,
              CASE WHEN OLD.current_value IS DISTINCT FROM NEW.current_value THEN 'current_value' END
            ]) AS field
          ) fields WHERE field IS NOT NULL)
        ELSE '["ALL_FIELDS"]'::jsonb
      END
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Also fix any similar issues in other audit functions
CREATE OR REPLACE FUNCTION public.log_tenant_security_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
        WHEN TG_OP = 'UPDATE' THEN 
          (SELECT jsonb_agg(field) FROM (
            SELECT unnest(ARRAY[
              CASE WHEN OLD.email IS DISTINCT FROM NEW.email THEN 'email' END,
              CASE WHEN OLD.phone IS DISTINCT FROM NEW.phone THEN 'phone' END,
              CASE WHEN OLD.national_id IS DISTINCT FROM NEW.national_id THEN 'national_id' END,
              CASE WHEN OLD.monthly_income IS DISTINCT FROM NEW.monthly_income THEN 'monthly_income' END
            ]) AS field
          ) fields WHERE field IS NOT NULL)
        ELSE '["ALL_FIELDS"]'::jsonb
      END
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;