-- Check and add missing foreign key from lease_agreements to properties (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_lease_agreements_property_id'
        AND table_name = 'lease_agreements'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.lease_agreements 
        ADD CONSTRAINT fk_lease_agreements_property_id 
        FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;
    END IF;
END $$;