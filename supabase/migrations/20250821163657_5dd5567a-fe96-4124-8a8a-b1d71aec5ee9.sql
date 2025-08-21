-- Remove the existing property_type constraint and add a new one that includes Tomannsbolig
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_property_type_check;

-- Add new constraint with the correct property types including Tomannsbolig
ALTER TABLE properties 
ADD CONSTRAINT properties_property_type_check 
CHECK (property_type IN ('Leilighet', 'Enebolig', 'Rekkehus', 'Tomannsbolig', 'Hytte'));

-- Now insert the property with the correct type
INSERT INTO properties (
  address, 
  city, 
  postal_code, 
  property_type, 
  size_sqm, 
  bedrooms, 
  purchase_price, 
  purchase_date, 
  loan_amount, 
  interest_rate, 
  loan_duration_years, 
  current_value, 
  owner_id
) VALUES (
  'Karlsminnegatn76',
  'Stavanger', 
  '4014',
  'Tomannsbolig',
  76,
  2,
  3070000,
  '2024-12-20',
  3000000,
  5.4,
  30,
  3500000,
  '5d6a457d-4420-4ad2-8e87-e2a94a5e2f99'
);