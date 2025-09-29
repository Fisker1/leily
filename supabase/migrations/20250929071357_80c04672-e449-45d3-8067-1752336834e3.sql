-- Fix the RPC function to not insert audit logs in read-only context
-- This version skips logging for edge function calls
CREATE OR REPLACE FUNCTION public.get_user_roles_for_edge_function(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_roles jsonb;
BEGIN
  -- Get all roles for the user without logging (to avoid read-only transaction issues)
  SELECT COALESCE(jsonb_agg(role), '[]'::jsonb)
  INTO user_roles
  FROM public.user_roles
  WHERE user_id = target_user_id;
  
  RETURN user_roles;
END;
$$;