-- Setup complete database structure for staging and prepare data migration
-- This will create all tables, policies, functions, triggers, and types from production

-- 1. Create custom types first
CREATE TYPE public.app_role AS ENUM ('admin', 'ambassador', 'user');

-- 2. Create profiles table (must be first due to foreign key dependencies)
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

-- 3. Create user_roles table  
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    role app_role NOT NULL DEFAULT 'user'::app_role,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT user_roles_pkey PRIMARY KEY (id),
    CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role)
);

-- 4. Create properties table
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

-- 5. Create remaining tables
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

CREATE TABLE IF NOT EXISTS public.audit_log (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    table_name text NOT NULL,
    action text NOT NULL,
    user_id uuid,
    details jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT audit_log_pkey PRIMARY KEY (id)
);

-- 6. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lease_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_valuations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;