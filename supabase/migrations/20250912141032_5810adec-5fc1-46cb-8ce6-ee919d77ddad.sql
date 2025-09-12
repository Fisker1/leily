-- Add RLS policies and security functions for all tables

-- Create security functions first
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

-- Create trigger functions
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

-- Add RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles" ON public.user_roles
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS Policies for properties
CREATE POLICY "Users can manage own properties" ON public.properties
FOR ALL USING (auth.uid() = owner_id);

-- Add RLS Policies for tenants
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

-- Add RLS Policies for lease_agreements
CREATE POLICY "Users can manage own lease agreements" ON public.lease_agreements
FOR ALL USING (auth.uid() = property_owner_id);

-- Add RLS Policies for deposit_accounts  
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

-- Add RLS Policies for transfer_protocols
CREATE POLICY "Users can manage own transfer protocols" ON public.transfer_protocols
FOR ALL USING (auth.uid() = property_owner_id);

-- Add RLS Policies for property_valuations
CREATE POLICY "Users can manage their property valuations" ON public.property_valuations
FOR ALL USING (property_id IN (
  SELECT id FROM properties WHERE owner_id = auth.uid()
)) WITH CHECK (property_id IN (
  SELECT id FROM properties WHERE owner_id = auth.uid()
));

-- Add RLS Policies for property_documents
CREATE POLICY "Users can manage their property documents" ON public.property_documents
FOR ALL USING (property_id IN (
  SELECT id FROM properties WHERE owner_id = auth.uid()
)) WITH CHECK (
  property_id IN (SELECT id FROM properties WHERE owner_id = auth.uid()) AND 
  uploaded_by = auth.uid()
);

-- Add triggers for updated_at timestamps
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