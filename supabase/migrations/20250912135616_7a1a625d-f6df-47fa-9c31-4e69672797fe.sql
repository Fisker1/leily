-- Opprett resten av tabellene som vi trenger

-- Reports tabell
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  property_data jsonb NOT NULL,
  calculations jsonb NOT NULL,
  generated_at timestamp with time zone NOT NULL DEFAULT now(),
  file_size integer,
  payment_record_id uuid,
  report_type text NOT NULL DEFAULT 'bank_report'::text,
  file_name text,
  CONSTRAINT reports_pkey PRIMARY KEY (id)
);

-- Property documents tabell
CREATE TABLE IF NOT EXISTS public.property_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL,
  uploaded_by uuid NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text,
  file_size integer,
  document_category text DEFAULT 'other'::text,
  description text,
  uploaded_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT property_documents_pkey PRIMARY KEY (id)
);

-- Audit log tabell
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  action text NOT NULL,
  user_id uuid,
  details jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT audit_log_pkey PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Lag policies for nye tabeller
CREATE POLICY "Users can view their own reports" ON public.reports
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reports" ON public.reports
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their property documents" ON public.property_documents
FOR ALL USING (property_id IN (
  SELECT id FROM properties WHERE owner_id = auth.uid()
)) WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "System can insert audit logs" ON public.audit_log
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view audit logs" ON public.audit_log
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));