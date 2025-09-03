-- First, make sure the user_roles table exists and has the right structure
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    role TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Add admin role for the specific user
INSERT INTO public.user_roles (user_id, role) 
VALUES ('5d6a457d-4420-4ad2-8e87-e2a94a5e2f99', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Create policies to allow users to read their own roles
CREATE POLICY IF NOT EXISTS "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow admins to manage all roles
CREATE POLICY IF NOT EXISTS "Admins can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
));