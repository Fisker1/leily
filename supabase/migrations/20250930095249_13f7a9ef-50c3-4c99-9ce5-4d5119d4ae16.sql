-- Create RPC function to get user roles for edge functions
CREATE OR REPLACE FUNCTION public.get_user_roles_for_edge_function(target_user_id UUID)
RETURNS TABLE(role app_role)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_roles.role
  FROM public.user_roles
  WHERE user_roles.user_id = target_user_id;
$$;