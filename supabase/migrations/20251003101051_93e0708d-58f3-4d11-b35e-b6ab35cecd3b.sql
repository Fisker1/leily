-- Add default loan settings to equity_management table
ALTER TABLE public.equity_management
ADD COLUMN default_interest_rate NUMERIC DEFAULT 4.5,
ADD COLUMN default_loan_period_years INTEGER DEFAULT 30,
ADD COLUMN default_equity_percentage NUMERIC DEFAULT 20;

-- Add comment to explain the columns
COMMENT ON COLUMN public.equity_management.default_interest_rate IS 'Default interest rate (%) to use when calculating loans';
COMMENT ON COLUMN public.equity_management.default_loan_period_years IS 'Default loan period in years';
COMMENT ON COLUMN public.equity_management.default_equity_percentage IS 'Default equity percentage of property value';