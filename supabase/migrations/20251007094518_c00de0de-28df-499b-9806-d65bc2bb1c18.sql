-- Create loan calculator settings table
CREATE TABLE public.loan_calculator_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_price NUMERIC DEFAULT 0,
  interest_rate NUMERIC DEFAULT 4.99,
  loan_period INTEGER DEFAULT 30,
  desired_loan_amount NUMERIC DEFAULT 0,
  equity_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.loan_calculator_settings ENABLE ROW LEVEL SECURITY;

-- Users can view their own settings
CREATE POLICY "Users can view their own loan calculator settings" 
ON public.loan_calculator_settings 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own settings
CREATE POLICY "Users can create their own loan calculator settings" 
ON public.loan_calculator_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own settings
CREATE POLICY "Users can update their own loan calculator settings" 
ON public.loan_calculator_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own settings
CREATE POLICY "Users can delete their own loan calculator settings" 
ON public.loan_calculator_settings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_loan_calculator_settings_updated_at
BEFORE UPDATE ON public.loan_calculator_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();