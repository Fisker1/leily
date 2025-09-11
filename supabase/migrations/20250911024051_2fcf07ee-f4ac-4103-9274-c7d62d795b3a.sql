-- Fix Auth RLS Initialization Plan issues for better performance
-- Optimize auth.uid() calls by wrapping them in SELECT statements

-- Fix profiles table policies
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;  
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING ((SELECT auth.uid()) = id);

-- Fix properties table policies
DROP POLICY IF EXISTS "Users can manage own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can view own properties" ON public.properties;

CREATE POLICY "Users can manage own properties" 
ON public.properties 
FOR ALL 
USING ((SELECT auth.uid()) = owner_id);

-- Fix reports table policies  
DROP POLICY IF EXISTS "Users can create their own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can view their own reports" ON public.reports;

CREATE POLICY "Users can create their own reports" 
ON public.reports 
FOR INSERT 
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can view their own reports" 
ON public.reports 
FOR SELECT 
USING ((SELECT auth.uid()) = user_id);

-- Fix payment_records table policies
DROP POLICY IF EXISTS "Users delete own failed payments only" ON public.payment_records;
DROP POLICY IF EXISTS "Users insert own payment records only" ON public.payment_records;
DROP POLICY IF EXISTS "Users update own payment status only" ON public.payment_records;
DROP POLICY IF EXISTS "Users view own payment records only" ON public.payment_records;

CREATE POLICY "Users delete own failed payments only" 
ON public.payment_records 
FOR DELETE 
USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  user_id IS NOT NULL AND 
  (SELECT auth.uid()) = user_id AND 
  payment_status = ANY (ARRAY['pending'::text, 'failed'::text, 'cancelled'::text])
);

CREATE POLICY "Users insert own payment records only" 
ON public.payment_records 
FOR INSERT 
WITH CHECK (
  (SELECT auth.uid()) IS NOT NULL AND 
  user_id IS NOT NULL AND 
  (SELECT auth.uid()) = user_id
);

CREATE POLICY "Users update own payment status only" 
ON public.payment_records 
FOR UPDATE 
USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  user_id IS NOT NULL AND 
  (SELECT auth.uid()) = user_id
)
WITH CHECK (
  (SELECT auth.uid()) IS NOT NULL AND 
  user_id IS NOT NULL AND 
  (SELECT auth.uid()) = user_id AND 
  payment_status = ANY (ARRAY['completed'::text, 'failed'::text, 'cancelled'::text])
);

CREATE POLICY "Users view own payment records only" 
ON public.payment_records 
FOR SELECT 
USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  user_id IS NOT NULL AND 
  (SELECT auth.uid()) = user_id
);