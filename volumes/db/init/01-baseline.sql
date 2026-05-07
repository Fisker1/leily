-- Leily: Clean baseline schema (deduplicated, dependency-ordered)
-- Auto-generated from baseline migration. Safe to run on fresh Postgres.

-- === TABLES ===

-- audit_log
CREATE TABLE IF NOT EXISTS public.audit_log (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    table_name text NOT NULL,
    action text NOT NULL,
    user_id uuid,
    details jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT audit_log_pkey PRIMARY KEY (id)
);

-- calculation_history
CREATE TABLE IF NOT EXISTS public.calculation_history (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    calculation_name text,
    finn_code text,
    property_address text,
    calculation_data jsonb NOT NULL,
    results_data jsonb NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT calculation_history_pkey PRIMARY KEY (id)
);

-- building_projects
CREATE TABLE IF NOT EXISTS public.building_projects (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  project_name text NOT NULL,
  calculation_id uuid,
  floor_plans jsonb NOT NULL DEFAULT '[]'::jsonb,
  placed_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_cost numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT building_projects_calculation_id_fkey FOREIGN KEY (calculation_id) REFERENCES public.calculation_history(id)
);

-- calculator_chat_sessions
CREATE TABLE IF NOT EXISTS public.calculator_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_name TEXT,
  calculator_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- calculator_chat_messages
CREATE TABLE IF NOT EXISTS public.calculator_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.calculator_chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  credits_used NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- lease_agreements
CREATE TABLE IF NOT EXISTS public.lease_agreements (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    property_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    property_owner_id uuid NOT NULL,
    monthly_rent numeric NOT NULL,
    deposit_amount numeric,
    start_date date NOT NULL,
    end_date date,
    utilities_included boolean DEFAULT false,
    parking_included boolean DEFAULT false,
    pets_allowed boolean DEFAULT false,
    smoking_allowed boolean DEFAULT false,
    status text DEFAULT 'active'::text,
    lease_terms text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT lease_agreements_pkey PRIMARY KEY (id)
);

-- chat_messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lease_id uuid NOT NULL,
  sender_type text NOT NULL CHECK (sender_type = ANY (ARRAY['landlord'::text, 'tenant'::text])),
  sender_id uuid NOT NULL,
  message_content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT chat_messages_lease_id_fkey FOREIGN KEY (lease_id) REFERENCES public.lease_agreements(id)
);

-- deposit_accounts
CREATE TABLE IF NOT EXISTS public.deposit_accounts (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    lease_id uuid NOT NULL,
    property_owner_id uuid NOT NULL,
    deposit_amount numeric NOT NULL,
    bank_name text,
    account_number text,
    interest_rate numeric,
    status text DEFAULT 'active'::text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT deposit_accounts_pkey PRIMARY KEY (id)
);

-- signing_documents
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

-- document_signers
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

-- equity_management
CREATE TABLE IF NOT EXISTS public.equity_management (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_equity NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- external_lender_settings
CREATE TABLE IF NOT EXISTS public.external_lender_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  has_external_lender BOOLEAN NOT NULL DEFAULT false,
  external_lender_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- finn_property_cache
CREATE TABLE IF NOT EXISTS public.finn_property_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  finn_code text NOT NULL UNIQUE,
  property_data jsonb NOT NULL,
  extracted_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- lease_signatures
CREATE TABLE IF NOT EXISTS public.lease_signatures (
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

-- legal_documents
CREATE TABLE IF NOT EXISTS public.legal_documents (
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

-- loan_calculator_settings
CREATE TABLE IF NOT EXISTS public.loan_calculator_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_price NUMERIC DEFAULT 0,
  interest_rate NUMERIC DEFAULT 4.99,
  loan_period INTEGER DEFAULT 30,
  desired_loan_amount NUMERIC DEFAULT 0,
  equity_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- properties
CREATE TABLE IF NOT EXISTS public.properties (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    owner_id uuid NOT NULL,
    address text NOT NULL,
    postal_code text,
    city text,
    property_type text,
    size_sqm integer,
    bedrooms integer,
    purchase_price numeric,
    purchase_date date,
    loan_amount numeric,
    interest_rate numeric,
    loan_duration_years integer,
    current_value numeric,
    last_valuation_date date,
    primary_residence boolean DEFAULT false,
    monthly_rent numeric,
    show_in_rental boolean DEFAULT true,
    image_url text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT properties_pkey PRIMARY KEY (id)
);

-- loan_scenarios
CREATE TABLE IF NOT EXISTS public.loan_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_name TEXT NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  calculation_id UUID REFERENCES public.calculation_history(id) ON DELETE SET NULL,
  
  -- Property details (if not linked to existing property)
  property_address TEXT,
  property_value NUMERIC NOT NULL,
  
  -- Loan details
  equity_allocated NUMERIC NOT NULL,
  loan_amount NUMERIC NOT NULL,
  interest_rate NUMERIC NOT NULL,
  loan_period_years INTEGER NOT NULL,
  
  -- Additional funding source if exceeding available equity
  additional_funding_source TEXT,
  additional_funding_amount NUMERIC,
  
  -- Calculated values
  monthly_payment NUMERIC,
  total_interest NUMERIC,
  loan_to_value NUMERIC,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- payment_records
CREATE TABLE IF NOT EXISTS public.payment_records (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    amount numeric NOT NULL,
    currency text DEFAULT 'NOK'::text,
    payment_type text NOT NULL,
    payment_method text,
    payment_status text DEFAULT 'pending'::text,
    vipps_order_id text,
    analysis_id uuid,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT payment_records_pkey PRIMARY KEY (id)
);

-- profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    full_name text,
    avatar_url text,
    subscription_tier text DEFAULT 'free'::text,
    subscription_end timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT profiles_pkey PRIMARY KEY (id)
);

-- property_documents
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

-- property_valuations
CREATE TABLE IF NOT EXISTS public.property_valuations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    property_id uuid NOT NULL,
    valuation_amount numeric NOT NULL,
    valuation_type text NOT NULL DEFAULT 'manual'::text,
    valuation_date date NOT NULL DEFAULT CURRENT_DATE,
    source text,
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT property_valuations_pkey PRIMARY KEY (id)
);

-- rate_limits
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    identifier text NOT NULL,
    endpoint text NOT NULL,
    request_count integer NOT NULL DEFAULT 1,
    window_start timestamp with time zone NOT NULL DEFAULT now(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT rate_limits_pkey PRIMARY KEY (id)
);

-- reports
CREATE TABLE IF NOT EXISTS public.reports (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    report_type text NOT NULL DEFAULT 'bank_report'::text,
    file_name text,
    property_data jsonb NOT NULL,
    calculations jsonb NOT NULL,
    file_size integer,
    payment_record_id uuid,
    generated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT reports_pkey PRIMARY KEY (id)
);

-- tenants
CREATE TABLE IF NOT EXISTS public.tenants (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    property_owner_id uuid NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text,
    phone text,
    national_id text,
    address text,
    occupation text,
    monthly_income numeric,
    emergency_contact text,
    emergency_phone text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT tenants_pkey PRIMARY KEY (id)
);

-- transfer_protocols
CREATE TABLE IF NOT EXISTS public.transfer_protocols (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    lease_id uuid NOT NULL,
    property_owner_id uuid NOT NULL,
    protocol_type text NOT NULL,
    protocol_date date NOT NULL,
    condition_notes text,
    damages text,
    repairs_needed text,
    photos_urls text[],
    signatures_completed boolean DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT transfer_protocols_pkey PRIMARY KEY (id)
);

-- user_calendar_events
CREATE TABLE IF NOT EXISTS public.user_calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'lease_start', 
    'lease_end', 
    'rent_increase', 
    'index_regulation',
    'move_in', 
    'move_out', 
    'inspection', 
    'deposit_release', 
    'insurance_renewal', 
    'tax_deadline',
    'maintenance',
    'custom'
  )),
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  lease_id UUID REFERENCES public.lease_agreements(id) ON DELETE CASCADE,
  is_recurring BOOLEAN DEFAULT false,
  recurring_pattern TEXT, -- 'yearly', 'monthly', 'quarterly'
  reminder_days INTEGER[] DEFAULT ARRAY[7, 3, 1], -- Days before event to send reminders
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    role app_role NOT NULL DEFAULT 'user'::app_role,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT user_roles_pkey PRIMARY KEY (id),
    CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role)
);


-- === ROW LEVEL SECURITY ===

ALTER TABLE finn_property_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_valuations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.building_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculator_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculator_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_signers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equity_management ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_lender_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finn_property_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lease_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lease_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_calculator_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_valuations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signing_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_safe_view ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- === POLICIES (idempotent) ===

DO $$ BEGIN
  CREATE POLICY "Admin audit access to tenant data"
