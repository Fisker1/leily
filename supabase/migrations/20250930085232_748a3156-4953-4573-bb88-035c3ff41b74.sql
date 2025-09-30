-- Oppdater eksisterende brukere med credits og roller
UPDATE profiles 
SET credits = 100, subscription_tier = 'premium' 
WHERE email = 'anderslundoy@protonmail.com';

UPDATE profiles 
SET credits = 5, subscription_tier = 'free' 
WHERE email = 'anderslundoy@gmail.com';

-- Legg til admin og ambassador roller
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
  ('93fc5322-fe85-441d-b711-66eca054fa58', 'Tøyenbekken 5', '0188', 'Oslo', 'Leilighet', 65, 2, 3200000, '2023-03-20', 2500000, 5.0, 3400000, 14000, true, ARRAY[10.7667, 59.9186]);

-- Legg til leietakere (la Supabase generere ID)
INSERT INTO tenants (property_owner_id, first_name, last_name, email, phone, national_id, address, occupation, monthly_income)
VALUES
  ('184b4dd3-992d-4208-8ae1-ed86a1e52a19', 'Kari', 'Nordmann', 'kari.nordmann@example.com', '+4741234567', '12345678901', 'Storgata 15, 0184 Oslo', 'Sykepleier', 520000),
  ('184b4dd3-992d-4208-8ae1-ed86a1e52a19', 'Ola', 'Hansen', 'ola.hansen@example.com', '+4798765432', '98765432109', 'Bygdøy Allé 22, 0262 Oslo', 'Ingeniør', 680000),
  ('93fc5322-fe85-441d-b711-66eca054fa58', 'Emma', 'Olsen', 'emma.olsen@example.com', '+4755512345', '55512345678', 'Tøyenbekken 5, 0188 Oslo', 'Student', 180000);