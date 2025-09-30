-- Create the use_credits function to handle credit deduction
CREATE OR REPLACE FUNCTION public.use_credits(
  credits_to_use INTEGER,
  operation_type TEXT DEFAULT 'general'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_credits INTEGER;
  user_uuid UUID;
BEGIN
  -- Get the current user
  user_uuid := auth.uid();
  
  IF user_uuid IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Get current credits
  SELECT credits INTO current_credits
  FROM profiles
  WHERE id = user_uuid;
  
  -- If no profile found, create one with 0 credits
  IF current_credits IS NULL THEN
    INSERT INTO profiles (id, email, credits)
    VALUES (user_uuid, '', 0)
    ON CONFLICT (id) DO UPDATE SET credits = 0;
    current_credits := 0;
  END IF;
  
  -- Check if user has enough credits
  IF current_credits < credits_to_use THEN
    RETURN FALSE;
  END IF;
  
  -- Deduct credits
  UPDATE profiles
  SET credits = credits - credits_to_use,
      updated_at = now()
  WHERE id = user_uuid;
  
  -- Log the usage
  INSERT INTO audit_log (action, table_name, user_id, details)
  VALUES (
    'credits_used',
    'profiles',
    user_uuid,
    jsonb_build_object(
      'credits_used', credits_to_use,
      'operation_type', operation_type,
      'remaining_credits', current_credits - credits_to_use
    )
  );
  
  RETURN TRUE;
END;
$$;