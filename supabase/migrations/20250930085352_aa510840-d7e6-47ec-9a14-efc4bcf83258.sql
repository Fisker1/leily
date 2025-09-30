-- Oppdater eksisterende brukere
UPDATE profiles 
SET credits = 100, subscription_tier = 'premium' 
WHERE email = 'anderslundoy@protonmail.com';

UPDATE profiles 
SET credits = 5, subscription_tier = 'free' 
WHERE email = 'anderslundoy@gmail.com';

-- Legg til roller
INSERT INTO user_roles (user_id, role)
VALUES 
  ('184b4dd3-992d-4208-8ae1-ed86a1e52a19', 'admin'),
  ('184b4dd3-992d-4208-8ae1-ed86a1e52a19', 'ambassador'),
  ('93fc5322-fe85-441d-b711-66eca054fa58', 'user')
ON CONFLICT (user_id, role) DO NOTHING;

-- Legg til eiendommer
INSERT INTO properties (owner_id, address, postal_code, city, property_type, size_sqm, bedrooms, purchase_price, purchase_date, loan_amount, interest_rate, current_value, monthly_rent, show_in_rental, coordinates)
VALUES
  ('184b4dd3-992d-4208-8ae1-ed86a1e52a19', 'Storgata 15', '0184', 'Oslo', 'Leilighet', 85, 3, 4500000, '2022-01-15', 3600000, 4.5, 4800000, 18000, true, ARRAY[10.7522, 59.9139]),
  ('184b4dd3-992d-4208-8ae1-ed86a1e52a19', 'Bygdøy Allé 22', '0262', 'Oslo', 'Leilighet', 120, 4, 7200000, '2021-06-10', 5000000, 4.2, 7800000, 25000, true, ARRAY[10.7091, 59.9128]),
  ('93fc5322-fe85-441d-b711-66eca054fa58', 'Tøyenbekken 5', '0188', 'Oslo', 'Leilighet', 65, 2, 3200000, '2023-03-20', 2500000, 5.0, 3400000, 14000, true, ARRAY[10.7667, 59.9186])
RETURNING id;