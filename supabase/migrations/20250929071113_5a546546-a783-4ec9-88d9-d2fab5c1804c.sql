-- Create a security definer function that edge functions can use to check roles
-- This bypasses RLS and can be called from edge functions
CREATE OR REPLACE FUNCTION public.get_user_roles_for_edge_function(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_roles jsonb;
BEGIN
  -- Get all roles for the user
  SELECT COALESCE(jsonb_agg(role), '[]'::jsonb)
  INTO user_roles
  FROM public.user_roles
  WHERE user_id = target_user_id;
  
  -- Log for audit purposes
  INSERT INTO public.audit_log (
    table_name, action, user_id, details
  ) VALUES (
    'user_roles', 'EDGE_FUNCTION_ROLE_CHECK', target_user_id,
    jsonb_build_object(
      'roles_found', user_roles,
      'timestamp', now(),
      'context', 'edge_function_access_control'
    )
  );
  
  RETURN user_roles;
END;
$$;