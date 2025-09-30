-- Legg til leietakere
INSERT INTO tenants (property_owner_id, first_name, last_name, email, phone, national_id, address, occupation, monthly_income)
VALUES
  ('184b4dd3-992d-4208-8ae1-ed86a1e52a19', 'Kari', 'Nordmann', 'kari.nordmann@example.com', '+4741234567', '12345678901', 'Storgata 15, 0184 Oslo', 'Sykepleier', 520000),
  ('184b4dd3-992d-4208-8ae1-ed86a1e52a19', 'Ola', 'Hansen', 'ola.hansen@example.com', '+4798765432', '98765432109', 'Bygdøy Allé 22, 0262 Oslo', 'Ingeniør', 680000),
  ('93fc5322-fe85-441d-b711-66eca054fa58', 'Emma', 'Olsen', 'emma.olsen@example.com', '+4755512345', '55512345678', 'Tøyenbekken 5, 0188 Oslo', 'Student', 180000)
RETURNING id, property_owner_id, first_name;

-- Legg til leiekontrakter (må få tenant IDs først)
WITH tenant_ids AS (
  SELECT id, first_name FROM tenants ORDER BY created_at DESC LIMIT 3
),
property_ids AS (
  SELECT id, owner_id, address FROM properties ORDER BY created_at DESC LIMIT 3
)
INSERT INTO lease_agreements (property_id, tenant_id, property_owner_id, monthly_rent, deposit_amount, start_date, end_date, utilities_included, parking_included, pets_allowed, status)
SELECT 
  p.id,
  t.id,
  p.owner_id,
  CASE 
    WHEN p.address LIKE '%Storgata%' THEN 18000
    WHEN p.address LIKE '%Bygdøy%' THEN 25000
    ELSE 14000
  END,
  CASE 
    WHEN p.address LIKE '%Storgata%' THEN 54000
    WHEN p.address LIKE '%Bygdøy%' THEN 75000
    ELSE 42000
  END,
  CASE 
    WHEN p.address LIKE '%Storgata%' THEN '2024-01-01'::date
    WHEN p.address LIKE '%Bygdøy%' THEN '2023-08-01'::date
    ELSE '2024-09-01'::date
  END,
  CASE 
    WHEN p.address LIKE '%Storgata%' THEN '2025-12-31'::date
    WHEN p.address LIKE '%Bygdøy%' THEN '2025-07-31'::date
    ELSE '2025-08-31'::date
  END,
  CASE WHEN p.address LIKE '%Bygdøy%' THEN false ELSE true END,
  CASE WHEN p.address LIKE '%Bygdøy%' THEN true ELSE false END,
  CASE WHEN p.address LIKE '%Tøyen%' THEN true ELSE false END,
  'active'
FROM property_ids p
CROSS JOIN LATERAL (
  SELECT t.id FROM tenant_ids t 
  WHERE (p.address LIKE '%Storgata%' AND t.first_name = 'Kari')
     OR (p.address LIKE '%Bygdøy%' AND t.first_name = 'Ola')
     OR (p.address LIKE '%Tøyen%' AND t.first_name = 'Emma')
) t
RETURNING id;