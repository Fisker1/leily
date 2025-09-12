-- Create calculation_history table for storing property calculations
CREATE TABLE public.calculation_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  calculation_name text,
  finn_code text,
  property_address text,
  calculation_data jsonb NOT NULL,
  results_data jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.calculation_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own calculations" 
ON public.calculation_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own calculations" 
ON public.calculation_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calculations" 
ON public.calculation_history 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calculations" 
ON public.calculation_history 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_calculation_history_updated_at
BEFORE UPDATE ON public.calculation_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_calculation_history_user_id ON public.calculation_history(user_id);
CREATE INDEX idx_calculation_history_created_at ON public.calculation_history(created_at DESC);