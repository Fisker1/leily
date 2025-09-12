-- Opprett RLS policies for alle tabeller

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles policies (sikkerhetsfunksjon først)
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

CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles" ON public.user_roles
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Properties policies
CREATE POLICY "Users can manage own properties" ON public.properties
FOR ALL USING (auth.uid() = owner_id);

-- Calculation history policies
CREATE POLICY "Users can view their own calculations" ON public.calculation_history
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own calculations" ON public.calculation_history
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calculations" ON public.calculation_history
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calculations" ON public.calculation_history
FOR DELETE USING (auth.uid() = user_id);

-- Tenants policies (strict eier-tilgang)
CREATE POLICY "Strict property owner tenant access only" ON public.tenants
FOR ALL USING (auth.uid() = property_owner_id)
WITH CHECK (auth.uid() = property_owner_id);

-- Lease agreements policies
CREATE POLICY "Users can manage own lease agreements" ON public.lease_agreements
FOR ALL USING (auth.uid() = property_owner_id);