-- Add missing foreign keys to establish proper table relationships

-- Add foreign key from chat_messages to lease_agreements
ALTER TABLE public.chat_messages 
ADD CONSTRAINT fk_chat_messages_lease_id 
FOREIGN KEY (lease_id) REFERENCES public.lease_agreements(id) ON DELETE CASCADE;

-- Add foreign key from lease_agreements to properties
ALTER TABLE public.lease_agreements 
ADD CONSTRAINT fk_lease_agreements_property_id 
FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

-- Add foreign key from lease_agreements to tenants
ALTER TABLE public.lease_agreements 
ADD CONSTRAINT fk_lease_agreements_tenant_id 
FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Add foreign key from deposit_accounts to lease_agreements
ALTER TABLE public.deposit_accounts 
ADD CONSTRAINT fk_deposit_accounts_lease_id 
FOREIGN KEY (lease_id) REFERENCES public.lease_agreements(id) ON DELETE CASCADE;

-- Add foreign key from transfer_protocols to lease_agreements
ALTER TABLE public.transfer_protocols 
ADD CONSTRAINT fk_transfer_protocols_lease_id 
FOREIGN KEY (lease_id) REFERENCES public.lease_agreements(id) ON DELETE CASCADE;