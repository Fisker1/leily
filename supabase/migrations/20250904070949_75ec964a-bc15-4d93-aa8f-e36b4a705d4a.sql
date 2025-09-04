-- Fix Audit Log RLS Security Issue
-- Add comprehensive RLS policies to prevent unauthorized access to audit_log table

-- Drop existing policy to recreate with better security
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_log;

-- Add explicit deny policy for non-admins (default deny)
CREATE POLICY "Default deny audit log access" 
ON public.audit_log 
FOR ALL 
USING (false);

-- Add specific allow policy for authenticated admins only
CREATE POLICY "Only authenticated admins can access audit logs" 
ON public.audit_log 
FOR SELECT 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Ensure system can still insert audit logs (for triggers)
CREATE POLICY "System can insert audit logs" 
ON public.audit_log 
FOR INSERT 
WITH CHECK (true);