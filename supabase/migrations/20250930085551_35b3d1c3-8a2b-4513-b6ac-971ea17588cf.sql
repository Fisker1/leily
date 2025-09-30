-- Legg til chat meldinger
INSERT INTO chat_messages (lease_id, sender_id, sender_type, message_content)
SELECT 
  id,
  property_owner_id,
  'landlord',
  'Hei! Velkommen som leietaker. Ta gjerne kontakt hvis du har spørsmål.'
FROM (SELECT id, property_owner_id FROM lease_agreements ORDER BY created_at DESC LIMIT 3) as leases
UNION ALL
SELECT 
  id,
  property_owner_id,
  'landlord',
  'Husleien forfaller den 1. hver måned. Husk å betale i tide!'
FROM (SELECT id, property_owner_id FROM lease_agreements ORDER BY created_at DESC LIMIT 3) as leases2;

-- Legg til calculation history
INSERT INTO calculation_history (user_id, calculation_name, property_address, finn_code, coordinates, calculation_data, results_data)
VALUES
  ('184b4dd3-992d-4208-8ae1-ed86a1e52a19', 'Oslo sentrum analyse', 'Storgata 15, 0184 Oslo', '123456789', ARRAY[10.7522, 59.9139], 
   '{"purchasePrice": 4500000, "loanAmount": 3600000, "interestRate": 4.5, "monthlyRent": 18000}'::jsonb,
   '{"monthlyPayment": 18270, "totalCost": 878640, "roi": 4.2, "breakEven": 248}'::jsonb),
  ('184b4dd3-992d-4208-8ae1-ed86a1e52a19', 'Bygdøy luksus', 'Bygdøy Allé 22, 0262 Oslo', '987654321', ARRAY[10.7091, 59.9128],
   '{"purchasePrice": 7200000, "loanAmount": 5000000, "interestRate": 4.2, "monthlyRent": 25000}'::jsonb,
   '{"monthlyPayment": 21350, "totalCost": 1024800, "roi": 5.8, "breakEven": 172}'::jsonb),
  ('93fc5322-fe85-441d-b711-66eca054fa58', 'Tøyen student', 'Tøyenbekken 5, 0188 Oslo', '555123456', ARRAY[10.7667, 59.9186],
   '{"purchasePrice": 3200000, "loanAmount": 2500000, "interestRate": 5.0, "monthlyRent": 14000}'::jsonb,
   '{"monthlyPayment": 13438, "totalCost": 645024, "roi": 5.2, "breakEven": 193}'::jsonb);