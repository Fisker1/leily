-- Create signing documents table for Scrive integration
CREATE TABLE IF NOT EXISTS public.signing_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lease_agreement_id UUID NOT NULL REFERENCES public.lease_agreements(id) ON DELETE CASCADE,
  scrive_document_id VARCHAR(255) UNIQUE,
  document_type VARCHAR(50) NOT NULL DEFAULT 'lease_agreement' CHECK (document_type IN ('lease_agreement', 'addendum', 'termination', 'custom')),
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'signed', 'completed', 'cancelled', 'expired')),
  title TEXT,
  message TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create document signers table
CREATE TABLE IF NOT EXISTS public.document_signers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.signing_documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  signer_email VARCHAR(255) NOT NULL,
  signer_name VARCHAR(255) NOT NULL,
  signer_role VARCHAR(50) NOT NULL CHECK (signer_role IN ('landlord', 'tenant', 'witness', 'guarantor')),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'signed', 'declined', 'expired')),
  signed_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  decline_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_signing_documents_lease_agreement_id ON public.signing_documents(lease_agreement_id);
CREATE INDEX IF NOT EXISTS idx_signing_documents_scrive_document_id ON public.signing_documents(scrive_document_id);
CREATE INDEX IF NOT EXISTS idx_signing_documents_status ON public.signing_documents(status);
CREATE INDEX IF NOT EXISTS idx_document_signers_document_id ON public.document_signers(document_id);
CREATE INDEX IF NOT EXISTS idx_document_signers_signer_email ON public.document_signers(signer_email);
CREATE INDEX IF NOT EXISTS idx_document_signers_status ON public.document_signers(status);

-- Enable RLS
ALTER TABLE public.signing_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_signers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for signing_documents
CREATE POLICY "Users can view own signing documents" ON public.signing_documents
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.lease_agreements 
    WHERE lease_agreements.id = signing_documents.lease_agreement_id 
    AND lease_agreements.property_owner_id = auth.uid()
  )
);

CREATE POLICY "Users can create signing documents for own leases" ON public.signing_documents
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.lease_agreements 
    WHERE lease_agreements.id = signing_documents.lease_agreement_id 
    AND lease_agreements.property_owner_id = auth.uid()
  )
);

CREATE POLICY "Users can update own signing documents" ON public.signing_documents
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.lease_agreements 
    WHERE lease_agreements.id = signing_documents.lease_agreement_id 
    AND lease_agreements.property_owner_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own signing documents" ON public.signing_documents
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.lease_agreements 
    WHERE lease_agreements.id = signing_documents.lease_agreement_id 
    AND lease_agreements.property_owner_id = auth.uid()
  )
);

-- Create RLS policies for document_signers
CREATE POLICY "Users can view signers for own documents" ON public.document_signers
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.signing_documents 
    JOIN public.lease_agreements ON lease_agreements.id = signing_documents.lease_agreement_id
    WHERE signing_documents.id = document_signers.document_id 
    AND lease_agreements.property_owner_id = auth.uid()
  )
);

CREATE POLICY "Users can create signers for own documents" ON public.document_signers
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.signing_documents 
    JOIN public.lease_agreements ON lease_agreements.id = signing_documents.lease_agreement_id
    WHERE signing_documents.id = document_signers.document_id 
    AND lease_agreements.property_owner_id = auth.uid()
  )
);

CREATE POLICY "Users can update signers for own documents" ON public.document_signers
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.signing_documents 
    JOIN public.lease_agreements ON lease_agreements.id = signing_documents.lease_agreement_id
    WHERE signing_documents.id = document_signers.document_id 
    AND lease_agreements.property_owner_id = auth.uid()
  )
);

-- Allow signers to update their own signing status
CREATE POLICY "Signers can update own status" ON public.document_signers
FOR UPDATE USING (signer_email = auth.jwt() ->> 'email');

-- Create trigger for updated_at
CREATE TRIGGER update_signing_documents_updated_at
  BEFORE UPDATE ON public.signing_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_document_signers_updated_at
  BEFORE UPDATE ON public.document_signers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();




