-- Legg til leiekontrakter
INSERT INTO lease_agreements (property_id, tenant_id, property_owner_id, monthly_rent, deposit_amount, start_date, end_date, utilities_included, parking_included, pets_allowed, status)
VALUES
  ('94251b88-a3a2-4673-a803-2f8b4874cd5a', '5979edfd-df02-43b8-b534-4cb6f9f9947b', '184b4dd3-992d-4208-8ae1-ed86a1e52a19', 18000, 54000, '2024-01-01', '2025-12-31', true, false, false, 'active'),
  ('d540c05c-5004-45c3-a036-3b957b4e103f', '7aa8921e-fde0-4f98-a445-3391f6a242be', '184b4dd3-992d-4208-8ae1-ed86a1e52a19', 25000, 75000, '2023-08-01', '2025-07-31', false, true, false, 'active'),
  ('f3e4ed26-78a9-44bf-a155-1f13e0fe6381', '7cefd3dc-7d1c-44dc-b180-68cbfa2d19c9', '93fc5322-fe85-441d-b711-66eca054fa58', 14000, 42000, '2024-09-01', '2025-08-31', true, false, true, 'active')
RETURNING id;