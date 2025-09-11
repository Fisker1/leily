-- Fix rate_limits table security issue
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "System can manage rate limits" ON public.rate_limits;

-- Create secure policies that restrict access to admin users only
CREATE POLICY "Only admins can view rate limits" 
ON public.rate_limits 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can insert rate limits" 
ON public.rate_limits 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update rate limits" 
ON public.rate_limits 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete rate limits" 
ON public.rate_limits 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));