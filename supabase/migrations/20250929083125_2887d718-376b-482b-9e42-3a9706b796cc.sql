-- Add missing foreign key from lease_agreements to tenants (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_lease_agreements_tenant_id'
        AND table_name = 'lease_agreements'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.lease_agreements 
        ADD CONSTRAINT fk_lease_agreements_tenant_id 
        FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
    END IF;
END $$;