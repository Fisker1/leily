-- Legg til leietakere
INSERT INTO tenants (property_owner_id, first_name, last_name, email, phone, national_id, address, occupation, monthly_income)
VALUES
  ('184b4dd3-992d-4208-8ae1-ed86a1e52a19', 'Kari', 'Nordmann', 'kari.nordmann@example.com', '+4741234567', '12345678901', 'Storgata 15, 0184 Oslo', 'Sykepleier', 520000),
  ('184b4dd3-992d-4208-8ae1-ed86a1e52a19', 'Ola', 'Hansen', 'ola.hansen@example.com', '+4798765432', '98765432109', 'Bygdøy Allé 22, 0262 Oslo', 'Ingeniør', 680000),
  ('93fc5322-fe85-441d-b711-66eca054fa58', 'Emma', 'Olsen', 'emma.olsen@example.com', '+4755512345', '55512345678', 'Tøyenbekken 5, 0188 Oslo', 'Student', 180000)
RETURNING id;