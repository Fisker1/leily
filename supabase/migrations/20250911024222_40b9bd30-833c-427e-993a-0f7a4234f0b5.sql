-- Final batch of RLS policy optimizations

-- Fix property_valuations table policies
DROP POLICY IF EXISTS "Users can delete their property valuations" ON public.property_valuations;
DROP POLICY IF EXISTS "Users can insert their property valuations" ON public.property_valuations;
DROP POLICY IF EXISTS "Users can update their property valuations" ON public.property_valuations;
DROP POLICY IF EXISTS "Users can view their property valuations" ON public.property_valuations;

CREATE POLICY "Users can manage their property valuations" 
ON public.property_valuations 
FOR ALL 
USING (
  property_id IN (
    SELECT properties.id
    FROM properties
    WHERE properties.owner_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  property_id IN (
    SELECT properties.id
    FROM properties
    WHERE properties.owner_id = (SELECT auth.uid())
  )
);

-- Fix audit_log policies - remove conflicting permissive policies
DROP POLICY IF EXISTS "Default deny audit log access" ON public.audit_log;
DROP POLICY IF EXISTS "Only authenticated admins can access audit logs" ON public.audit_log;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_log;

-- Create single optimized policies for audit_log
CREATE POLICY "Admins can view audit logs" 
ON public.audit_log 
FOR SELECT 
USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  has_role((SELECT auth.uid()), 'admin'::app_role)
);

CREATE POLICY "System can insert audit logs" 
ON public.audit_log 
FOR INSERT 
WITH CHECK (true);

-- Fix reports admin policies
DROP POLICY IF EXISTS "Admins can manage all reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON public.reports;

CREATE POLICY "Admins can manage all reports" 
ON public.reports 
FOR ALL 
USING (has_role((SELECT auth.uid()), 'admin'::app_role));

-- Fix rate_limits admin policies  
DROP POLICY IF EXISTS "Only admins can view rate limits" ON public.rate_limits;
DROP POLICY IF EXISTS "Only admins can insert rate limits" ON public.rate_limits;
DROP POLICY IF EXISTS "Only admins can update rate limits" ON public.rate_limits;
DROP POLICY IF EXISTS "Only admins can delete rate limits" ON public.rate_limits;

CREATE POLICY "Admins can manage rate limits" 
ON public.rate_limits 
FOR ALL 
USING (has_role((SELECT auth.uid()), 'admin'::app_role));

-- Fix user_roles admin policy
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Admins can manage roles" 
ON public.user_roles 
FOR ALL 
USING (has_role((SELECT auth.uid()), 'admin'::app_role));