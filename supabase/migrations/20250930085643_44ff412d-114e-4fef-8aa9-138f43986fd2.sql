-- Legg til chat meldinger
WITH recent_leases AS (
  SELECT id, property_owner_id FROM lease_agreements ORDER BY created_at DESC LIMIT 3
)
INSERT INTO chat_messages (lease_id, sender_id, sender_type, message_content)
SELECT 
  id,
  property_owner_id,
  'landlord',
  'Hei! Velkommen som leietaker. Kontakt meg hvis du har spørsmål.'
FROM recent_leases;

-- Legg til calculation history for premium bruker
INSERT INTO calculation_history (user_id, calculation_name, property_address, finn_code, coordinates, calculation_data, results_data)
VALUES
  ('184b4dd3-992d-4208-8ae1-ed86a1e52a19', 'Storgata 15 analyse', 'Storgata 15, 0184 Oslo', '123456789', ARRAY[10.7522, 59.9139], 
   '{"purchasePrice": 4500000, "loanAmount": 3600000, "interestRate": 4.5, "sizeSqm": 85}'::jsonb,
   '{"monthlyPayment": 18270, "totalYearlyCost": 878640, "roi": 4.2, "rentYield": 4.8}'::jsonb),
  ('184b4dd3-992d-4208-8ae1-ed86a1e52a19', 'Bygdøy Allé 22 analyse', 'Bygdøy Allé 22, 0262 Oslo', '987654321', ARRAY[10.7091, 59.9128],
   '{"purchasePrice": 7200000, "loanAmount": 5000000, "interestRate": 4.2, "sizeSqm": 120}'::jsonb,
   '{"monthlyPayment": 21350, "totalYearlyCost": 1024800, "roi": 5.8, "rentYield": 4.2}'::jsonb),
  ('93fc5322-fe85-441d-b711-66eca054fa58', 'Tøyenbekken 5 analyse', 'Tøyenbekken 5, 0188 Oslo', '456789123', ARRAY[10.7667, 59.9186],
   '{"purchasePrice": 3200000, "loanAmount": 2500000, "interestRate": 5.0, "sizeSqm": 65}'::jsonb,
   '{"monthlyPayment": 14580, "totalYearlyCost": 699840, "roi": 3.2, "rentYield": 5.25}'::jsonb);