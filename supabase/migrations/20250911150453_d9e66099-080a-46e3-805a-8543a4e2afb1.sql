-- CRITICAL SECURITY FIX: Prevent subscription privilege escalation
-- Phase 1: Create secure subscription validation function

CREATE OR REPLACE FUNCTION public.validate_subscription_update()
RETURNS TRIGGER AS $$
DECLARE
  is_admin boolean;
  old_tier text;
  new_tier text;
BEGIN
  -- Check if user is admin
  SELECT has_role(auth.uid(), 'admin'::app_role) INTO is_admin;
  
  old_tier := COALESCE(OLD.subscription_tier, 'free');
  new_tier := COALESCE(NEW.subscription_tier, 'free');
  
  -- If subscription tier is being changed
  IF old_tier IS DISTINCT FROM new_tier THEN
    -- Only admins or system can upgrade subscription tiers
    IF NOT is_admin AND auth.uid() = NEW.id THEN
      -- Log unauthorized upgrade attempt
      INSERT INTO public.audit_log (
        table_name, action, user_id, details
      ) VALUES (
        'profiles', 'UNAUTHORIZED_SUBSCRIPTION_UPGRADE_ATTEMPT', auth.uid(),
        jsonb_build_object(
          'attempted_upgrade', jsonb_build_object(
            'from', old_tier,
            'to', new_tier
          ),
          'timestamp', now(),
          'security_level', 'CRITICAL_SECURITY_VIOLATION',
          'user_email', (SELECT email FROM auth.users WHERE id = auth.uid()),
          'blocked', true
        )
      );
      
      RAISE EXCEPTION 'SECURITY ERROR: Users cannot upgrade their own subscription tier. Subscription changes must be processed through payment system or admin functions.';
    END IF;
    
    -- Log legitimate admin upgrade
    IF is_admin THEN
      INSERT INTO public.audit_log (
        table_name, action, user_id, details
      ) VALUES (
        'profiles', 'ADMIN_SUBSCRIPTION_CHANGE', auth.uid(),
        jsonb_build_object(
          'target_user_id', NEW.id,
          'subscription_change', jsonb_build_object(
            'from', old_tier,
            'to', new_tier
          ),
          'timestamp', now(),
          'admin_email', (SELECT email FROM auth.users WHERE id = auth.uid())
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to validate subscription updates
CREATE TRIGGER validate_subscription_security
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW 
  EXECUTE FUNCTION public.validate_subscription_update();

-- Phase 2: Create secure admin function for subscription management
CREATE OR REPLACE FUNCTION public.admin_update_subscription(
  target_user_id uuid,
  new_subscription_tier text,
  new_subscription_end timestamp with time zone,
  admin_justification text
) RETURNS boolean AS $$
DECLARE
  is_caller_admin boolean;
BEGIN
  -- Strict admin validation
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'SECURITY ERROR: Authentication required';
  END IF;
  
  SELECT has_role(auth.uid(), 'admin'::app_role) INTO is_caller_admin;
  
  IF NOT is_caller_admin THEN
    RAISE EXCEPTION 'SECURITY ERROR: Admin privileges required for subscription management';
  END IF;
  
  -- Require justification
  IF admin_justification IS NULL OR length(trim(admin_justification)) < 10 THEN
    RAISE EXCEPTION 'SECURITY ERROR: Valid justification required (minimum 10 characters)';
  END IF;
  
  -- Update subscription with admin override
  UPDATE public.profiles
  SET 
    subscription_tier = new_subscription_tier,
    subscription_end = new_subscription_end,
    updated_at = now()
  WHERE id = target_user_id;
  
  -- Log admin subscription change with justification
  INSERT INTO public.audit_log (
    table_name, action, user_id, details
  ) VALUES (
    'profiles', 'ADMIN_SUBSCRIPTION_UPDATE_WITH_JUSTIFICATION', auth.uid(),
    jsonb_build_object(
      'target_user_id', target_user_id,
      'new_subscription_tier', new_subscription_tier,
      'new_subscription_end', new_subscription_end,
      'justification', admin_justification,
      'timestamp', now(),
      'security_level', 'ADMIN_PRIVILEGED_OPERATION',
      'admin_email', (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Phase 3: Enhanced monitoring for suspicious subscription activity
CREATE OR REPLACE FUNCTION public.monitor_subscription_violations()
RETURNS void AS $$
DECLARE
  violation_user uuid;
BEGIN
  -- Check for users with multiple failed subscription upgrade attempts
  FOR violation_user IN 
    SELECT user_id 
    FROM public.audit_log 
    WHERE action = 'UNAUTHORIZED_SUBSCRIPTION_UPGRADE_ATTEMPT'
      AND created_at > now() - interval '1 hour'
    GROUP BY user_id 
    HAVING COUNT(*) > 3  -- More than 3 attempts in 1 hour is suspicious
  LOOP
    -- Log critical security alert
    INSERT INTO public.audit_log (
      table_name, action, user_id, details
    ) VALUES (
      'security_monitoring', 'REPEATED_SUBSCRIPTION_VIOLATION_DETECTED', violation_user,
      jsonb_build_object(
        'violation_type', 'REPEATED_UNAUTHORIZED_SUBSCRIPTION_ATTEMPTS',
        'detection_time', now(),
        'security_level', 'CRITICAL_SECURITY_ALERT',
        'recommendation', 'IMMEDIATE_ACCOUNT_REVIEW_REQUIRED',
        'user_email', (SELECT email FROM auth.users WHERE id = violation_user),
        'automatic_detection', true
      )
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Phase 4: Create payment-verified subscription function (for future payment integration)
CREATE OR REPLACE FUNCTION public.process_paid_subscription_upgrade(
  user_id uuid,
  payment_id uuid,
  new_tier text,
  duration_months integer DEFAULT 12
) RETURNS boolean AS $$
DECLARE
  payment_verified boolean DEFAULT FALSE;
BEGIN
  -- Verify payment record exists and is completed
  SELECT (payment_status = 'completed') INTO payment_verified
  FROM public.payment_records
  WHERE id = payment_id AND user_id = process_paid_subscription_upgrade.user_id;
  
  IF NOT payment_verified THEN
    RAISE EXCEPTION 'SECURITY ERROR: Valid completed payment required for subscription upgrade';
  END IF;
  
  -- Process legitimate paid upgrade
  UPDATE public.profiles
  SET 
    subscription_tier = new_tier,
    subscription_end = now() + (duration_months || ' months')::interval,
    updated_at = now()
  WHERE id = process_paid_subscription_upgrade.user_id;
  
  -- Log legitimate paid upgrade
  INSERT INTO public.audit_log (
    table_name, action, user_id, details
  ) VALUES (
    'profiles', 'PAID_SUBSCRIPTION_UPGRADE', process_paid_subscription_upgrade.user_id,
    jsonb_build_object(
      'payment_id', payment_id,
      'new_tier', new_tier,
      'duration_months', duration_months,
      'timestamp', now(),
      'verification_method', 'PAYMENT_VERIFIED'
    )
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;