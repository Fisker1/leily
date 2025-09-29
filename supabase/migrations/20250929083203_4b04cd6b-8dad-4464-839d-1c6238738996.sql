-- Add missing foreign keys for deposit_accounts and transfer_protocols
DO $$
BEGIN
    -- Add foreign key from deposit_accounts to lease_agreements (if it doesn't exist)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_deposit_accounts_lease_id'
        AND table_name = 'deposit_accounts'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.deposit_accounts 
        ADD CONSTRAINT fk_deposit_accounts_lease_id 
        FOREIGN KEY (lease_id) REFERENCES public.lease_agreements(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key from transfer_protocols to lease_agreements (if it doesn't exist)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_transfer_protocols_lease_id'
        AND table_name = 'transfer_protocols'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.transfer_protocols 
        ADD CONSTRAINT fk_transfer_protocols_lease_id 
        FOREIGN KEY (lease_id) REFERENCES public.lease_agreements(id) ON DELETE CASCADE;
    END IF;
END $$;