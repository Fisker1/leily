-- Add monthly_rent column to properties table
ALTER TABLE public.properties 
ADD COLUMN monthly_rent numeric;