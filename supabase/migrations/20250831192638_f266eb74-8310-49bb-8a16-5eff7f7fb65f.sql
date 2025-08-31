-- Add missing columns to tenants table
ALTER TABLE public.tenants 
ADD COLUMN address text,
ADD COLUMN occupation text,
ADD COLUMN monthly_income numeric,
ADD COLUMN emergency_contact text,
ADD COLUMN emergency_phone text;

-- Add missing columns to lease_agreements table  
ALTER TABLE public.lease_agreements
ADD COLUMN utilities_included boolean DEFAULT false,
ADD COLUMN parking_included boolean DEFAULT false,
ADD COLUMN pets_allowed boolean DEFAULT false,
ADD COLUMN smoking_allowed boolean DEFAULT false;