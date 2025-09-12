-- Add admin policy for profiles table to allow admin dashboard to work
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Also add admin policy for payment_records table for complete admin access
CREATE POLICY "Admins can view all payment records" ON public.payment_records
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));