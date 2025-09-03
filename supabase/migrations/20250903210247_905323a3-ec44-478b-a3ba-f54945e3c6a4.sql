-- Add admin role for the specific user (using existing table structure)
INSERT INTO public.user_roles (user_id, role) 
VALUES ('5d6a457d-4420-4ad2-8e87-e2a94a5e2f99', 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;