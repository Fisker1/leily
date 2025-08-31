-- Add national_id to profiles table to link users by their national ID
ALTER TABLE public.profiles 
ADD COLUMN national_id text UNIQUE;

-- Add index for better performance on national_id lookups
CREATE INDEX idx_profiles_national_id ON public.profiles(national_id);