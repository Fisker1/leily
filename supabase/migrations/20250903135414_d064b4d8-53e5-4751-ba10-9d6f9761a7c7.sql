-- Complete schema migration for staging environment
-- This includes all tables, RLS policies, and functions

-- Create custom types
CREATE TYPE app_role AS ENUM ('user', 'admin');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free'::text,
  subscription_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create properties table
CREATE TABLE public.properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  address TEXT NOT NULL,
  postal_code TEXT,
  city TEXT,
  property_type TEXT,
  size_sqm INTEGER,
  bedrooms INTEGER,
  purchase_price NUMERIC,
  purchase_date DATE,
  loan_amount NUMERIC,
  interest_rate NUMERIC,
  loan_duration_years INTEGER,
  current_value NUMERIC,
  last_valuation_date DATE,
  primary_residence BOOLEAN DEFAULT false,
  monthly_rent NUMERIC,
  show_in_rental BOOLEAN DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tenants table  
CREATE TABLE public.tenants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_owner_id UUID NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  national_id TEXT,
  monthly_income NUMERIC,
  occupation TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lease_agreements table
CREATE TABLE public.lease_agreements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  property_owner_id UUID NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  monthly_rent NUMERIC NOT NULL,
  deposit_amount NUMERIC,
  lease_terms TEXT,
  utilities_included BOOLEAN DEFAULT false,
  parking_included BOOLEAN DEFAULT false,
  pets_allowed BOOLEAN DEFAULT false,
  smoking_allowed BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active'::text,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create deposit_accounts table
CREATE TABLE public.deposit_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lease_id UUID NOT NULL,
  property_owner_id UUID NOT NULL,
  bank_name TEXT,
  account_number TEXT,
  deposit_amount NUMERIC NOT NULL,
  interest_rate NUMERIC,
  status TEXT DEFAULT 'active'::text,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transfer_protocols table
CREATE TABLE public.transfer_protocols (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lease_id UUID NOT NULL,
  property_owner_id UUID NOT NULL,
  protocol_type TEXT NOT NULL,
  protocol_date DATE NOT NULL,
  condition_notes TEXT,
  damages TEXT,
  repairs_needed TEXT,
  photos_urls TEXT[],
  signatures_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create property_documents table
CREATE TABLE public.property_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL,
  uploaded_by UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  description TEXT,
  document_category TEXT DEFAULT 'other'::text,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create property_valuations table
CREATE TABLE public.property_valuations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL,
  valuation_amount NUMERIC NOT NULL,
  valuation_type TEXT NOT NULL DEFAULT 'manual'::text,
  valuation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  source TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payment_records table
CREATE TABLE public.payment_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  analysis_id UUID,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'NOK'::text,
  payment_type TEXT NOT NULL,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending'::text,
  vipps_order_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reports table
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  payment_record_id UUID,
  report_type TEXT NOT NULL DEFAULT 'bank_report'::text,
  property_data JSONB NOT NULL,
  calculations JSONB NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'user'::app_role,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lease_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_valuations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create helper function for role checking
CREATE OR REPLACE FUNCTION public.has_role(user_id UUID, check_role app_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = has_role.user_id 
    AND user_roles.role = check_role
  );
END;
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for properties
CREATE POLICY "Users can view own properties" ON public.properties
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can manage own properties" ON public.properties
  FOR ALL USING (auth.uid() = owner_id);

-- RLS Policies for tenants
CREATE POLICY "Users can view own tenants" ON public.tenants
  FOR SELECT USING (auth.uid() = property_owner_id);

CREATE POLICY "Users can manage own tenants" ON public.tenants
  FOR ALL USING (auth.uid() = property_owner_id);

-- RLS Policies for lease_agreements
CREATE POLICY "Users can view own lease agreements" ON public.lease_agreements
  FOR SELECT USING (auth.uid() = property_owner_id);

CREATE POLICY "Users can manage own lease agreements" ON public.lease_agreements
  FOR ALL USING (auth.uid() = property_owner_id);

-- RLS Policies for deposit_accounts
CREATE POLICY "Users can view own deposit accounts" ON public.deposit_accounts
  FOR SELECT USING (auth.uid() = property_owner_id);

CREATE POLICY "Users can manage own deposit accounts" ON public.deposit_accounts
  FOR ALL USING (auth.uid() = property_owner_id);

-- RLS Policies for transfer_protocols
CREATE POLICY "Users can view own transfer protocols" ON public.transfer_protocols
  FOR SELECT USING (auth.uid() = property_owner_id);

CREATE POLICY "Users can manage own transfer protocols" ON public.transfer_protocols
  FOR ALL USING (auth.uid() = property_owner_id);

-- RLS Policies for property_documents
CREATE POLICY "Users can view their property documents" ON public.property_documents
  FOR SELECT USING (property_id IN (
    SELECT properties.id FROM properties WHERE properties.owner_id = auth.uid()
  ));

CREATE POLICY "Users can upload their property documents" ON public.property_documents
  FOR INSERT WITH CHECK (
    property_id IN (SELECT properties.id FROM properties WHERE properties.owner_id = auth.uid()) 
    AND uploaded_by = auth.uid()
  );

CREATE POLICY "Users can update their property documents" ON public.property_documents
  FOR UPDATE USING (property_id IN (
    SELECT properties.id FROM properties WHERE properties.owner_id = auth.uid()
  ));

CREATE POLICY "Users can delete their property documents" ON public.property_documents
  FOR DELETE USING (property_id IN (
    SELECT properties.id FROM properties WHERE properties.owner_id = auth.uid()
  ));

-- RLS Policies for property_valuations
CREATE POLICY "Users can view their property valuations" ON public.property_valuations
  FOR SELECT USING (property_id IN (
    SELECT properties.id FROM properties WHERE properties.owner_id = auth.uid()
  ));

CREATE POLICY "Users can insert their property valuations" ON public.property_valuations
  FOR INSERT WITH CHECK (property_id IN (
    SELECT properties.id FROM properties WHERE properties.owner_id = auth.uid()
  ));

CREATE POLICY "Users can update their property valuations" ON public.property_valuations
  FOR UPDATE USING (property_id IN (
    SELECT properties.id FROM properties WHERE properties.owner_id = auth.uid()
  ));

CREATE POLICY "Users can delete their property valuations" ON public.property_valuations
  FOR DELETE USING (property_id IN (
    SELECT properties.id FROM properties WHERE properties.owner_id = auth.uid()
  ));

-- RLS Policies for payment_records
CREATE POLICY "Users can view own payment records" ON public.payment_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment records" ON public.payment_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for reports
CREATE POLICY "Users can view their own reports" ON public.reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all reports" ON public.reports
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all reports" ON public.reports
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lease_agreements_updated_at
  BEFORE UPDATE ON public.lease_agreements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deposit_accounts_updated_at
  BEFORE UPDATE ON public.deposit_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transfer_protocols_updated_at
  BEFORE UPDATE ON public.transfer_protocols
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_property_valuations_updated_at
  BEFORE UPDATE ON public.property_valuations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_records_updated_at
  BEFORE UPDATE ON public.payment_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();