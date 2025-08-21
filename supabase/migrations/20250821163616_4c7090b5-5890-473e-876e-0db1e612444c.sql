-- Insert property with corrected property type
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
  'Rekkehus',
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