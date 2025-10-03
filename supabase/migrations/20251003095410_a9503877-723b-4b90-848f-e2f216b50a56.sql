-- Create equity management table for loan calculator
CREATE TABLE public.equity_management (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_equity NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create loan scenarios table
CREATE TABLE public.loan_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_name TEXT NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  calculation_id UUID REFERENCES public.calculation_history(id) ON DELETE SET NULL,
  
  -- Property details (if not linked to existing property)
  property_address TEXT,
  property_value NUMERIC NOT NULL,
  
  -- Loan details
  equity_allocated NUMERIC NOT NULL,
  loan_amount NUMERIC NOT NULL,
  interest_rate NUMERIC NOT NULL,
  loan_period_years INTEGER NOT NULL,
  
  -- Additional funding source if exceeding available equity
  additional_funding_source TEXT,
  additional_funding_amount NUMERIC,
  
  -- Calculated values
  monthly_payment NUMERIC,
  total_interest NUMERIC,
  loan_to_value NUMERIC,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.equity_management ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_scenarios ENABLE ROW LEVEL SECURITY;

-- RLS Policies for equity_management
CREATE POLICY "Users can manage own equity data"
ON public.equity_management
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for loan_scenarios
CREATE POLICY "Users can manage own loan scenarios"
ON public.loan_scenarios
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_equity_management_user_id ON public.equity_management(user_id);
CREATE INDEX idx_loan_scenarios_user_id ON public.loan_scenarios(user_id);
CREATE INDEX idx_loan_scenarios_property_id ON public.loan_scenarios(property_id);
CREATE INDEX idx_loan_scenarios_calculation_id ON public.loan_scenarios(calculation_id);

-- Triggers for updated_at
CREATE TRIGGER update_equity_management_updated_at
BEFORE UPDATE ON public.equity_management
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loan_scenarios_updated_at
BEFORE UPDATE ON public.loan_scenarios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate available equity
CREATE OR REPLACE FUNCTION public.get_available_equity(p_user_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_equity NUMERIC;
  allocated_equity NUMERIC;
BEGIN
  -- Get user's total equity
  SELECT em.total_equity INTO total_equity
  FROM equity_management em
  WHERE em.user_id = p_user_id;
  
  IF total_equity IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Calculate total allocated equity across all scenarios
  SELECT COALESCE(SUM(equity_allocated), 0) INTO allocated_equity
  FROM loan_scenarios
  WHERE user_id = p_user_id;
  
  -- Return available equity
  RETURN total_equity - allocated_equity;
END;
$$;