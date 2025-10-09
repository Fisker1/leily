-- Add user_id to finn_property_cache for security (if column doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'finn_property_cache' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.finn_property_cache 
    ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    
    CREATE INDEX idx_finn_property_cache_user_id ON public.finn_property_cache(user_id);
  END IF;
END $$;

-- Drop old permissive policy
DROP POLICY IF EXISTS "Anyone can read cached property data" ON public.finn_property_cache;
DROP POLICY IF EXISTS "System can manage cache" ON public.finn_property_cache;

-- Create new restrictive policies
CREATE POLICY "Users can view their own cached properties"
ON public.finn_property_cache
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cached properties"
ON public.finn_property_cache
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can manage cache"
ON public.finn_property_cache
FOR ALL
TO service_role
USING (true);

-- Add blocking policy for draft legal documents
DROP POLICY IF EXISTS "Non-admins cannot view draft legal documents" ON public.legal_documents;

CREATE POLICY "Non-admins cannot view draft legal documents"
ON public.legal_documents
FOR SELECT
TO authenticated
USING (
  status != 'draft' OR 
  has_role(auth.uid(), 'admin'::app_role)
);