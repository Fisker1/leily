-- Continue fixing remaining RLS policies for performance optimization

-- Fix user_roles table policies
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING ((SELECT auth.uid()) = user_id);

-- Fix lease_agreements table policies (remove duplicate policy to fix multiple permissive policies issue)
DROP POLICY IF EXISTS "Users can manage own lease agreements" ON public.lease_agreements;
DROP POLICY IF EXISTS "Users can view own lease agreements" ON public.lease_agreements;

CREATE POLICY "Users can manage own lease agreements" 
ON public.lease_agreements 
FOR ALL 
USING ((SELECT auth.uid()) = property_owner_id);

-- Fix transfer_protocols table policies
DROP POLICY IF EXISTS "Users can manage own transfer protocols" ON public.transfer_protocols;
DROP POLICY IF EXISTS "Users can view own transfer protocols" ON public.transfer_protocols;

CREATE POLICY "Users can manage own transfer protocols" 
ON public.transfer_protocols 
FOR ALL 
USING ((SELECT auth.uid()) = property_owner_id);

-- Fix deposit_accounts table policy
DROP POLICY IF EXISTS "Property owners only access own deposits" ON public.deposit_accounts;

CREATE POLICY "Property owners only access own deposits" 
ON public.deposit_accounts 
FOR ALL 
USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  property_owner_id IS NOT NULL AND 
  (SELECT auth.uid()) = property_owner_id
)
WITH CHECK (
  (SELECT auth.uid()) IS NOT NULL AND 
  property_owner_id IS NOT NULL AND 
  (SELECT auth.uid()) = property_owner_id
);

-- Fix tenants table policy
DROP POLICY IF EXISTS "Strict property owner tenant access only" ON public.tenants;

CREATE POLICY "Strict property owner tenant access only" 
ON public.tenants 
FOR ALL 
USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  property_owner_id IS NOT NULL AND 
  (SELECT auth.uid()) = property_owner_id
)
WITH CHECK (
  (SELECT auth.uid()) IS NOT NULL AND 
  property_owner_id IS NOT NULL AND 
  (SELECT auth.uid()) = property_owner_id
);

-- Fix property_documents table policies
DROP POLICY IF EXISTS "Users can delete their property documents" ON public.property_documents;
DROP POLICY IF EXISTS "Users can update their property documents" ON public.property_documents;
DROP POLICY IF EXISTS "Users can upload their property documents" ON public.property_documents;
DROP POLICY IF EXISTS "Users can view their property documents" ON public.property_documents;

CREATE POLICY "Users can manage their property documents" 
ON public.property_documents 
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
  ) AND uploaded_by = (SELECT auth.uid())
);