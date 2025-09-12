-- Fortsett med resten av tabellene

-- Calculation history tabell
CREATE TABLE IF NOT EXISTS public.calculation_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  calculation_data jsonb NOT NULL,
  results_data jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  calculation_name text,
  finn_code text,
  property_address text,
  CONSTRAINT calculation_history_pkey PRIMARY KEY (id)
);

-- Tenants tabell (med kryptering)
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

-- Lease agreements tabell
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

-- Enable RLS for nye tabeller
ALTER TABLE public.calculation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lease_agreements ENABLE ROW LEVEL SECURITY;