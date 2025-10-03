-- Create table for legal documents version control
CREATE TABLE public.legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type TEXT NOT NULL CHECK (document_type IN ('privacy_policy', 'terms_of_service', 'lease_agreement_template', 'cookie_policy')),
  version TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_format TEXT NOT NULL DEFAULT 'markdown' CHECK (content_format IN ('markdown', 'html')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'under_review', 'approved', 'active', 'archived')),
  reviewed_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  uploaded_by UUID REFERENCES auth.users(id), -- Nullable for system-generated documents
  effective_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  UNIQUE(document_type, version)
);

-- Enable RLS
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage legal documents"
ON public.legal_documents
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'::app_role
  )
);

-- Everyone can view active documents
CREATE POLICY "Everyone can view active legal documents"
ON public.legal_documents
FOR SELECT
USING (status = 'active');

-- Create index for faster lookups
CREATE INDEX idx_legal_documents_type_status ON public.legal_documents(document_type, status);
CREATE INDEX idx_legal_documents_effective_date ON public.legal_documents(effective_date);

-- Create updated_at trigger
CREATE TRIGGER update_legal_documents_updated_at
BEFORE UPDATE ON public.legal_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial documents (current versions as baseline)
INSERT INTO public.legal_documents (document_type, version, title, content, content_format, status, effective_date, notes)
VALUES 
(
  'privacy_policy',
  '1.0',
  'Personvernpolicy',
  '# Placeholder - se PrivacyPolicy.tsx component for innhold',
  'markdown',
  'active',
  now(),
  'Initial version - generated from existing component'
),
(
  'terms_of_service',
  '1.0',
  'Vilkår for bruk',
  '# Placeholder - se TermsOfService.tsx component for innhold',
  'markdown',
  'active',
  now(),
  'Initial version - generated from existing component'
),
(
  'lease_agreement_template',
  '1.0',
  'Standard Leieavtale',
  '# Placeholder - se generate-lease-pdf Edge Function for komplett template',
  'html',
  'active',
  now(),
  'Initial version - generated from Edge Function template'
);

-- Audit logging trigger
CREATE OR REPLACE FUNCTION public.log_legal_document_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (action, table_name, user_id, details)
    VALUES (
      'legal_document_created',
      'legal_documents',
      auth.uid(),
      jsonb_build_object(
        'document_id', NEW.id,
        'document_type', NEW.document_type,
        'version', NEW.version,
        'status', NEW.status
      )
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.audit_log (action, table_name, user_id, details)
    VALUES (
      'legal_document_status_changed',
      'legal_documents',
      auth.uid(),
      jsonb_build_object(
        'document_id', NEW.id,
        'document_type', NEW.document_type,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'version', NEW.version
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER log_legal_document_changes_trigger
AFTER INSERT OR UPDATE ON public.legal_documents
FOR EACH ROW
EXECUTE FUNCTION public.log_legal_document_changes();