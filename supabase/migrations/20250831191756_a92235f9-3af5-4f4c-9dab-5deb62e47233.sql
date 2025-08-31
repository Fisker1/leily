-- Remove national_id from profiles table since we're using auth account instead
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS national_id;

-- Drop the index as well
DROP INDEX IF EXISTS idx_profiles_national_id;