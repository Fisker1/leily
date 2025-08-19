-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
  subscription_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create properties table for rental management
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  postal_code TEXT,
  city TEXT,
  property_type TEXT CHECK (property_type IN ('apartment', 'house', 'room', 'commercial')),
  size_sqm INTEGER,
  bedrooms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create tenants table
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  national_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create lease agreements table
CREATE TABLE public.lease_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_rent DECIMAL(10,2) NOT NULL,
  deposit_amount DECIMAL(10,2),
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'terminated')),
  lease_terms TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create transfer protocols table (overtakelsesprotokoll)
CREATE TABLE public.transfer_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID NOT NULL REFERENCES public.lease_agreements(id) ON DELETE CASCADE,
  property_owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  protocol_type TEXT NOT NULL CHECK (protocol_type IN ('move_in', 'move_out')),
  protocol_date DATE NOT NULL,
  condition_notes TEXT,
  damages TEXT,
  repairs_needed TEXT,
  photos_urls TEXT[],
  signatures_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create deposit accounts table
CREATE TABLE public.deposit_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID NOT NULL REFERENCES public.lease_agreements(id) ON DELETE CASCADE,
  property_owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_name TEXT,
  account_number TEXT,
  deposit_amount DECIMAL(10,2) NOT NULL,
  interest_rate DECIMAL(5,4),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'released', 'disputed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create payment records table for analysis exports
CREATE TABLE public.payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('analysis_export', 'pro_subscription')),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'NOK',
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  vipps_order_id TEXT,
  analysis_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lease_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for properties
CREATE POLICY "Users can view own properties" ON public.properties
  FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can manage own properties" ON public.properties
  FOR ALL USING (auth.uid() = owner_id);

-- Create RLS policies for tenants
CREATE POLICY "Users can view own tenants" ON public.tenants
  FOR SELECT USING (auth.uid() = property_owner_id);
CREATE POLICY "Users can manage own tenants" ON public.tenants
  FOR ALL USING (auth.uid() = property_owner_id);

-- Create RLS policies for lease agreements
CREATE POLICY "Users can view own lease agreements" ON public.lease_agreements
  FOR SELECT USING (auth.uid() = property_owner_id);
CREATE POLICY "Users can manage own lease agreements" ON public.lease_agreements
  FOR ALL USING (auth.uid() = property_owner_id);

-- Create RLS policies for transfer protocols
CREATE POLICY "Users can view own transfer protocols" ON public.transfer_protocols
  FOR SELECT USING (auth.uid() = property_owner_id);
CREATE POLICY "Users can manage own transfer protocols" ON public.transfer_protocols
  FOR ALL USING (auth.uid() = property_owner_id);

-- Create RLS policies for deposit accounts
CREATE POLICY "Users can view own deposit accounts" ON public.deposit_accounts
  FOR SELECT USING (auth.uid() = property_owner_id);
CREATE POLICY "Users can manage own deposit accounts" ON public.deposit_accounts
  FOR ALL USING (auth.uid() = property_owner_id);

-- Create RLS policies for payment records
CREATE POLICY "Users can view own payment records" ON public.payment_records
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payment records" ON public.payment_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lease_agreements_updated_at BEFORE UPDATE ON public.lease_agreements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_transfer_protocols_updated_at BEFORE UPDATE ON public.transfer_protocols FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_deposit_accounts_updated_at BEFORE UPDATE ON public.deposit_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payment_records_updated_at BEFORE UPDATE ON public.payment_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();