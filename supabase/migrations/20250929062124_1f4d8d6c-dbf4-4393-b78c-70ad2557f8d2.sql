-- Add credits column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN credits INTEGER DEFAULT 0;

-- Update existing profiles to have 0 credits by default
UPDATE public.profiles SET credits = 0 WHERE credits IS NULL;

-- Create index for performance
CREATE INDEX idx_profiles_credits ON public.profiles(credits);

-- Create audit trigger for credits changes
CREATE OR REPLACE FUNCTION public.audit_credits_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.audit_log (
    table_name, action, user_id, details
  ) VALUES (
    'profiles', 
    'CREDITS_' || TG_OP, 
    auth.uid(),
    jsonb_build_object(
      'user_id', COALESCE(NEW.id, OLD.id),
      'old_credits', COALESCE(OLD.credits, 0),
      'new_credits', COALESCE(NEW.credits, 0),
      'credits_change', COALESCE(NEW.credits, 0) - COALESCE(OLD.credits, 0),
      'timestamp', now(),
      'security_level', 'HIGH_CREDITS_OPERATION'
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Attach credits audit trigger
CREATE TRIGGER audit_credits_changes_trigger
  AFTER UPDATE OF credits ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_credits_changes();

-- Create function to safely update credits (admin only or payment verified)
CREATE OR REPLACE FUNCTION public.add_credits_to_user(
  target_user_id uuid, 
  credits_amount integer,
  justification text DEFAULT 'credits_purchase'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  is_admin boolean;
BEGIN
  -- Check if caller is admin
  SELECT has_role(auth.uid(), 'admin'::app_role) INTO is_admin;
  
  IF NOT is_admin AND auth.uid() != target_user_id THEN
    RAISE EXCEPTION 'SECURITY ERROR: Only admins or the user themselves can add credits';
  END IF;
  
  -- Add credits
  UPDATE public.profiles
  SET credits = COALESCE(credits, 0) + credits_amount,
      updated_at = now()
  WHERE id = target_user_id;
  
  -- Log the transaction
  INSERT INTO public.audit_log (
    table_name, action, user_id, details
  ) VALUES (
    'profiles', 'CREDITS_ADDED', auth.uid(),
    jsonb_build_object(
      'target_user_id', target_user_id,
      'credits_added', credits_amount,
      'justification', justification,
      'timestamp', now(),
      'is_admin_action', is_admin
    )
  );
  
  RETURN TRUE;
END;
$$;

-- Create function to use credits (deduct)
CREATE OR REPLACE FUNCTION public.use_credits(
  credits_to_use integer DEFAULT 1,
  operation_type text DEFAULT 'ai_interaction'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_credits integer;
  user_is_admin boolean;
  user_is_ambassador boolean;
BEGIN
  -- Check if user is admin or ambassador (free access)
  SELECT has_role(auth.uid(), 'admin'::app_role) INTO user_is_admin;
  SELECT has_role(auth.uid(), 'ambassador'::app_role) INTO user_is_ambassador;
  
  -- Admins and ambassadors get free access
  IF user_is_admin OR user_is_ambassador THEN
    INSERT INTO public.audit_log (
      table_name, action, user_id, details
    ) VALUES (
      'profiles', 'FREE_CREDITS_USED', auth.uid(),
      jsonb_build_object(
        'credits_used', credits_to_use,
        'operation_type', operation_type,
        'reason', CASE 
          WHEN user_is_admin THEN 'admin_privilege'
          WHEN user_is_ambassador THEN 'ambassador_privilege'
        END,
        'timestamp', now()
      )
    );
    RETURN TRUE;
  END IF;
  
  -- Get current credits
  SELECT COALESCE(credits, 0) INTO current_credits
  FROM public.profiles
  WHERE id = auth.uid();
  
  -- Check if enough credits
  IF current_credits < credits_to_use THEN
    RETURN FALSE;
  END IF;
  
  -- Deduct credits
  UPDATE public.profiles
  SET credits = credits - credits_to_use,
      updated_at = now()
  WHERE id = auth.uid();
  
  -- Log the usage
  INSERT INTO public.audit_log (
    table_name, action, user_id, details
  ) VALUES (
    'profiles', 'CREDITS_USED', auth.uid(),
    jsonb_build_object(
      'credits_used', credits_to_use,
      'operation_type', operation_type,
      'remaining_credits', current_credits - credits_to_use,
      'timestamp', now()
    )
  );
  
  RETURN TRUE;
END;
$$;