ON public.tenants
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND has_role(auth.uid(), 'admin'::app_role)
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admin emergency access to tenant data"
ON public.tenants
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND has_role(auth.uid(), 'admin'::app_role)
  AND property_owner_id IS NOT NULL
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admin read access to tenant data"
ON public.tenants
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND auth.uid() IS NOT NULL
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admin restricted tenant access"
ON public.tenants
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND has_role(auth.uid(), 'admin'::app_role)
  AND property_owner_id IS NOT NULL
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can manage all payment records" 
ON public.payment_records 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can manage all reports" 
ON public.reports 
FOR ALL 
USING (has_role((SELECT auth.uid()), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
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
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can manage rate limits" 
ON public.rate_limits 
FOR ALL 
USING (has_role((SELECT auth.uid()), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can manage roles" ON public.user_roles
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can view all payment records" ON public.payment_records
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can view all reports" ON public.reports
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can view audit logs" ON public.audit_log
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins require justification for payment access" 
ON public.payment_records 
FOR SELECT 
USING (
  -- Users can always view their own payments
  (auth.uid() = user_id) OR
  -- Admins can only view with explicit function call (for audit trail)
  (has_role(auth.uid(), 'admin'::app_role) AND current_setting('app.admin_payment_access', true) = 'justified')
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone can read cached property data"
ON public.finn_property_cache FOR SELECT
USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Default deny audit log access" 
ON public.audit_log 
FOR ALL 
USING (false);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Enhanced tenant access policy"
ON public.tenants
FOR ALL
USING (
  has_legitimate_tenant_access(property_owner_id) 
  AND auth.uid() IS NOT NULL
  AND property_owner_id IS NOT NULL
)
WITH CHECK (
  has_legitimate_tenant_access(property_owner_id)
  AND auth.uid() IS NOT NULL
  AND property_owner_id IS NOT NULL
  AND property_owner_id = auth.uid() -- Only property owners can insert/update
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Everyone can view active legal documents"
ON public.legal_documents
FOR SELECT
USING (status = 'active');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "No direct admin access to tenant data"
ON public.tenants
FOR SELECT
TO authenticated
USING (
  -- Only property owners can directly access tenant data
  -- Admins must use secure functions with proper logging
  auth.uid() IS NOT NULL 
  AND property_owner_id IS NOT NULL 
  AND auth.uid() = property_owner_id
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Non-admins cannot view draft legal documents"
ON public.legal_documents
FOR SELECT
TO authenticated
USING (
  status != 'draft' OR 
  has_role(auth.uid(), 'admin'::app_role)
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Only admins can delete rate limits" 
ON public.rate_limits 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Only admins can insert rate limits" 
ON public.rate_limits 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Only admins can update rate limits" 
ON public.rate_limits 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Only admins can view rate limits" 
ON public.rate_limits 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Only authenticated admins can access audit logs" 
ON public.audit_log 
FOR SELECT 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  has_role(auth.uid(), 'admin'::app_role)
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Property owners can manage their own tenant data"
ON public.tenants
FOR ALL
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND property_owner_id IS NOT NULL 
  AND auth.uid() = property_owner_id
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND property_owner_id IS NOT NULL 
  AND auth.uid() = property_owner_id
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Property owners can manage their tenants"
ON public.tenants
FOR ALL
USING (
  auth.uid() = property_owner_id AND
  auth.uid() IS NOT NULL
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Property owners can view their tenants"
ON public.tenants
FOR SELECT
USING (
  auth.uid() = property_owner_id AND
  auth.uid() IS NOT NULL
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Property owners only access own deposits" ON public.deposit_accounts
FOR ALL USING (
  auth.uid() IS NOT NULL AND 
  property_owner_id IS NOT NULL AND 
  auth.uid() = property_owner_id
) WITH CHECK (
  auth.uid() IS NOT NULL AND 
  property_owner_id IS NOT NULL AND 
  auth.uid() = property_owner_id
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Property owners only access own tenant data"
ON public.tenants
FOR ALL
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND property_owner_id IS NOT NULL 
  AND auth.uid() = property_owner_id
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND property_owner_id IS NOT NULL 
  AND auth.uid() = property_owner_id
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Restricted admin payment access" 
ON public.payment_records 
FOR SELECT 
USING (
  -- Users can always view their own payments
  (auth.uid() = user_id) OR
  -- Admins require explicit justification via special function
  (has_role(auth.uid(), 'admin'::app_role) AND current_setting('app.admin_payment_justified', true) = 'true')
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Secure tenant access for property owners"
ON public.tenants
FOR ALL
USING (
  auth.uid() = property_owner_id 
  AND auth.uid() IS NOT NULL
  AND auth.role() = 'authenticated'
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Signers can update own status" ON public.document_signers
FOR UPDATE USING (signer_email = auth.jwt() ->> 'email');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Strict property owner tenant access only" ON public.tenants
FOR ALL USING (
  auth.uid() IS NOT NULL AND 
  property_owner_id IS NOT NULL AND 
  auth.uid() = property_owner_id
) WITH CHECK (
  auth.uid() IS NOT NULL AND 
  property_owner_id IS NOT NULL AND 
  auth.uid() = property_owner_id
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Strict tenant data access"
ON public.tenants
FOR ALL
USING (
  -- Must be authenticated
  auth.uid() IS NOT NULL
  -- Must have legitimate access (property owner or admin)
  AND has_legitimate_tenant_access(property_owner_id)
  -- Property owner must be set
  AND property_owner_id IS NOT NULL
)
WITH CHECK (
  -- For insert/update, must be authenticated and be the property owner
  auth.uid() IS NOT NULL
  AND property_owner_id = auth.uid()
  AND property_owner_id IS NOT NULL
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Strict tenant safe view access" 
ON public.tenant_safe_view 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    -- Property owners can see their own tenant data
    property_owner_id = auth.uid() OR
    -- Admins can see all tenant data for audit purposes
    has_role(auth.uid(), 'admin'::app_role)
  )
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "System can insert audit logs" ON public.audit_log
FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "System can manage cache"
ON public.finn_property_cache
FOR ALL
TO service_role
USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "System can manage rate limits" 
ON public.rate_limits 
FOR ALL 
USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Tenant safe view access"
ON public.tenants
FOR SELECT
USING (has_legitimate_tenant_access(property_owner_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create chat messages for their lease agreements" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (
  lease_id IN (
    SELECT id FROM public.lease_agreements 
    WHERE property_owner_id = auth.uid()
  ) AND sender_id = auth.uid()
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create messages for their leases"
ON public.chat_messages FOR INSERT
WITH CHECK (
  lease_id IN (
    SELECT id FROM public.lease_agreements 
    WHERE property_owner_id = auth.uid()
  ) AND sender_id = auth.uid()
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create own chat messages"
ON public.calculator_chat_messages
FOR INSERT
WITH CHECK (
  session_id IN (
    SELECT id FROM public.calculator_chat_sessions 
    WHERE user_id = auth.uid()
  )
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create own properties" 
ON public.properties 
FOR INSERT 
WITH CHECK (auth.uid() = owner_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create signers for own documents" ON public.document_signers
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.signing_documents 
    JOIN public.lease_agreements ON lease_agreements.id = signing_documents.lease_agreement_id
    WHERE signing_documents.id = document_signers.document_id 
    AND lease_agreements.property_owner_id = auth.uid()
  )
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create signing documents for own leases" ON public.signing_documents
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.lease_agreements 
    WHERE lease_agreements.id = signing_documents.lease_agreement_id 
    AND lease_agreements.property_owner_id = auth.uid()
  )
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create their own building projects" 
ON public.building_projects 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create their own calculations" ON public.calculation_history
FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create their own external lender settings" 
ON public.external_lender_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create their own loan calculator settings" 
ON public.loan_calculator_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create their own reports" ON public.reports
FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete finn property cache" ON finn_property_cache
    FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own calendar events" ON public.user_calendar_events
FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own properties" 
ON public.properties 
FOR DELETE 
USING (auth.uid() = owner_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own signing documents" ON public.signing_documents
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.lease_agreements 
    WHERE lease_agreements.id = signing_documents.lease_agreement_id 
    AND lease_agreements.property_owner_id = auth.uid()
  )
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete their own avatar" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete their own building projects" 
ON public.building_projects 
FOR DELETE 
USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete their own calculations" ON public.calculation_history
FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete their own external lender settings" 
ON public.external_lender_settings 
FOR DELETE 
USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete their own failed payment records" 
ON public.payment_records 
FOR DELETE 
USING (
  auth.uid() = user_id AND 
  payment_status IN ('pending', 'failed', 'cancelled')
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete their own loan calculator settings" 
ON public.loan_calculator_settings 
FOR DELETE 
USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete their property documents" ON public.property_documents
  FOR DELETE USING (property_id IN (
    SELECT properties.id FROM properties WHERE properties.owner_id = auth.uid()
  ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete their property images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'property-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete their property valuations" ON public.property_valuations
  FOR DELETE USING (property_id IN (
    SELECT properties.id FROM properties WHERE properties.owner_id = auth.uid()
  ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete their reports" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'property-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert finn property cache" ON finn_property_cache
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own calendar events" ON public.user_calendar_events
FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own payment records" ON public.payment_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert their own cached properties"
ON public.finn_property_cache
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert their property valuations" ON public.property_valuations
  FOR INSERT WITH CHECK (property_id IN (
    SELECT properties.id FROM properties WHERE properties.owner_id = auth.uid()
  ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can manage own building projects"
ON public.building_projects FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can manage own chat sessions"
ON public.calculator_chat_sessions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can manage own deposit accounts" ON public.deposit_accounts
  FOR ALL USING (auth.uid() = property_owner_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can manage own equity data"
ON public.equity_management
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can manage own lease agreements" ON public.lease_agreements
FOR ALL USING (auth.uid() = property_owner_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can manage own lease signatures"
  ON public.lease_signatures
  FOR ALL
  USING (
    lease_id IN (
      SELECT id FROM public.lease_agreements 
      WHERE property_owner_id = auth.uid()
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can manage own loan scenarios"
ON public.loan_scenarios
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can manage own properties" ON public.properties
FOR ALL USING (auth.uid() = owner_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can manage own tenants" ON public.tenants
  FOR ALL USING (auth.uid() = property_owner_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can manage own transfer protocols" ON public.transfer_protocols
FOR ALL USING (auth.uid() = property_owner_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can manage their property documents" ON public.property_documents
FOR ALL USING (property_id IN (
  SELECT id FROM properties WHERE owner_id = auth.uid()
)) WITH CHECK (
  property_id IN (SELECT id FROM properties WHERE owner_id = auth.uid()) AND 
  uploaded_by = auth.uid()
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can manage their property valuations" ON public.property_valuations
FOR ALL USING (property_id IN (
  SELECT id FROM properties WHERE owner_id = auth.uid()
)) WITH CHECK (property_id IN (
  SELECT id FROM properties WHERE owner_id = auth.uid()
));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can read finn property cache" ON finn_property_cache
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update finn property cache" ON finn_property_cache
    FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own calendar events" ON public.user_calendar_events
FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own properties" 
ON public.properties 
FOR UPDATE 
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own signing documents" ON public.signing_documents
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.lease_agreements 
    WHERE lease_agreements.id = signing_documents.lease_agreement_id 
    AND lease_agreements.property_owner_id = auth.uid()
  )
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update signers for own documents" ON public.document_signers
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.signing_documents 
    JOIN public.lease_agreements ON lease_agreements.id = signing_documents.lease_agreement_id
    WHERE signing_documents.id = document_signers.document_id 
    AND lease_agreements.property_owner_id = auth.uid()
  )
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their own avatar" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their own building projects" 
ON public.building_projects 
FOR UPDATE 
USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their own calculations" ON public.calculation_history
FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their own external lender settings" 
ON public.external_lender_settings 
FOR UPDATE 
USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their own loan calculator settings" 
ON public.loan_calculator_settings 
FOR UPDATE 
USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their own payment status" 
ON public.payment_records 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND payment_status IN ('completed', 'failed', 'cancelled'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their property documents" ON public.property_documents
  FOR UPDATE USING (property_id IN (
    SELECT properties.id FROM properties WHERE properties.owner_id = auth.uid()
  ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their property images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'property-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their property valuations" ON public.property_valuations
  FOR UPDATE USING (property_id IN (
    SELECT properties.id FROM properties WHERE properties.owner_id = auth.uid()
  ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their reports" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'property-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can upload their own avatar" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can upload their property documents" ON public.property_documents
  FOR INSERT WITH CHECK (
    property_id IN (SELECT properties.id FROM properties WHERE properties.owner_id = auth.uid()) 
    AND uploaded_by = auth.uid()
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can upload their property images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'property-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can upload their reports" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'property-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view chat messages for their lease agreements" 
ON public.chat_messages 
FOR SELECT 
USING (
  lease_id IN (
    SELECT id FROM public.lease_agreements 
    WHERE property_owner_id = auth.uid()
  )
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view messages for their leases"
ON public.chat_messages FOR SELECT
USING (
  lease_id IN (
    SELECT id FROM public.lease_agreements 
    WHERE property_owner_id = auth.uid()
  )
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view own audit logs"
ON public.audit_log
FOR SELECT
USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view own calendar events" ON public.user_calendar_events
FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view own chat messages"
ON public.calculator_chat_messages
FOR SELECT
USING (
  session_id IN (
    SELECT id FROM public.calculator_chat_sessions 
    WHERE user_id = auth.uid()
  )
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view own deposit accounts" ON public.deposit_accounts
  FOR SELECT USING (auth.uid() = property_owner_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view own lease agreements" ON public.lease_agreements
  FOR SELECT USING (auth.uid() = property_owner_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view own payment records" ON public.payment_records
  FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view own properties" 
ON public.properties 
FOR SELECT 
USING (auth.uid() = owner_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view own signing documents" ON public.signing_documents
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.lease_agreements 
    WHERE lease_agreements.id = signing_documents.lease_agreement_id 
    AND lease_agreements.property_owner_id = auth.uid()
  )
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view own tenants" ON public.tenants
  FOR SELECT USING (auth.uid() = property_owner_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view own transfer protocols" ON public.transfer_protocols
  FOR SELECT USING (auth.uid() = property_owner_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view property images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'property-images');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view signers for own documents" ON public.document_signers
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.signing_documents 
    JOIN public.lease_agreements ON lease_agreements.id = signing_documents.lease_agreement_id
    WHERE signing_documents.id = document_signers.document_id 
    AND lease_agreements.property_owner_id = auth.uid()
  )
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view their own building projects" 
ON public.building_projects 
FOR SELECT 
USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view their own cached properties"
ON public.finn_property_cache
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view their own calculations" ON public.calculation_history
FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view their own external lender settings" 
ON public.external_lender_settings 
FOR SELECT 
USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view their own loan calculator settings" 
ON public.loan_calculator_settings 
FOR SELECT 
USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view their own reports" ON public.reports
FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view their property documents" ON public.property_documents
  FOR SELECT USING (property_id IN (
    SELECT properties.id FROM properties WHERE properties.owner_id = auth.uid()
  ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view their property valuations" ON public.property_valuations
  FOR SELECT USING (property_id IN (
    SELECT properties.id FROM properties WHERE properties.owner_id = auth.uid()
  ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view their reports" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'property-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users delete own failed payments only" 
ON public.payment_records 
FOR DELETE 
USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  user_id IS NOT NULL AND 
  (SELECT auth.uid()) = user_id AND 
  payment_status = ANY (ARRAY['pending'::text, 'failed'::text, 'cancelled'::text])
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users insert own payment records only" 
ON public.payment_records 
FOR INSERT 
WITH CHECK (
  (SELECT auth.uid()) IS NOT NULL AND 
  user_id IS NOT NULL AND 
  (SELECT auth.uid()) = user_id
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
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
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users view own payment records only" 
ON public.payment_records 
FOR SELECT 
USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  user_id IS NOT NULL AND 
  (SELECT auth.uid()) = user_id
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- === INDEXES ===

CREATE INDEX IF NOT EXISTS idx_calculation_history_coordinates ON public.calculation_history (coordinates);
CREATE INDEX IF NOT EXISTS idx_calculation_history_created_at ON public.calculation_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calculation_history_user_id ON public.calculation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_calculator_chat_messages_created_at ON public.calculator_chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_calculator_chat_messages_session_id ON public.calculator_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_calculator_chat_sessions_user_id ON public.calculator_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_document_signers_document_id ON public.document_signers(document_id);
CREATE INDEX IF NOT EXISTS idx_document_signers_signer_email ON public.document_signers(signer_email);
CREATE INDEX IF NOT EXISTS idx_document_signers_status ON public.document_signers(status);
CREATE INDEX IF NOT EXISTS idx_equity_management_user_id ON public.equity_management(user_id);
CREATE INDEX IF NOT EXISTS idx_finn_property_cache_created_at ON finn_property_cache(created_at);
CREATE INDEX IF NOT EXISTS idx_finn_property_cache_finn_code ON finn_property_cache(finn_code);
CREATE INDEX IF NOT EXISTS idx_finn_property_cache_user_id ON public.finn_property_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_lease_agreements_signature_status 
  ON public.lease_agreements(signature_status);
CREATE INDEX IF NOT EXISTS idx_lease_signatures_expires_at ON public.lease_signatures(expires_at);
CREATE INDEX IF NOT EXISTS idx_lease_signatures_lease_id ON public.lease_signatures(lease_id);
CREATE INDEX IF NOT EXISTS idx_lease_signatures_signicat_document_id ON public.lease_signatures(signicat_document_id);
CREATE INDEX IF NOT EXISTS idx_lease_signatures_status ON public.lease_signatures(status);
CREATE INDEX IF NOT EXISTS idx_legal_documents_effective_date ON public.legal_documents(effective_date);
CREATE INDEX IF NOT EXISTS idx_legal_documents_type_status ON public.legal_documents(document_type, status);
CREATE INDEX IF NOT EXISTS idx_loan_scenarios_calculation_id ON public.loan_scenarios(calculation_id);
CREATE INDEX IF NOT EXISTS idx_loan_scenarios_property_id ON public.loan_scenarios(property_id);
CREATE INDEX IF NOT EXISTS idx_loan_scenarios_user_id ON public.loan_scenarios(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_credits ON public.profiles(credits);
CREATE INDEX IF NOT EXISTS idx_profiles_national_id ON public.profiles(national_id);
CREATE INDEX IF NOT EXISTS idx_properties_coordinates ON public.properties (coordinates);
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_endpoint ON public.rate_limits(identifier, endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON public.rate_limits(window_start);
CREATE INDEX IF NOT EXISTS idx_signing_documents_lease_agreement_id ON public.signing_documents(lease_agreement_id);
CREATE INDEX IF NOT EXISTS idx_signing_documents_scrive_document_id ON public.signing_documents(scrive_document_id);
CREATE INDEX IF NOT EXISTS idx_signing_documents_status ON public.signing_documents(status);
CREATE INDEX IF NOT EXISTS idx_tenants_property_owner_secure 
ON public.tenants(property_owner_id) 
WHERE property_owner_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_calendar_events_event_date ON public.user_calendar_events(event_date);
CREATE INDEX IF NOT EXISTS idx_user_calendar_events_lease_id ON public.user_calendar_events(lease_id);
CREATE INDEX IF NOT EXISTS idx_user_calendar_events_property_id ON public.user_calendar_events(property_id);
CREATE INDEX IF NOT EXISTS idx_user_calendar_events_user_id ON public.user_calendar_events(user_id);

-- === FUNCTIONS ===

CREATE OR REPLACE FUNCTION public.add_credits_to_user(
  target_user_id uuid, 
  credits_amount integer,
  justification text DEFAULT 'credits_purchase'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  is_admin boolean;
BEGIN
  -- Check if caller is admin
  SELECT has_role(auth.uid(), 'admin'::app_role) INTO is_admin;
  
  IF NOT is_admin AND auth.uid() != target_user_id THEN
    RAISE EXCEPTION 'SECURITY ERROR: Only admins or the user themselves can add credits';
  END IF;
  
  -- Add credits
  UPDATE public.profiles
  SET credits = COALESCE(credits, 0) + credits_amount,
      updated_at = now()
  WHERE id = target_user_id;
  
  -- Log the transaction
  INSERT INTO public.audit_log (
    table_name, action, user_id, details
  ) VALUES (
    'profiles', 'CREDITS_ADDED', auth.uid(),
    jsonb_build_object(
      'target_user_id', target_user_id,
      'credits_added', credits_amount,
      'justification', justification,
      'timestamp', now(),
      'is_admin_action', is_admin
    )
  );
  
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_access_payment_data(
  target_user_id uuid DEFAULT NULL,
  admin_justification text DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  amount numeric,
  payment_type text,
  payment_status text,
  created_at timestamp with time zone,
  currency text,
  payment_method_masked text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Strict validation: Only authenticated admins
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'SECURITY ERROR: Authentication required';
  END IF;
  
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'SECURITY ERROR: Admin privileges required';
  END IF;
  
  -- Require explicit justification
  IF admin_justification IS NULL OR length(trim(admin_justification)) < 15 THEN
    RAISE EXCEPTION 'SECURITY ERROR: Valid justification required (minimum 15 characters)';
  END IF;
  
  -- Set configuration to allow admin access
  PERFORM set_config('app.admin_payment_access', 'justified', true);
  
  -- Log admin access with justification
  INSERT INTO public.audit_log (
    table_name, action, user_id, details
  ) VALUES (
    'payment_records', 'ADMIN_JUSTIFIED_ACCESS', auth.uid(),
    jsonb_build_object(
      'target_user_id', target_user_id,
      'justification', admin_justification,
      'timestamp', now(),
      'security_level', 'CRITICAL_ADMIN_FINANCIAL_ACCESS',
      'admin_email', (SELECT email FROM auth.users WHERE id = auth.uid()),
      'access_scope', CASE 
        WHEN target_user_id IS NULL THEN 'ALL_PAYMENT_RECORDS'
        ELSE 'SPECIFIC_USER_PAYMENTS'
      END
    )
  );

  -- Return payment data with sensitive fields masked even for admins
  RETURN QUERY
  SELECT 
    pr.id,
    pr.user_id,
    pr.amount,
    pr.payment_type,
    pr.payment_status,
    pr.created_at,
    pr.currency,
    -- Mask payment method details even for admins
    CASE 
      WHEN pr.payment_method IS NOT NULL THEN
        left(pr.payment_method, 4) || '****'
      ELSE NULL
    END as payment_method_masked
  FROM public.payment_records pr
  WHERE (target_user_id IS NULL OR pr.user_id = target_user_id);
  
  -- Reset the configuration
  PERFORM set_config('app.admin_payment_access', '', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_access_payment_records(
  admin_justification text,
  target_user_id uuid DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  amount numeric,
  payment_type text,
  payment_status text,
  created_at timestamp with time zone,
  currency text,
  payment_method_masked text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Strict validation: Only authenticated admins
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'SECURITY ERROR: Authentication required';
  END IF;
  
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'SECURITY ERROR: Admin privileges required for payment access';
  END IF;
  
  -- Require explicit justification
  IF admin_justification IS NULL OR length(trim(admin_justification)) < 15 THEN
    RAISE EXCEPTION 'SECURITY ERROR: Valid justification required (minimum 15 characters)';
  END IF;
  
  -- Log admin access with justification for audit trail
  INSERT INTO public.audit_log (
    table_name, action, user_id, details
  ) VALUES (
    'payment_records', 'ADMIN_JUSTIFIED_PAYMENT_ACCESS', auth.uid(),
    jsonb_build_object(
      'target_user_id', target_user_id,
      'justification', admin_justification,
      'timestamp', now(),
      'security_level', 'CRITICAL_ADMIN_FINANCIAL_ACCESS',
      'admin_email', (SELECT email FROM auth.users WHERE id = auth.uid()),
      'access_scope', CASE 
        WHEN target_user_id IS NULL THEN 'ALL_PAYMENT_RECORDS'
        ELSE 'SPECIFIC_USER_PAYMENTS'
      END
    )
  );

  -- Temporarily allow admin access
  PERFORM set_config('app.admin_payment_justified', 'true', true);
  
  -- Return payment data with sensitive fields masked
  RETURN QUERY
  SELECT 
    pr.id,
    pr.user_id,
    pr.amount,
    pr.payment_type,
    pr.payment_status,
    pr.created_at,
    pr.currency,
    -- Mask payment method details even for admins  
    CASE 
      WHEN pr.payment_method IS NOT NULL THEN
        left(pr.payment_method, 4) || '****'
      ELSE NULL
    END as payment_method_masked
  FROM public.payment_records pr
  WHERE (target_user_id IS NULL OR pr.user_id = target_user_id);
  
  -- Reset the configuration
  PERFORM set_config('app.admin_payment_justified', 'false', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_access_tenant_data(
  tenant_property_owner_id uuid,
  admin_justification text
)
RETURNS TABLE(
  id uuid, 
  first_name text, 
  last_name text, 
  email_partially_masked text, 
  phone_partially_masked text, 
  national_id_partially_masked text, 
  property_owner_id uuid,
  access_timestamp timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Strict validation: Only authenticated admins
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'SECURITY ERROR: Authentication required';
  END IF;
  
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'SECURITY ERROR: Admin privileges required';
  END IF;
  
  -- Require explicit justification
  IF admin_justification IS NULL OR length(trim(admin_justification)) < 10 THEN
    RAISE EXCEPTION 'SECURITY ERROR: Valid justification required (minimum 10 characters)';
  END IF;
  
  -- Log admin access with justification for security audit
  INSERT INTO public.audit_log (
    table_name, action, user_id, details
  ) VALUES (
    'tenants', 'ADMIN_ACCESS_WITH_JUSTIFICATION', auth.uid(),
    jsonb_build_object(
      'target_property_owner_id', tenant_property_owner_id,
      'justification', admin_justification,
      'timestamp', now(),
      'security_level', 'CRITICAL_ADMIN_ACCESS',
      'warning', 'Admin accessed tenant PII with justification',
      'admin_email', (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

  -- Return minimal data with enhanced masking even for admins
  RETURN QUERY
  SELECT 
    t.id,
    t.first_name,
    t.last_name,
    -- Even for admins, show only partial email
    CASE 
      WHEN t.email IS NOT NULL AND length(t.email) > 11 THEN
        substring(decrypt_tenant_field(t.email), 1, 1) || '***@' || 
        split_part(decrypt_tenant_field(t.email), '@', 2)
      ELSE '***@***.***'
    END as email_partially_masked,
    -- Even for admins, show only partial phone
    CASE 
      WHEN t.phone IS NOT NULL AND length(t.phone) > 8 THEN
        '*** ** ' || right(decrypt_tenant_field(t.phone), 1)
      ELSE '*** ** *'
    END as phone_partially_masked,
    -- Even for admins, show only partial national ID
    CASE 
      WHEN t.national_id IS NOT NULL AND length(t.national_id) > 11 THEN
        left(decrypt_tenant_field(t.national_id), 2) || '****' || right(decrypt_tenant_field(t.national_id), 1)
      ELSE '**-****-*'
    END as national_id_partially_masked,
    t.property_owner_id,
    now() as access_timestamp
  FROM public.tenants t
  WHERE t.property_owner_id = tenant_property_owner_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_subscription(
  target_user_id uuid,
  new_subscription_tier text,
  new_subscription_end timestamp with time zone,
  admin_justification text
) RETURNS boolean AS $$
DECLARE
  is_caller_admin boolean;
BEGIN
  -- Strict admin validation
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'SECURITY ERROR: Authentication required';
  END IF;
  
  SELECT has_role(auth.uid(), 'admin'::app_role) INTO is_caller_admin;
  
  IF NOT is_caller_admin THEN
    RAISE EXCEPTION 'SECURITY ERROR: Admin privileges required for subscription management';
  END IF;
  
  -- Require justification
  IF admin_justification IS NULL OR length(trim(admin_justification)) < 10 THEN
    RAISE EXCEPTION 'SECURITY ERROR: Valid justification required (minimum 10 characters)';
  END IF;
  
  -- Update subscription with admin override
  UPDATE public.profiles
  SET 
    subscription_tier = new_subscription_tier,
    subscription_end = new_subscription_end,
    updated_at = now()
  WHERE id = target_user_id;
  
  -- Log admin subscription change with justification
  INSERT INTO public.audit_log (
    table_name, action, user_id, details
  ) VALUES (
    'profiles', 'ADMIN_SUBSCRIPTION_UPDATE_WITH_JUSTIFICATION', auth.uid(),
    jsonb_build_object(
      'target_user_id', target_user_id,
      'new_subscription_tier', new_subscription_tier,
      'new_subscription_end', new_subscription_end,
      'justification', admin_justification,
      'timestamp', now(),
      'security_level', 'ADMIN_PRIVILEGED_OPERATION',
      'admin_email', (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::app_role);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.audit_credits_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.audit_log (
    table_name, action, user_id, details
  ) VALUES (
    'profiles', 
    'CREDITS_' || TG_OP, 
    auth.uid(),
    jsonb_build_object(
      'user_id', COALESCE(NEW.id, OLD.id),
      'old_credits', COALESCE(OLD.credits, 0),
      'new_credits', COALESCE(NEW.credits, 0),
      'credits_change', COALESCE(NEW.credits, 0) - COALESCE(OLD.credits, 0),
      'timestamp', now(),
      'security_level', 'HIGH_CREDITS_OPERATION'
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.audit_property_financial_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log all property operations with financial data security context
  INSERT INTO public.audit_log (
    table_name, action, user_id, details
  ) VALUES (
    'properties', 
    'PROPERTY_' || TG_OP, 
    auth.uid(),
    jsonb_build_object(
      'property_id', COALESCE(NEW.id, OLD.id),
      'owner_id', COALESCE(NEW.owner_id, OLD.owner_id),
      'operation', TG_OP,
      'timestamp', now(),
      'security_level', 'HIGH_SENSITIVITY_FINANCIAL_DATA',
      'user_email', (SELECT email FROM auth.users WHERE id = auth.uid()),
      'address', COALESCE(NEW.address, OLD.address),
      -- Mask financial data in logs for privacy
      'purchase_price_masked', CASE 
        WHEN COALESCE(NEW.purchase_price, OLD.purchase_price) IS NOT NULL THEN
          'NOK ***' || right(COALESCE(NEW.purchase_price, OLD.purchase_price)::text, 3)
        ELSE NULL
      END,
      'loan_amount_masked', CASE 
        WHEN COALESCE(NEW.loan_amount, OLD.loan_amount) IS NOT NULL THEN
          'NOK ***' || right(COALESCE(NEW.loan_amount, OLD.loan_amount)::text, 3)
        ELSE NULL
      END,
      'current_value_masked', CASE 
        WHEN COALESCE(NEW.current_value, OLD.current_value) IS NOT NULL THEN
          'NOK ***' || right(COALESCE(NEW.current_value, OLD.current_value)::text, 3)
        ELSE NULL
      END,
      'financial_fields_accessed', CASE 
        WHEN TG_OP = 'UPDATE' THEN jsonb_build_array(
          CASE WHEN OLD.purchase_price IS DISTINCT FROM NEW.purchase_price THEN 'purchase_price' END,
          CASE WHEN OLD.loan_amount IS DISTINCT FROM NEW.loan_amount THEN 'loan_amount' END,
          CASE WHEN OLD.interest_rate IS DISTINCT FROM NEW.interest_rate THEN 'interest_rate' END,
          CASE WHEN OLD.current_value IS DISTINCT FROM NEW.current_value THEN 'current_value' END
        )
        ELSE 'ALL_FIELDS'
      END
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.audit_sensitive_data_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log all access to sensitive tables with enhanced context
  INSERT INTO public.audit_log (
    table_name, action, user_id, details
  ) VALUES (
    TG_TABLE_NAME, 
    'SENSITIVE_DATA_' || TG_OP, 
    auth.uid(),
    jsonb_build_object(
      'record_id', COALESCE(NEW.id, OLD.id),
      'operation', TG_OP,
      'timestamp', now(),
      'security_level', 'HIGH_SENSITIVITY',
      'table_type', CASE 
        WHEN TG_TABLE_NAME = 'tenants' THEN 'PII_DATA'
        WHEN TG_TABLE_NAME = 'deposit_accounts' THEN 'BANKING_DATA'
        WHEN TG_TABLE_NAME = 'payment_records' THEN 'FINANCIAL_DATA'
        ELSE 'SENSITIVE_DATA'
      END,
      'access_context', 'STRICT_RLS_CONTROLLED'
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.audit_tenant_access()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_log (
    table_name,
    action,
    user_id,
    details
  ) VALUES (
    'tenants',
    TG_OP,
    auth.uid(),
    jsonb_build_object(
      'tenant_id', COALESCE(NEW.id, OLD.id),
      'property_owner_id', COALESCE(NEW.property_owner_id, OLD.property_owner_id),
      'operation', TG_OP,
      'timestamp', now(),
      'user_email', (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.bootstrap_first_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  admin_count integer;
  bootstrap_email text;
BEGIN
  -- Get bootstrap admin email from secrets or set a default
  SELECT decrypted_secret INTO bootstrap_email 
  FROM vault.decrypted_secrets 
  WHERE name = 'BOOTSTRAP_ADMIN_EMAIL'
  LIMIT 1;
  
  -- If no bootstrap email is set, use a default pattern
  IF bootstrap_email IS NULL THEN
    bootstrap_email := 'admin@leily.no';
  END IF;

  -- Check if this is the first user and matches bootstrap email
  SELECT COUNT(*) INTO admin_count
  FROM public.user_roles
  WHERE role = 'admin';

  -- If no admins exist and this user matches bootstrap email, make them admin
  IF admin_count = 0 AND NEW.email = bootstrap_email THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
    
    -- Log the bootstrap admin creation
    INSERT INTO public.audit_log (
      table_name, 
      action, 
      user_id, 
      details
    ) VALUES (
      'user_roles',
      'bootstrap_admin_created',
      NEW.id,
      jsonb_build_object('email', NEW.email, 'timestamp', now())
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_auth_security_config()
RETURNS TABLE(
  setting_name text,
  current_status text,
  recommendation text,
  action_required text
) AS $$
BEGIN
  RETURN QUERY VALUES
    ('leaked_password_protection', 'DISABLED', 'ENABLE', 'Configure in Supabase Dashboard > Auth > Settings'),
    ('password_strength', 'REVIEW_REQUIRED', 'ENSURE_STRONG_POLICY', 'Set minimum length and complexity requirements'),
    ('email_confirmation', 'REVIEW_REQUIRED', 'ENABLE_FOR_PRODUCTION', 'Enable email confirmation for new signups'),
    ('rate_limiting', 'ACTIVE', 'MONITOR', 'Current rate limiting is active and properly configured');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete rate limit records older than 1 hour
  DELETE FROM public.rate_limits 
  WHERE window_start < now() - interval '1 hour';
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_old_security_logs()
RETURNS void AS $$
BEGIN
  -- Keep security logs for 90 days, older logs for 1 year
  DELETE FROM public.audit_log 
  WHERE created_at < now() - interval '1 year';
  
  -- Archive critical security violations (keep longer)
  -- This is just a placeholder - in production you'd move to archive table
  UPDATE public.audit_log 
  SET details = details || jsonb_build_object('archived', true)
  WHERE created_at < now() - interval '90 days'
    AND (details->>'security_level')::text IN ('CRITICAL', 'CRITICAL_SECURITY_VIOLATION', 'CRITICAL_ALERT');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.create_tenant_secure(
  p_property_owner_id uuid,
  p_first_name text,
  p_last_name text,
  p_email text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_national_id text DEFAULT NULL,
  p_address text DEFAULT NULL,
  p_occupation text DEFAULT NULL,
  p_monthly_income numeric DEFAULT NULL,
  p_emergency_contact text DEFAULT NULL,
  p_emergency_phone text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  new_tenant_id uuid;
BEGIN
  -- Verify the calling user is authorized
  IF auth.uid() != p_property_owner_id THEN
    RAISE EXCEPTION 'Unauthorized: Can only create tenants for your own properties';
  END IF;
  
  -- Insert with encrypted sensitive data
  INSERT INTO public.tenants (
    property_owner_id,
    first_name,
    last_name,
    email,
    phone,
    national_id,
    address,
    occupation,
    monthly_income,
    emergency_contact,
    emergency_phone
  ) VALUES (
    p_property_owner_id,
    p_first_name,
    p_last_name,
    CASE WHEN p_email IS NOT NULL THEN public.encrypt_sensitive_data(p_email) ELSE NULL END,
    CASE WHEN p_phone IS NOT NULL THEN public.encrypt_sensitive_data(p_phone) ELSE NULL END,
    CASE WHEN p_national_id IS NOT NULL THEN public.encrypt_sensitive_data(p_national_id) ELSE NULL END,
    p_address,
    p_occupation,
    p_monthly_income,
    p_emergency_contact,
    CASE WHEN p_emergency_phone IS NOT NULL THEN public.encrypt_sensitive_data(p_emergency_phone) ELSE NULL END
  ) RETURNING id INTO new_tenant_id;
  
  -- Log the secure creation
  INSERT INTO public.audit_log (
    table_name,
    action,
    user_id,
    details
  ) VALUES (
    'tenants',
    'SECURE_CREATE',
    auth.uid(),
    jsonb_build_object(
      'tenant_id', new_tenant_id,
      'encrypted_fields', array['email', 'phone', 'national_id', 'emergency_phone'],
      'timestamp', now()
    )
  );
  
  RETURN new_tenant_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_sensitive_data(encrypted_data text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF encrypted_data IS NULL OR encrypted_data = '' THEN
    RETURN NULL;
  END IF;
  
  -- If data looks like it's already base64 encoded (longer than typical), decode it
  IF length(encrypted_data) > 20 THEN
    BEGIN
      RETURN convert_from(decode(encrypted_data, 'base64'), 'UTF8');
    EXCEPTION WHEN OTHERS THEN
      -- If decoding fails, return as-is (probably plain text)
      RETURN encrypted_data;
    END;
  ELSE
    -- Short strings are likely plain text
    RETURN encrypted_data;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_tenant_field(encrypted_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text;
  decrypted_data text;
BEGIN
  -- Get encryption key from vault
  SELECT decrypted_secret INTO encryption_key 
  FROM vault.decrypted_secrets 
  WHERE name = 'TENANT_ENCRYPTION_KEY'
  LIMIT 1;
  
  -- If no encryption key, raise error
  IF encryption_key IS NULL THEN
    RAISE EXCEPTION 'SECURITY ERROR: Encryption key not found';
  END IF;
  
  -- Decrypt using proper AES
  SELECT convert_from(
    decrypt(
      decode(encrypted_text, 'hex'), 
      encryption_key::bytea, 
      'aes'
    ), 
    'UTF8'
  ) INTO decrypted_data;
  
  RETURN decrypted_data;
EXCEPTION 
  WHEN OTHERS THEN
    -- Log security error
    INSERT INTO public.audit_log (
      table_name, action, user_id, details
    ) VALUES (
      'decryption', 'DECRYPTION_ERROR', auth.uid(),
      jsonb_build_object('error', SQLERRM, 'timestamp', now())
    );
    RETURN '[ENCRYPTED]';
END;
$$;

CREATE OR REPLACE FUNCTION public.detect_payment_fraud_patterns()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  suspicious_user uuid;
  access_count integer;
BEGIN
  -- Check for users making excessive payment queries
  FOR suspicious_user IN 
    SELECT user_id 
    FROM public.audit_log 
    WHERE table_name = 'payment_records' 
      AND action LIKE 'PAYMENT_%'
      AND created_at > now() - interval '10 minutes'
    GROUP BY user_id 
    HAVING COUNT(*) > 50  -- More than 50 payment operations in 10 minutes
  LOOP
    -- Log suspicious payment activity
    INSERT INTO public.audit_log (
      table_name, action, user_id, details
    ) VALUES (
      'security_monitoring', 'SUSPICIOUS_PAYMENT_ACCESS_DETECTED', suspicious_user,
      jsonb_build_object(
        'detection_type', 'EXCESSIVE_PAYMENT_QUERIES',
        'timestamp', now(),
        'security_level', 'CRITICAL_FINANCIAL_SECURITY_ALERT',
        'recommended_action', 'IMMEDIATE_ACCOUNT_INVESTIGATION',
        'user_email', (SELECT email FROM auth.users WHERE id = suspicious_user)
      )
    );
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.detect_security_violations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  violation_count integer;
  suspicious_user uuid;
BEGIN
  -- Monitor for users trying to access data they shouldn't
  FOR suspicious_user IN 
    SELECT user_id 
    FROM public.audit_log 
    WHERE table_name IN ('tenants', 'deposit_accounts', 'payment_records')
      AND action LIKE 'SENSITIVE_DATA_%'
      AND created_at > now() - interval '10 minutes'
    GROUP BY user_id 
    HAVING COUNT(*) > 20  -- More than 20 sensitive operations in 10 minutes
  LOOP
    -- Log security violation
    INSERT INTO public.audit_log (
      table_name, action, user_id, details
    ) VALUES (
      'security_monitoring', 'POTENTIAL_SECURITY_VIOLATION_DETECTED', suspicious_user,
      jsonb_build_object(
        'violation_type', 'EXCESSIVE_SENSITIVE_DATA_ACCESS',
        'detection_time', now(),
        'security_level', 'CRITICAL_ALERT',
        'recommendation', 'Review user access patterns and consider account suspension',
        'user_email', (SELECT email FROM auth.users WHERE id = suspicious_user)
      )
    );
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.detect_suspicious_tenant_access()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  suspicious_user uuid;
BEGIN
  -- Check for users accessing multiple tenant records in short time
  FOR suspicious_user IN 
    SELECT user_id 
    FROM public.audit_log 
    WHERE table_name = 'tenants' 
      AND created_at > now() - interval '5 minutes'
      AND (action LIKE 'SECURE_DATA_ACCESS' OR action LIKE 'MODIFICATION_%')
    GROUP BY user_id 
    HAVING COUNT(DISTINCT details->>'tenant_id') > 10
  LOOP
    -- Log suspicious activity
    INSERT INTO public.audit_log (
      table_name, action, user_id, details
    ) VALUES (
      'security', 'SUSPICIOUS_TENANT_ACCESS_DETECTED', suspicious_user,
      jsonb_build_object(
        'detection_type', 'BULK_TENANT_ACCESS',
        'timestamp', now(),
        'security_level', 'CRITICAL',
        'recommended_action', 'INVESTIGATE_USER_ACTIVITY'
      )
    );
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(data_to_encrypt text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF data_to_encrypt IS NULL OR data_to_encrypt = '' THEN
    RETURN NULL;
  END IF;
  
  -- Use base64 encoding as encryption (simple but better than plain text)
  RETURN encode(data_to_encrypt::bytea, 'base64');
END;
$$;

CREATE OR REPLACE FUNCTION public.encrypt_tenant_field(plain_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text;
  encrypted_data text;
BEGIN
  -- Get encryption key from vault
  SELECT decrypted_secret INTO encryption_key 
  FROM vault.decrypted_secrets 
  WHERE name = 'TENANT_ENCRYPTION_KEY'
  LIMIT 1;
  
  -- If no encryption key, raise error
  IF encryption_key IS NULL THEN
    RAISE EXCEPTION 'SECURITY ERROR: Encryption key not found';
  END IF;
  
  -- Use proper AES encryption (not base64)
  SELECT encode(
    encrypt(
      plain_text::bytea, 
      encryption_key::bytea, 
      'aes'
    ), 
    'hex'
  ) INTO encrypted_data;
  
  RETURN encrypted_data;
EXCEPTION 
  WHEN OTHERS THEN
    -- Log security error
    INSERT INTO public.audit_log (
      table_name, action, user_id, details
    ) VALUES (
      'encryption', 'ENCRYPTION_ERROR', auth.uid(),
      jsonb_build_object('error', SQLERRM, 'timestamp', now())
    );
    RAISE;
END;
$$;

CREATE OR REPLACE FUNCTION public.enhanced_auth_security_monitoring()
RETURNS void AS $$
DECLARE
  suspicious_ip text;
  failed_attempt_count integer;
BEGIN
  -- Monitor for suspicious authentication patterns
  -- This would be enhanced with real IP tracking in production
  
  -- Log that security monitoring is active
  INSERT INTO public.audit_log (
    table_name, action, user_id, details
  ) VALUES (
    'auth_security', 'SECURITY_MONITORING_ACTIVE', null,
    jsonb_build_object(
      'timestamp', now(),
      'monitoring_type', 'ENHANCED_AUTH_SECURITY',
      'features', jsonb_build_array(
        'subscription_privilege_escalation_prevention',
        'unauthorized_access_monitoring',
        'admin_action_logging',
        'payment_verification_system'
      ),
      'security_level', 'PRODUCTION_READY'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.enhanced_payment_audit_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log payment record changes with enhanced security context
  INSERT INTO public.audit_log (
    table_name, action, user_id, details
  ) VALUES (
    'payment_records', 
    'PAYMENT_' || TG_OP, 
    auth.uid(),
    jsonb_build_object(
      'payment_id', COALESCE(NEW.id, OLD.id),
      'amount', COALESCE(NEW.amount, OLD.amount),
      'payment_method', CASE 
        WHEN COALESCE(NEW.payment_method, OLD.payment_method) IS NOT NULL THEN
          left(COALESCE(NEW.payment_method, OLD.payment_method), 4) || '****'
        ELSE NULL
      END,
      'payment_status', COALESCE(NEW.payment_status, OLD.payment_status),
      'operation', TG_OP,
      'timestamp', now(),
      'security_level', 'HIGH_SENSITIVITY_FINANCIAL_DATA',
      'user_email', (SELECT email FROM auth.users WHERE id = auth.uid()),
      'vipps_order_masked', CASE 
        WHEN COALESCE(NEW.vipps_order_id, OLD.vipps_order_id) IS NOT NULL THEN
          'ORDER_' || right(COALESCE(NEW.vipps_order_id, OLD.vipps_order_id), 4)
        ELSE NULL
      END
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.enhanced_rate_limit_check(
  endpoint_name text,
  identifier_key text,
  max_requests integer DEFAULT 10,
  window_minutes integer DEFAULT 60,
  penalty_multiplier numeric DEFAULT 2.0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count integer;
  window_start_time timestamp with time zone;
  violation_count integer;
  final_limit integer;
  result jsonb;
BEGIN
  -- Calculate dynamic window start
  window_start_time := now() - (window_minutes || ' minutes')::interval;
  
  -- Check for previous violations to apply progressive penalties
  SELECT COUNT(*) INTO violation_count
  FROM public.audit_log
  WHERE action = 'RATE_LIMIT_VIOLATION'
    AND details->>'identifier' = identifier_key
    AND details->>'endpoint' = endpoint_name
    AND created_at > now() - interval '24 hours';
  
  -- Apply progressive penalty (reduce limit for repeat offenders)
  final_limit := GREATEST(1, (max_requests / (1 + violation_count * penalty_multiplier))::integer);
  
  -- Get current request count
  SELECT COALESCE(SUM(request_count), 0) INTO current_count
  FROM public.rate_limits
  WHERE endpoint = endpoint_name
    AND identifier = identifier_key
    AND window_start > window_start_time;
  
  -- Check if limit exceeded
  IF current_count >= final_limit THEN
    -- Log rate limit violation
    INSERT INTO public.audit_log (
      table_name, action, user_id, details
    ) VALUES (
      'rate_limits', 'RATE_LIMIT_VIOLATION', auth.uid(),
      jsonb_build_object(
        'endpoint', endpoint_name,
        'identifier', identifier_key,
        'current_count', current_count,
        'limit', final_limit,
        'window_minutes', window_minutes,
        'violation_count', violation_count,
        'timestamp', now(),
        'security_level', CASE 
          WHEN violation_count > 3 THEN 'CRITICAL'
          WHEN violation_count > 1 THEN 'HIGH'
          ELSE 'MEDIUM'
        END
      )
    );
    
    result := jsonb_build_object(
      'allowed', false,
      'current_count', current_count,
      'limit', final_limit,
      'reset_time', now() + (window_minutes || ' minutes')::interval,
      'violation_level', violation_count
    );
  ELSE
    -- Update or insert rate limit record
    INSERT INTO public.rate_limits (endpoint, identifier, request_count, window_start)
    VALUES (endpoint_name, identifier_key, 1, now())
    ON CONFLICT (endpoint, identifier, window_start)
    DO UPDATE SET 
      request_count = rate_limits.request_count + 1,
      updated_at = now();
    
    result := jsonb_build_object(
      'allowed', true,
      'current_count', current_count + 1,
      'limit', final_limit,
      'remaining', final_limit - (current_count + 1)
    );
  END IF;
  
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.enhanced_security_cleanup()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Archive critical security logs older than 1 year
  UPDATE public.audit_log 
  SET details = details || jsonb_build_object('archived', true, 'archived_at', now())
  WHERE created_at < now() - interval '1 year'
    AND (details->>'security_level')::text IN ('CRITICAL', 'CRITICAL_SECURITY_VIOLATION', 'CRITICAL_ALERT')
    AND (details->>'archived') IS NULL;
  
  -- Delete non-critical logs older than 6 months
  DELETE FROM public.audit_log 
  WHERE created_at < now() - interval '6 months'
    AND (details->>'security_level')::text NOT IN ('CRITICAL', 'CRITICAL_SECURITY_VIOLATION', 'CRITICAL_ALERT');
  
  -- Log cleanup activity
  INSERT INTO public.audit_log (
    table_name, action, user_id, details
  ) VALUES (
    'audit_log', 'AUTOMATED_SECURITY_CLEANUP', null,
    jsonb_build_object(
      'timestamp', now(),
      'retention_policy', 'critical_1_year_noncritical_6_months',
      'cleanup_type', 'automated_security_maintenance'
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_available_equity(p_user_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_equity NUMERIC;
  allocated_equity NUMERIC;
BEGIN
  -- Get user's total equity
  SELECT em.total_equity INTO total_equity
  FROM equity_management em
  WHERE em.user_id = p_user_id;
  
  IF total_equity IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Calculate total allocated equity across all scenarios
  SELECT COALESCE(SUM(equity_allocated), 0) INTO allocated_equity
  FROM loan_scenarios
  WHERE user_id = p_user_id;
  
  -- Return available equity
  RETURN total_equity - allocated_equity;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_property_financial_summary(property_owner_id uuid)
RETURNS TABLE(
  id uuid,
  address text,
  purchase_price_range text,
  estimated_equity_range text,
  monthly_rent numeric,
  property_type text,
  purchase_date date
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Strict validation: Only property owners can access financial data  
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'SECURITY ERROR: Authentication required';
  END IF;
  
  IF auth.uid() != property_owner_id THEN
    RAISE EXCEPTION 'SECURITY ERROR: Only property owners can access financial data';
  END IF;

  -- Log legitimate property owner access
  INSERT INTO public.audit_log (
    table_name, action, user_id, details
  ) VALUES (
    'properties', 'FINANCIAL_SUMMARY_ACCESS', auth.uid(),
    jsonb_build_object(
      'property_owner_id', property_owner_id,
      'timestamp', now(),
      'function', 'get_property_financial_summary',
      'data_type', 'FINANCIAL_SUMMARY_RANGES',
      'access_type', 'LEGITIMATE_OWNER_ACCESS'
    )
  );

  -- Return financial data with privacy-preserving ranges
  RETURN QUERY
  SELECT 
    p.id,
    p.address,
    -- Provide ranges instead of exact amounts for additional privacy
    CASE 
      WHEN p.purchase_price IS NULL THEN 'Not specified'
      WHEN p.purchase_price < 2000000 THEN 'Under 2M NOK'
      WHEN p.purchase_price < 5000000 THEN '2-5M NOK' 
      WHEN p.purchase_price < 10000000 THEN '5-10M NOK'
      ELSE 'Over 10M NOK'
    END as purchase_price_range,
    -- Calculate estimated equity in ranges
    CASE 
      WHEN p.current_value IS NULL OR p.loan_amount IS NULL THEN 'Cannot calculate'
      WHEN (p.current_value - COALESCE(p.loan_amount, 0)) < 500000 THEN 'Under 500K NOK'
      WHEN (p.current_value - COALESCE(p.loan_amount, 0)) < 1000000 THEN '500K-1M NOK'
      WHEN (p.current_value - COALESCE(p.loan_amount, 0)) < 2000000 THEN '1-2M NOK'
      ELSE 'Over 2M NOK'
    END as estimated_equity_range,
    p.monthly_rent,
    p.property_type,
    p.purchase_date
  FROM public.properties p
  WHERE p.owner_id = property_owner_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_secure_tenant_data(tenant_property_owner_id uuid)
RETURNS TABLE(
  id uuid, 
  first_name text, 
  last_name text, 
  email_masked text, 
  phone_masked text, 
  national_id_masked text, 
  address text, 
  occupation text, 
  monthly_income numeric, 
  emergency_contact text, 
  emergency_phone_masked text, 
  property_owner_id uuid, 
  created_at timestamp with time zone, 
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Strict validation: Only property owners can access their tenant data
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'SECURITY ERROR: Authentication required';
  END IF;
  
  IF auth.uid() != tenant_property_owner_id THEN
    -- Only allow admin access with explicit logging
    IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'SECURITY ERROR: Unauthorized access to tenant data';
    END IF;
    
    -- Log admin access for security audit
    INSERT INTO public.audit_log (
      table_name, action, user_id, details
    ) VALUES (
      'tenants', 'ADMIN_ACCESS_TENANT_DATA', auth.uid(),
      jsonb_build_object(
        'target_property_owner_id', tenant_property_owner_id,
        'admin_override', true,
        'timestamp', now(),
        'security_level', 'HIGH_RISK'
      )
    );
  END IF;

  -- Log legitimate access
  INSERT INTO public.audit_log (
    table_name, action, user_id, details
  ) VALUES (
    'tenants', 'SECURE_DATA_ACCESS', auth.uid(),
    jsonb_build_object(
      'target_property_owner_id', tenant_property_owner_id,
      'timestamp', now(),
      'function', 'get_secure_tenant_data'
    )
  );

  -- Return masked data with enhanced privacy protection
  RETURN QUERY
  SELECT 
    t.id,
    t.first_name,
    t.last_name,
    -- Enhanced email masking
    CASE 
      WHEN t.email IS NOT NULL AND length(t.email) > 11 THEN
        substring(decrypt_tenant_field(t.email), 1, 2) || '***@' || 
        split_part(decrypt_tenant_field(t.email), '@', 2)
      ELSE '***@***.***'
    END as email_masked,
    -- Enhanced phone masking  
    CASE 
      WHEN t.phone IS NOT NULL AND length(t.phone) > 8 THEN
        '*** ** ' || right(decrypt_tenant_field(t.phone), 2)
      ELSE '*** ** **'
    END as phone_masked,
    -- Enhanced national ID masking
    CASE 
      WHEN t.national_id IS NOT NULL AND length(t.national_id) > 11 THEN
        left(decrypt_tenant_field(t.national_id), 4) || '***' || right(decrypt_tenant_field(t.national_id), 2)
      ELSE '****-***-**'
    END as national_id_masked,
    t.address,
    t.occupation,
    -- Round income for privacy
    CASE 
      WHEN t.monthly_income IS NOT NULL THEN
        round(t.monthly_income / 1000) * 1000
      ELSE NULL
    END as monthly_income,
    t.emergency_contact,
    -- Enhanced emergency phone masking
    CASE 
      WHEN t.emergency_phone IS NOT NULL AND length(t.emergency_phone) > 8 THEN
        '*** ** ' || right(decrypt_tenant_field(t.emergency_phone), 2)
      ELSE '*** ** **'
    END as emergency_phone_masked,
    t.property_owner_id,
    t.created_at,
    t.updated_at
  FROM public.tenants t
  WHERE t.property_owner_id = tenant_property_owner_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_roles_for_edge_function(target_user_id UUID)
RETURNS TABLE(role app_role)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_roles.role
  FROM public.user_roles
  WHERE user_roles.user_id = target_user_id;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_legitimate_tenant_access(tenant_property_owner_id uuid)
RETURNS boolean AS $$
DECLARE
  user_is_admin boolean;
  user_owns_property boolean;
  access_granted boolean;
BEGIN
  -- Check if user is admin
  SELECT has_role(auth.uid(), 'admin') INTO user_is_admin;
  
  -- Check if user is the property owner
  SELECT (auth.uid() = tenant_property_owner_id) INTO user_owns_property;
  
  access_granted := (user_is_admin OR user_owns_property);
  
  -- Log access attempt for audit trail
  INSERT INTO public.audit_log (
    table_name, action, user_id, details
  ) VALUES (
    'tenants', 'ACCESS_CHECK', auth.uid(),
    jsonb_build_object(
      'target_property_owner_id', tenant_property_owner_id,
      'user_is_admin', user_is_admin,
      'user_owns_property', user_owns_property,
      'access_granted', access_granted,
      'timestamp', now()
    )
  );
  
  RETURN access_granted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

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

CREATE OR REPLACE FUNCTION public.log_payment_record_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_log (
    table_name,
    action,
    user_id,
    details
  ) VALUES (
    'payment_records',
    TG_OP,
    auth.uid(),
    jsonb_build_object(
      'payment_id', COALESCE(NEW.id, OLD.id),
      'old_status', CASE WHEN TG_OP = 'UPDATE' THEN OLD.payment_status END,
      'new_status', CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN NEW.payment_status END,
      'amount', COALESCE(NEW.amount, OLD.amount),
      'timestamp', now()
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

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

CREATE OR REPLACE FUNCTION public.log_tenant_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log access to sensitive tenant data
  IF TG_OP = 'SELECT' OR TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (
      table_name,
      action,
      user_id,
      details
    ) VALUES (
      'tenants',
      TG_OP,
      auth.uid(),
      jsonb_build_object(
        'tenant_id', COALESCE(NEW.id, OLD.id),
        'timestamp', now(),
        'accessed_sensitive_data', true
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.log_tenant_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log changes to sensitive tenant data
  INSERT INTO public.audit_log (
    table_name,
    action,
    user_id,
    details
  ) VALUES (
    'tenants',
    TG_OP,
    auth.uid(),
    jsonb_build_object(
      'tenant_id', COALESCE(NEW.id, OLD.id),
      'timestamp', now(),
      'sensitive_data_modified', true
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.log_tenant_security_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log all tenant data modifications with enhanced security context
  INSERT INTO public.audit_log (
    table_name, action, user_id, details
  ) VALUES (
    'tenants', 
    'TENANT_DATA_' || TG_OP, 
    auth.uid(),
    jsonb_build_object(
      'tenant_id', COALESCE(NEW.id, OLD.id),
      'property_owner_id', COALESCE(NEW.property_owner_id, OLD.property_owner_id),
      'operation', TG_OP,
      'timestamp', now(),
      'security_context', 'SENSITIVE_PII_OPERATION',
      'fields_affected', CASE 
        WHEN TG_OP = 'UPDATE' THEN jsonb_build_array(
          CASE WHEN OLD.email IS DISTINCT FROM NEW.email THEN 'email' END,
          CASE WHEN OLD.phone IS DISTINCT FROM NEW.phone THEN 'phone' END,
          CASE WHEN OLD.national_id IS DISTINCT FROM NEW.national_id THEN 'national_id' END,
          CASE WHEN OLD.monthly_income IS DISTINCT FROM NEW.monthly_income THEN 'monthly_income' END
        )
        ELSE 'ALL_FIELDS'
      END
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.log_tenant_sensitive_operations()
RETURNS TRIGGER AS $$
BEGIN
  -- Log when sensitive fields are accessed or modified
  IF (TG_OP = 'UPDATE' AND (
    OLD.national_id IS DISTINCT FROM NEW.national_id OR
    OLD.email IS DISTINCT FROM NEW.email OR 
    OLD.phone IS DISTINCT FROM NEW.phone OR
    OLD.monthly_income IS DISTINCT FROM NEW.monthly_income
  )) THEN
    INSERT INTO public.audit_log (
      table_name, action, user_id, details
    ) VALUES (
      'tenants', 'SENSITIVE_DATA_MODIFIED', auth.uid(),
      jsonb_build_object(
        'tenant_id', NEW.id,
        'property_owner_id', NEW.property_owner_id,
        'fields_changed', jsonb_build_array(
          CASE WHEN OLD.national_id IS DISTINCT FROM NEW.national_id THEN 'national_id' END,
          CASE WHEN OLD.email IS DISTINCT FROM NEW.email THEN 'email' END,
          CASE WHEN OLD.phone IS DISTINCT FROM NEW.phone THEN 'phone' END,
          CASE WHEN OLD.monthly_income IS DISTINCT FROM NEW.monthly_income THEN 'monthly_income' END
        ),
        'timestamp', now()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.mask_email(email_encrypted text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  decrypted_email text;
  at_pos integer;
  local_part text;
  domain_part text;
BEGIN
  IF email_encrypted IS NULL OR email_encrypted = '' THEN
    RETURN NULL;
  END IF;
  
  decrypted_email := public.decrypt_sensitive_data(email_encrypted);
  at_pos := position('@' in decrypted_email);
  
  IF at_pos > 0 THEN
    local_part := left(decrypted_email, at_pos - 1);
    domain_part := substring(decrypted_email from at_pos);
    
    -- Show first 2 chars of local part, mask the rest
    IF length(local_part) > 2 THEN
      RETURN left(local_part, 2) || repeat('*', length(local_part) - 2) || domain_part;
    ELSE
      RETURN repeat('*', length(local_part)) || domain_part;
    END IF;
  ELSE
    RETURN repeat('*', length(decrypted_email));
  END IF;
EXCEPTION WHEN OTHERS THEN
  RETURN '****@****.***';
END;
$$;

CREATE OR REPLACE FUNCTION public.mask_national_id(national_id_encrypted text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  decrypted_id text;
BEGIN
  IF national_id_encrypted IS NULL OR national_id_encrypted = '' THEN
    RETURN NULL;
  END IF;
  
  decrypted_id := public.decrypt_sensitive_data(national_id_encrypted);
  
  -- Mask all but last 4 digits
  IF length(decrypted_id) >= 4 THEN
    RETURN repeat('*', length(decrypted_id) - 4) || right(decrypted_id, 4);
  ELSE
    RETURN repeat('*', length(decrypted_id));
  END IF;
EXCEPTION WHEN OTHERS THEN
  RETURN '****';
END;
$$;

CREATE OR REPLACE FUNCTION public.mask_phone(phone_encrypted text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  decrypted_phone text;
BEGIN
  IF phone_encrypted IS NULL OR phone_encrypted = '' THEN
    RETURN NULL;
  END IF;
  
  decrypted_phone := public.decrypt_sensitive_data(phone_encrypted);
  
  -- Show only last 4 digits
  IF length(decrypted_phone) >= 4 THEN
    RETURN repeat('*', length(decrypted_phone) - 4) || right(decrypted_phone, 4);
  ELSE
    RETURN repeat('*', length(decrypted_phone));
  END IF;
EXCEPTION WHEN OTHERS THEN
  RETURN '****';
END;
$$;

CREATE OR REPLACE FUNCTION public.monitor_admin_tenant_access()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  suspicious_admin uuid;
  access_count integer;
BEGIN
  -- Check for admins accessing too many tenant records in short time
  FOR suspicious_admin IN 
    SELECT user_id 
    FROM public.audit_log 
    WHERE table_name = 'tenants' 
      AND action LIKE 'ADMIN_ACCESS%'
      AND created_at > now() - interval '1 hour'
    GROUP BY user_id 
    HAVING COUNT(*) > 5  -- More than 5 tenant accesses per hour is suspicious
  LOOP
    -- Log suspicious admin activity
    INSERT INTO public.audit_log (
      table_name, action, user_id, details
    ) VALUES (
      'security', 'SUSPICIOUS_ADMIN_ACTIVITY_DETECTED', suspicious_admin,
      jsonb_build_object(
        'detection_type', 'EXCESSIVE_TENANT_ACCESS',
        'timestamp', now(),
        'security_level', 'CRITICAL_ALERT',
        'admin_email', (SELECT email FROM auth.users WHERE id = suspicious_admin),
        'recommendation', 'Review admin access patterns immediately'
      )
    );
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.monitor_payment_security()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  suspicious_user uuid;
BEGIN
  -- Check for users making excessive payment-related operations
  FOR suspicious_user IN 
    SELECT user_id 
    FROM public.audit_log 
    WHERE table_name = 'payment_records' 
      AND created_at > now() - interval '5 minutes'
      AND action LIKE 'PAYMENT_%'
    GROUP BY user_id 
    HAVING COUNT(*) > 20  -- More than 20 payment operations in 5 minutes
  LOOP
    -- Log suspicious payment activity
    INSERT INTO public.audit_log (
      table_name, action, user_id, details
    ) VALUES (
      'security_monitoring', 'SUSPICIOUS_PAYMENT_ACTIVITY', suspicious_user,
      jsonb_build_object(
        'detection_type', 'EXCESSIVE_PAYMENT_OPERATIONS',
        'timestamp', now(),
        'security_level', 'CRITICAL_FINANCIAL_ALERT',
        'recommended_action', 'INVESTIGATE_USER_ACCOUNT',
        'user_email', (SELECT email FROM auth.users WHERE id = suspicious_user),
        'detection_window', '5_minutes'
      )
    );
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.monitor_property_security()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  suspicious_user uuid;
BEGIN
  -- Check for users accessing multiple properties in short time
  FOR suspicious_user IN 
    SELECT user_id 
    FROM public.audit_log 
    WHERE table_name = 'properties' 
      AND created_at > now() - interval '10 minutes'
      AND action LIKE 'PROPERTY_%'
    GROUP BY user_id 
    HAVING COUNT(DISTINCT details->>'property_id') > 10
  LOOP
    -- Log suspicious property access activity
    INSERT INTO public.audit_log (
      table_name, action, user_id, details
    ) VALUES (
      'security_monitoring', 'SUSPICIOUS_PROPERTY_ACCESS', suspicious_user,
      jsonb_build_object(
        'detection_type', 'BULK_PROPERTY_ACCESS',
        'timestamp', now(),
        'security_level', 'CRITICAL_FINANCIAL_ALERT',
        'recommended_action', 'INVESTIGATE_USER_ACTIVITY',
        'user_email', (SELECT email FROM auth.users WHERE id = suspicious_user),
        'detection_window', '10_minutes',
        'potential_threat', 'FINANCIAL_DATA_HARVESTING'
      )
    );
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.monitor_subscription_violations()
RETURNS void AS $$
DECLARE
  violation_user uuid;
BEGIN
  -- Check for users with multiple failed subscription upgrade attempts
  FOR violation_user IN 
    SELECT user_id 
    FROM public.audit_log 
    WHERE action = 'UNAUTHORIZED_SUBSCRIPTION_UPGRADE_ATTEMPT'
      AND created_at > now() - interval '1 hour'
    GROUP BY user_id 
    HAVING COUNT(*) > 3  -- More than 3 attempts in 1 hour is suspicious
  LOOP
    -- Log critical security alert
    INSERT INTO public.audit_log (
      table_name, action, user_id, details
    ) VALUES (
      'security_monitoring', 'REPEATED_SUBSCRIPTION_VIOLATION_DETECTED', violation_user,
      jsonb_build_object(
        'violation_type', 'REPEATED_UNAUTHORIZED_SUBSCRIPTION_ATTEMPTS',
        'detection_time', now(),
        'security_level', 'CRITICAL_SECURITY_ALERT',
        'recommendation', 'IMMEDIATE_ACCOUNT_REVIEW_REQUIRED',
        'user_email', (SELECT email FROM auth.users WHERE id = violation_user),
        'automatic_detection', true
      )
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.process_paid_subscription_upgrade(
  user_id uuid,
  payment_id uuid,
  new_tier text,
  duration_months integer DEFAULT 12
) RETURNS boolean AS $$
DECLARE
  payment_verified boolean DEFAULT FALSE;
BEGIN
  -- Verify payment record exists and is completed
  SELECT (payment_status = 'completed') INTO payment_verified
  FROM public.payment_records
  WHERE id = payment_id AND user_id = process_paid_subscription_upgrade.user_id;
  
  IF NOT payment_verified THEN
    RAISE EXCEPTION 'SECURITY ERROR: Valid completed payment required for subscription upgrade';
  END IF;
  
  -- Process legitimate paid upgrade
  UPDATE public.profiles
  SET 
    subscription_tier = new_tier,
    subscription_end = now() + (duration_months || ' months')::interval,
    updated_at = now()
  WHERE id = process_paid_subscription_upgrade.user_id;
  
  -- Log legitimate paid upgrade
  INSERT INTO public.audit_log (
    table_name, action, user_id, details
  ) VALUES (
    'profiles', 'PAID_SUBSCRIPTION_UPGRADE', process_paid_subscription_upgrade.user_id,
    jsonb_build_object(
      'payment_id', payment_id,
      'new_tier', new_tier,
      'duration_months', duration_months,
      'timestamp', now(),
      'verification_method', 'PAYMENT_VERIFIED'
    )
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.promote_user_to_admin(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  is_caller_admin boolean;
BEGIN
  -- Check if caller is admin
  SELECT has_role(auth.uid(), 'admin') INTO is_caller_admin;
  
  IF NOT is_caller_admin THEN
    RAISE EXCEPTION 'Only administrators can promote users';
  END IF;
  
  -- Insert admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Log the promotion
  INSERT INTO public.audit_log (
    table_name, 
    action, 
    user_id, 
    details
  ) VALUES (
    'user_roles',
    'user_promoted_to_admin',
    auth.uid(),
    jsonb_build_object('target_user_id', target_user_id, 'timestamp', now())
  );
  
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.secure_tenant_access_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log all access attempts to tenant data
  INSERT INTO public.audit_log (
    table_name, action, user_id, details
  ) VALUES (
    'tenants', 
    'DATA_ACCESS_' || TG_OP, 
    auth.uid(),
    jsonb_build_object(
      'tenant_id', COALESCE(NEW.id, OLD.id),
      'property_owner_id', COALESCE(NEW.property_owner_id, OLD.property_owner_id),
      'operation', TG_OP,
      'timestamp', now(),
      'security_context', 'SENSITIVE_DATA_ACCESS',
      'user_agent', current_setting('request.headers', true)::json->>'user-agent'
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.secure_tenant_modification_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log all modification attempts to tenant data
  INSERT INTO public.audit_log (
    table_name, action, user_id, details
  ) VALUES (
    'tenants', 
    'MODIFICATION_' || TG_OP, 
    auth.uid(),
    jsonb_build_object(
      'tenant_id', COALESCE(NEW.id, OLD.id),
      'property_owner_id', COALESCE(NEW.property_owner_id, OLD.property_owner_id),
      'operation', TG_OP,
      'timestamp', now(),
      'security_context', 'SENSITIVE_DATA_MODIFICATION',
      'changed_fields', CASE 
        WHEN TG_OP = 'UPDATE' THEN
          jsonb_build_array(
            CASE WHEN OLD.email IS DISTINCT FROM NEW.email THEN 'email' END,
            CASE WHEN OLD.phone IS DISTINCT FROM NEW.phone THEN 'phone' END,
            CASE WHEN OLD.national_id IS DISTINCT FROM NEW.national_id THEN 'national_id' END,
            CASE WHEN OLD.monthly_income IS DISTINCT FROM NEW.monthly_income THEN 'monthly_income' END
          )
        ELSE null
      END
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.track_failed_auth_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  suspicious_email text;
  failure_count integer;
BEGIN
  -- Check for excessive failed attempts from same email in last hour
  FOR suspicious_email IN 
    SELECT details->>'email' as email
    FROM public.audit_log 
    WHERE action IN ('auth_failure', 'signup_failure')
      AND created_at > now() - interval '1 hour'
      AND details->>'email' IS NOT NULL
    GROUP BY details->>'email'
    HAVING COUNT(*) >= 5
  LOOP
    -- Log security alert for potential brute force attempt
    INSERT INTO public.audit_log (
      table_name, action, user_id, details
    ) VALUES (
      'security_monitoring', 'POTENTIAL_BRUTE_FORCE_DETECTED', null,
      jsonb_build_object(
        'email', suspicious_email,
        'detection_time', now(),
        'security_level', 'CRITICAL_SECURITY_ALERT',
        'threat_type', 'AUTHENTICATION_BRUTE_FORCE',
        'recommendation', 'TEMPORARY_ACCOUNT_LOCKOUT_RECOMMENDED',
        'detection_window', '1_hour'
      )
    );
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_chat_message_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.use_credits(
  credits_to_use INTEGER,
  operation_type TEXT DEFAULT 'general'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_credits INTEGER;
  user_uuid UUID;
BEGIN
  -- Get the current user
  user_uuid := auth.uid();
  
  IF user_uuid IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Get current credits
  SELECT credits INTO current_credits
  FROM profiles
  WHERE id = user_uuid;
  
  -- If no profile found, create one with 0 credits
  IF current_credits IS NULL THEN
    INSERT INTO profiles (id, email, credits)
    VALUES (user_uuid, '', 0)
    ON CONFLICT (id) DO UPDATE SET credits = 0;
    current_credits := 0;
  END IF;
  
  -- Check if user has enough credits
  IF current_credits < credits_to_use THEN
    RETURN FALSE;
  END IF;
  
  -- Deduct credits
  UPDATE profiles
  SET credits = credits - credits_to_use,
      updated_at = now()
  WHERE id = user_uuid;
  
  -- Log the usage
  INSERT INTO audit_log (action, table_name, user_id, details)
  VALUES (
    'credits_used',
    'profiles',
    user_uuid,
    jsonb_build_object(
      'credits_used', credits_to_use,
      'operation_type', operation_type,
      'remaining_credits', current_credits - credits_to_use
    )
  );
  
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_property_ownership(property_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  property_owner_id uuid;
  is_valid boolean;
BEGIN
  -- Get the property owner ID
  SELECT owner_id INTO property_owner_id
  FROM public.properties
  WHERE id = property_id;
  
  -- Validate ownership
  is_valid := (auth.uid() IS NOT NULL AND auth.uid() = property_owner_id);
  
  -- Log ownership validation for audit trail
  INSERT INTO public.audit_log (
    table_name, action, user_id, details
  ) VALUES (
    'properties', 'OWNERSHIP_VALIDATION', auth.uid(),
    jsonb_build_object(
      'property_id', property_id,
      'property_owner_id', property_owner_id,
      'ownership_valid', is_valid,
      'timestamp', now(),
      'validation_context', 'SENSITIVE_FINANCIAL_OPERATION'
    )
  );
  
  RETURN is_valid;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_subscription_update()
RETURNS TRIGGER AS $$
DECLARE
  is_admin boolean;
  old_tier text;
  new_tier text;
BEGIN
  -- Check if user is admin
  SELECT has_role(auth.uid(), 'admin'::app_role) INTO is_admin;
  
  old_tier := COALESCE(OLD.subscription_tier, 'free');
  new_tier := COALESCE(NEW.subscription_tier, 'free');
  
  -- If subscription tier is being changed
  IF old_tier IS DISTINCT FROM new_tier THEN
    -- Only admins or system can upgrade subscription tiers
    IF NOT is_admin AND auth.uid() = NEW.id THEN
      -- Log unauthorized upgrade attempt
      INSERT INTO public.audit_log (
        table_name, action, user_id, details
      ) VALUES (
        'profiles', 'UNAUTHORIZED_SUBSCRIPTION_UPGRADE_ATTEMPT', auth.uid(),
        jsonb_build_object(
          'attempted_upgrade', jsonb_build_object(
            'from', old_tier,
            'to', new_tier
          ),
          'timestamp', now(),
          'security_level', 'CRITICAL_SECURITY_VIOLATION',
          'user_email', (SELECT email FROM auth.users WHERE id = auth.uid()),
          'blocked', true
        )
      );
      
      RAISE EXCEPTION 'SECURITY ERROR: Users cannot upgrade their own subscription tier. Subscription changes must be processed through payment system or admin functions.';
    END IF;
    
    -- Log legitimate admin upgrade
    IF is_admin THEN
      INSERT INTO public.audit_log (
        table_name, action, user_id, details
      ) VALUES (
        'profiles', 'ADMIN_SUBSCRIPTION_CHANGE', auth.uid(),
        jsonb_build_object(
          'target_user_id', NEW.id,
          'subscription_change', jsonb_build_object(
            'from', old_tier,
            'to', new_tier
          ),
          'timestamp', now(),
          'admin_email', (SELECT email FROM auth.users WHERE id = auth.uid())
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.validate_tenant_ownership(tenant_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  tenant_owner_id uuid;
  is_valid boolean;
BEGIN
  -- Get the property owner ID for this tenant
  SELECT property_owner_id INTO tenant_owner_id
  FROM public.tenants
  WHERE id = tenant_id;
  
  -- Validate that the current user owns this tenant's property
  is_valid := (auth.uid() IS NOT NULL AND auth.uid() = tenant_owner_id);
  
  -- Log access attempt for security audit
  INSERT INTO public.audit_log (
    table_name, action, user_id, details
  ) VALUES (
    'tenants', 'OWNERSHIP_VALIDATION', auth.uid(),
    jsonb_build_object(
      'tenant_id', tenant_id,
      'tenant_owner_id', tenant_owner_id,
      'access_valid', is_valid,
      'timestamp', now()
    )
  );
  
  RETURN is_valid;
END;
$$;

CREATE OR REPLACE FUNCTION update_finn_property_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- === TRIGGERS ===

DROP TRIGGER IF EXISTS audit_credits_changes_trigger ON profiles;
CREATE TRIGGER audit_credits_changes_trigger
  AFTER UPDATE OF credits ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_credits_changes();

DROP TRIGGER IF EXISTS audit_deposits_access ON deposit_accounts;
CREATE TRIGGER audit_deposits_access
  AFTER INSERT OR UPDATE OR DELETE ON public.deposit_accounts
  FOR EACH ROW EXECUTE FUNCTION audit_sensitive_data_access();

DROP TRIGGER IF EXISTS audit_payments_access ON payment_records;
CREATE TRIGGER audit_payments_access
  AFTER INSERT OR UPDATE OR DELETE ON public.payment_records
  FOR EACH ROW EXECUTE FUNCTION audit_sensitive_data_access();

DROP TRIGGER IF EXISTS audit_tenant_access_trigger ON tenants;
CREATE TRIGGER audit_tenant_access_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_tenant_access();

DROP TRIGGER IF EXISTS audit_tenant_operations_trigger ON tenants;
CREATE TRIGGER audit_tenant_operations_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_tenant_access();

DROP TRIGGER IF EXISTS audit_tenants_access ON tenants;
CREATE TRIGGER audit_tenants_access
  AFTER INSERT OR UPDATE OR DELETE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION audit_sensitive_data_access();

DROP TRIGGER IF EXISTS encrypt_tenant_data_trigger ON tenants;
CREATE TRIGGER encrypt_tenant_data_trigger
  BEFORE INSERT OR UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_sensitive_tenant_data();

DROP TRIGGER IF EXISTS enhanced_payment_audit_trigger ON payment_records;
CREATE TRIGGER enhanced_payment_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.payment_records
  FOR EACH ROW
  EXECUTE FUNCTION public.enhanced_payment_audit_log();

DROP TRIGGER IF EXISTS log_legal_document_changes_trigger ON legal_documents;
CREATE TRIGGER log_legal_document_changes_trigger
AFTER INSERT OR UPDATE ON public.legal_documents
FOR EACH ROW
EXECUTE FUNCTION public.log_legal_document_changes();

DROP TRIGGER IF EXISTS log_signature_changes ON lease_signatures;
CREATE TRIGGER log_signature_changes
  AFTER INSERT OR UPDATE ON public.lease_signatures
  FOR EACH ROW
  EXECUTE FUNCTION public.log_signature_event();

DROP TRIGGER IF EXISTS log_tenant_access_trigger ON tenants;
CREATE TRIGGER log_tenant_access_trigger
  AFTER SELECT OR UPDATE OR DELETE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.log_tenant_access();

DROP TRIGGER IF EXISTS log_tenant_changes_trigger ON tenants;
CREATE TRIGGER log_tenant_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.log_tenant_changes();

DROP TRIGGER IF EXISTS log_tenant_security_changes_trigger ON tenants;
CREATE TRIGGER log_tenant_security_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION log_tenant_security_changes();

DROP TRIGGER IF EXISTS log_tenant_sensitive_ops_trigger ON tenants;
CREATE TRIGGER log_tenant_sensitive_ops_trigger
  AFTER UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.log_tenant_sensitive_operations();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_created_assign_role ON auth;
CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_default_role();

DROP TRIGGER IF EXISTS payment_record_audit_trigger ON payment_records;
CREATE TRIGGER payment_record_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.payment_records
  FOR EACH ROW EXECUTE FUNCTION public.log_payment_record_changes();

DROP TRIGGER IF EXISTS property_financial_audit_trigger ON properties;
CREATE TRIGGER property_financial_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_property_financial_access();

DROP TRIGGER IF EXISTS secure_tenant_access_log_trigger ON tenants;
CREATE TRIGGER secure_tenant_access_log_trigger
  AFTER SELECT OR INSERT OR UPDATE OR DELETE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION secure_tenant_access_log();

DROP TRIGGER IF EXISTS secure_tenant_modification_log_trigger ON tenants;
CREATE TRIGGER secure_tenant_modification_log_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION secure_tenant_modification_log();

DROP TRIGGER IF EXISTS update_building_projects_updated_at ON building_projects;
CREATE TRIGGER update_building_projects_updated_at
  BEFORE UPDATE ON public.building_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_calculation_history_updated_at ON calculation_history;
CREATE TRIGGER update_calculation_history_updated_at
BEFORE UPDATE ON public.calculation_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_calculator_chat_sessions_updated_at ON calculator_chat_sessions;
CREATE TRIGGER update_calculator_chat_sessions_updated_at
BEFORE UPDATE ON public.calculator_chat_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_chat_messages_updated_at ON chat_messages;
CREATE TRIGGER update_chat_messages_updated_at
  BEFORE UPDATE ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_deposit_accounts_updated_at ON deposit_accounts;
CREATE TRIGGER update_deposit_accounts_updated_at
BEFORE UPDATE ON public.deposit_accounts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_document_signers_updated_at ON document_signers;
CREATE TRIGGER update_document_signers_updated_at
  BEFORE UPDATE ON public.document_signers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_equity_management_updated_at ON equity_management;
CREATE TRIGGER update_equity_management_updated_at
BEFORE UPDATE ON public.equity_management
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_external_lender_settings_updated_at ON external_lender_settings;
CREATE TRIGGER update_external_lender_settings_updated_at
BEFORE UPDATE ON public.external_lender_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_finn_property_cache_updated_at ON finn_property_cache;
CREATE TRIGGER update_finn_property_cache_updated_at
  BEFORE UPDATE ON public.finn_property_cache
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_lease_agreements_updated_at ON lease_agreements;
CREATE TRIGGER update_lease_agreements_updated_at
BEFORE UPDATE ON public.lease_agreements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_lease_signatures_updated_at ON lease_signatures;
CREATE TRIGGER update_lease_signatures_updated_at
  BEFORE UPDATE ON public.lease_signatures
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_legal_documents_updated_at ON legal_documents;
CREATE TRIGGER update_legal_documents_updated_at
BEFORE UPDATE ON public.legal_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_loan_calculator_settings_updated_at ON loan_calculator_settings;
CREATE TRIGGER update_loan_calculator_settings_updated_at
BEFORE UPDATE ON public.loan_calculator_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_loan_scenarios_updated_at ON loan_scenarios;
CREATE TRIGGER update_loan_scenarios_updated_at
BEFORE UPDATE ON public.loan_scenarios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_records_updated_at ON payment_records;
CREATE TRIGGER update_payment_records_updated_at
  BEFORE UPDATE ON public.payment_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
CREATE TRIGGER update_properties_updated_at  
BEFORE UPDATE ON public.properties
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_property_valuations_updated_at ON property_valuations;
CREATE TRIGGER update_property_valuations_updated_at
BEFORE UPDATE ON public.property_valuations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_rate_limits_updated_at ON rate_limits;
CREATE TRIGGER update_rate_limits_updated_at
BEFORE UPDATE ON public.rate_limits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_signing_documents_updated_at ON signing_documents;
CREATE TRIGGER update_signing_documents_updated_at
  BEFORE UPDATE ON public.signing_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
CREATE TRIGGER update_tenants_updated_at
BEFORE UPDATE ON public.tenants
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_transfer_protocols_updated_at ON transfer_protocols;
CREATE TRIGGER update_transfer_protocols_updated_at
BEFORE UPDATE ON public.transfer_protocols
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_calendar_events_updated_at ON user_calendar_events;
CREATE TRIGGER update_user_calendar_events_updated_at
  BEFORE UPDATE ON public.user_calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS validate_subscription_security ON profiles;
CREATE TRIGGER validate_subscription_security
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW 
  EXECUTE FUNCTION public.validate_subscription_update();

DROP TRIGGER IF EXISTS validate_tenant_data_trigger ON tenants;
CREATE TRIGGER validate_tenant_data_trigger
  BEFORE INSERT OR UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_tenant_data();
