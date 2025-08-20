-- Add purchase and financial details to properties table
ALTER TABLE public.properties 
ADD COLUMN purchase_price NUMERIC,
ADD COLUMN purchase_date DATE,
ADD COLUMN loan_amount NUMERIC,
ADD COLUMN interest_rate NUMERIC,
ADD COLUMN loan_duration_years INTEGER,
ADD COLUMN current_value NUMERIC,
ADD COLUMN last_valuation_date DATE;