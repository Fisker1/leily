-- ============================================
-- LEASE SIGNATURES TABLE
-- ============================================
-- Tabell for å spore BankID-signering av leieavtaler via Signicat

CREATE TABLE public.lease_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID NOT NULL REFERENCES public.lease_agreements(id) ON DELETE CASCADE,
  
  -- Signicat data
  signicat_document_id TEXT NOT NULL UNIQUE,
  signicat_status TEXT DEFAULT 'pending',
  
  -- Signaturer
  landlord_signed BOOLEAN DEFAULT FALSE,
  tenant_signed BOOLEAN DEFAULT FALSE,
  landlord_signed_at TIMESTAMP WITH TIME ZONE,
  tenant_signed_at TIMESTAMP WITH TIME ZONE,
  
  -- URLs
  unsigned_pdf_url TEXT,
  signed_pdf_url TEXT,
  landlord_signing_url TEXT,
  tenant_signing_url TEXT,
  
  -- Status: pending -> landlord_signed -> tenant_signed -> completed
  status TEXT DEFAULT 'pending',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Notifications
  landlord_notified BOOLEAN DEFAULT FALSE,
  tenant_notified BOOLEAN DEFAULT FALSE,
  
  CONSTRAINT valid_signature_status CHECK (
    status IN ('pending', 'landlord_signed', 'tenant_signed', 'completed', 'cancelled', 'expired')
  )
);

-- Indexes for performance
CREATE INDEX idx_lease_signatures_lease_id ON public.lease_signatures(lease_id);
CREATE INDEX idx_lease_signatures_status ON public.lease_signatures(status);
CREATE INDEX idx_lease_signatures_signicat_document_id ON public.lease_signatures(signicat_document_id);
CREATE INDEX idx_lease_signatures_expires_at ON public.lease_signatures(expires_at);

-- Enable RLS
ALTER TABLE public.lease_signatures ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can manage signatures for their own leases
CREATE POLICY "Users can manage own lease signatures"
  ON public.lease_signatures
  FOR ALL
  USING (
    lease_id IN (
      SELECT id FROM public.lease_agreements 
      WHERE property_owner_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_lease_signatures_updated_at
  BEFORE UPDATE ON public.lease_signatures
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- UPDATE LEASE_AGREEMENTS TABLE
-- ============================================
-- Legg til signatur-relaterte kolonner på eksisterende leieavtaler

ALTER TABLE public.lease_agreements 
  ADD COLUMN IF NOT EXISTS signature_status TEXT DEFAULT 'unsigned',
  ADD COLUMN IF NOT EXISTS signed_document_url TEXT,
  ADD COLUMN IF NOT EXISTS signature_initiated_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS signature_completed_at TIMESTAMP WITH TIME ZONE;

-- Add constraint for signature_status
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_signature_status' 
    AND conrelid = 'public.lease_agreements'::regclass
  ) THEN
    ALTER TABLE public.lease_agreements 
    ADD CONSTRAINT valid_signature_status CHECK (
      signature_status IN ('unsigned', 'pending', 'partially_signed', 'fully_signed', 'cancelled')
    );
  END IF;
END $$;

-- Index for signature_status
CREATE INDEX IF NOT EXISTS idx_lease_agreements_signature_status 
  ON public.lease_agreements(signature_status);

-- ============================================
-- AUDIT LOGGING
-- ============================================
-- Log all signature events to audit_log table

CREATE OR REPLACE FUNCTION public.log_signature_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log INSERT events
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (action, table_name, user_id, details)
    VALUES (
      'signature_created',
      'lease_signatures',
      auth.uid(),
      jsonb_build_object(
        'lease_id', NEW.lease_id,
        'signature_id', NEW.id,
        'signicat_document_id', NEW.signicat_document_id
      )
    );
  END IF;
  
  -- Log UPDATE events (status changes)
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.audit_log (action, table_name, user_id, details)
    VALUES (
      'signature_status_changed',
      'lease_signatures',
      auth.uid(),
      jsonb_build_object(
        'lease_id', NEW.lease_id,
        'signature_id', NEW.id,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'landlord_signed', NEW.landlord_signed,
        'tenant_signed', NEW.tenant_signed
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER log_signature_changes
  AFTER INSERT OR UPDATE ON public.lease_signatures
  FOR EACH ROW
  EXECUTE FUNCTION public.log_signature_event();

COMMENT ON TABLE public.lease_signatures IS 'Tracks BankID signatures for lease agreements via Signicat integration';
COMMENT ON COLUMN public.lease_signatures.signicat_document_id IS 'Unique document ID from Signicat API';
COMMENT ON COLUMN public.lease_signatures.status IS 'Signature workflow status: pending -> landlord_signed -> tenant_signed -> completed';
COMMENT ON COLUMN public.lease_signatures.expires_at IS 'Signature request expiration (typically 30 days from creation)';