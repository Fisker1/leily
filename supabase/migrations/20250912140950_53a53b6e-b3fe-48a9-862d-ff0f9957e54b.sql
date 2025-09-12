-- Setup missing tables in staging database
-- Skip app_role type as it already exists

-- Create profiles table (check if exists first)
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

-- Create user_roles table (check if exists first)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    role app_role NOT NULL DEFAULT 'user'::app_role,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT user_roles_pkey PRIMARY KEY (id),
    CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role)
);

-- Create properties table
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

-- Create tenants table  
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

-- Create lease_agreements table
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

-- Create deposit_accounts table
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

-- Create transfer_protocols table
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

-- Create property_valuations table
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

-- Create property_documents table
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

-- Enable RLS on new tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lease_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_valuations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_documents ENABLE ROW LEVEL SECURITY;