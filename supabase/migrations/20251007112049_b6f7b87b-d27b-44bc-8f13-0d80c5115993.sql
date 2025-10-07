-- Create table for external lender settings
CREATE TABLE IF NOT EXISTS public.external_lender_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  has_external_lender BOOLEAN NOT NULL DEFAULT false,
  external_lender_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.external_lender_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own external lender settings" 
ON public.external_lender_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own external lender settings" 
ON public.external_lender_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own external lender settings" 
ON public.external_lender_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own external lender settings" 
ON public.external_lender_settings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_external_lender_settings_updated_at
BEFORE UPDATE ON public.external_lender_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();