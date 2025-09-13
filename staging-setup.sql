-- Leily Staging Database Setup
-- Kopiér dette inn i SQL Editor for leily-staging prosjektet

-- 1. Create enums
CREATE TYPE public.app_role AS ENUM ('admin', 'ambassador', 'user');

-- 2. Create tables
CREATE TABLE public.profiles (
  id uuid NOT NULL PRIMARY KEY,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  subscription_tier text DEFAULT 'free'::text,
  subscription_end timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL DEFAULT 'user'::app_role,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

CREATE TABLE public.properties (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
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
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.tenants (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
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
  property_owner_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.lease_agreements (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  property_owner_id uuid NOT NULL,
  monthly_rent numeric NOT NULL,
  deposit_amount numeric,
  start_date date NOT NULL,
  end_date date,
  status text DEFAULT 'active'::text,
  lease_terms text,
  utilities_included boolean DEFAULT false,
  parking_included boolean DEFAULT false,
  pets_allowed boolean DEFAULT false,
  smoking_allowed boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.deposit_accounts (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id uuid NOT NULL,
  property_owner_id uuid NOT NULL,
  deposit_amount numeric NOT NULL,
  interest_rate numeric,
  status text DEFAULT 'active'::text,
  bank_name text,
  account_number text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.transfer_protocols (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
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
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.property_valuations (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL,
  valuation_amount numeric NOT NULL,
  valuation_date date NOT NULL DEFAULT CURRENT_DATE,
  valuation_type text NOT NULL DEFAULT 'manual'::text,
  source text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.property_documents (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text,
  file_size integer,
  description text,
  document_category text DEFAULT 'other'::text,
  uploaded_by uuid NOT NULL,
  uploaded_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.calculation_history (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  calculation_name text,
  finn_code text,
  property_address text,
  calculation_data jsonb NOT NULL,
  results_data jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.payment_records (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  currency text DEFAULT 'NOK'::text,
  payment_type text NOT NULL,
  payment_method text,
  payment_status text DEFAULT 'pending'::text,
  vipps_order_id text,
  analysis_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.reports (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  report_type text NOT NULL DEFAULT 'bank_report'::text,
  file_name text,
  property_data jsonb NOT NULL,
  calculations jsonb NOT NULL,
  file_size integer,
  payment_record_id uuid,
  generated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.audit_log (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  action text NOT NULL,
  user_id uuid,
  details jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.rate_limits (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  endpoint text NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  window_start timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 3. Enable Row Level Security
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
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- 4. Create security functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 5. Create RLS policies
-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- User roles policies
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Properties policies
CREATE POLICY "Users can manage own properties" ON public.properties FOR ALL USING (auth.uid() = owner_id);

-- Tenants policies
CREATE POLICY "Strict property owner tenant access only" ON public.tenants FOR ALL 
USING (auth.uid() IS NOT NULL AND property_owner_id IS NOT NULL AND auth.uid() = property_owner_id)
WITH CHECK (auth.uid() IS NOT NULL AND property_owner_id IS NOT NULL AND auth.uid() = property_owner_id);

-- Lease agreements policies
CREATE POLICY "Users can manage own lease agreements" ON public.lease_agreements FOR ALL USING (auth.uid() = property_owner_id);

-- Deposit accounts policies
CREATE POLICY "Property owners only access own deposits" ON public.deposit_accounts FOR ALL 
USING (auth.uid() IS NOT NULL AND property_owner_id IS NOT NULL AND auth.uid() = property_owner_id)
WITH CHECK (auth.uid() IS NOT NULL AND property_owner_id IS NOT NULL AND auth.uid() = property_owner_id);

-- Transfer protocols policies
CREATE POLICY "Users can manage own transfer protocols" ON public.transfer_protocols FOR ALL USING (auth.uid() = property_owner_id);

-- Property valuations policies
CREATE POLICY "Users can manage their property valuations" ON public.property_valuations FOR ALL 
USING (property_id IN (SELECT id FROM properties WHERE owner_id = auth.uid()))
WITH CHECK (property_id IN (SELECT id FROM properties WHERE owner_id = auth.uid()));

-- Property documents policies
CREATE POLICY "Users can manage their property documents" ON public.property_documents FOR ALL 
USING (property_id IN (SELECT id FROM properties WHERE owner_id = auth.uid()))
WITH CHECK (property_id IN (SELECT id FROM properties WHERE owner_id = auth.uid()) AND uploaded_by = auth.uid());

-- Calculation history policies
CREATE POLICY "Users can view their own calculations" ON public.calculation_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own calculations" ON public.calculation_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own calculations" ON public.calculation_history FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own calculations" ON public.calculation_history FOR DELETE USING (auth.uid() = user_id);

-- Payment records policies
CREATE POLICY "Users view own payment records only" ON public.payment_records FOR SELECT 
USING (auth.uid() IS NOT NULL AND user_id IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Users insert own payment records only" ON public.payment_records FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND user_id IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Users update own payment status only" ON public.payment_records FOR UPDATE 
USING (auth.uid() IS NOT NULL AND user_id IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.uid() IS NOT NULL AND user_id IS NOT NULL AND auth.uid() = user_id AND payment_status = ANY(ARRAY['completed'::text, 'failed'::text, 'cancelled'::text]));
CREATE POLICY "Users delete own failed payments only" ON public.payment_records FOR DELETE 
USING (auth.uid() IS NOT NULL AND user_id IS NOT NULL AND auth.uid() = user_id AND payment_status = ANY(ARRAY['pending'::text, 'failed'::text, 'cancelled'::text]));
CREATE POLICY "Admins can view all payment records" ON public.payment_records FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Reports policies
CREATE POLICY "Users can view their own reports" ON public.reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all reports" ON public.reports FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Audit log policies
CREATE POLICY "System can insert audit logs" ON public.audit_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view audit logs" ON public.audit_log FOR SELECT 
USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

-- Rate limits policies
CREATE POLICY "Admins can manage rate limits" ON public.rate_limits FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 6. Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lease_agreements_updated_at BEFORE UPDATE ON public.lease_agreements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_deposit_accounts_updated_at BEFORE UPDATE ON public.deposit_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_transfer_protocols_updated_at BEFORE UPDATE ON public.transfer_protocols FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_property_valuations_updated_at BEFORE UPDATE ON public.property_valuations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_calculation_history_updated_at BEFORE UPDATE ON public.calculation_history FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payment_records_updated_at BEFORE UPDATE ON public.payment_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rate_limits_updated_at BEFORE UPDATE ON public.rate_limits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Create user profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Create default role assignment trigger
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS TRIGGER 
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

CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_default_role();

-- Ferdig! Staging-databasen har nå samme schema som produksjon.