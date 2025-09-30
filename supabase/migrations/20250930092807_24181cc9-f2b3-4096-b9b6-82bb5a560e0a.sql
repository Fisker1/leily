-- Populate test data for all test users with diverse properties and tenants
DO $$
DECLARE
  gjest_id uuid;
  pro_id uuid;
  ambassador_id uuid;
  admin_id uuid;
  
  prop1_id uuid; prop2_id uuid; prop3_id uuid; prop4_id uuid; prop5_id uuid; prop6_id uuid;
  ten1_id uuid; ten2_id uuid; ten3_id uuid; ten4_id uuid; ten5_id uuid; ten6_id uuid;
BEGIN
  -- Get user IDs
  SELECT id INTO gjest_id FROM profiles WHERE email = 'gjest@leily.no';
  SELECT id INTO pro_id FROM profiles WHERE email = 'pro@leily.no';
  SELECT id INTO ambassador_id FROM profiles WHERE email = 'ambassador@leily.no';
  SELECT id INTO admin_id FROM profiles WHERE email = 'anderslundoy@protonmail.com';

  -- GJEST USER - Basic properties in Oslo
  INSERT INTO properties (owner_id, address, city, postal_code, property_type, size_sqm, bedrooms, purchase_price, purchase_date, loan_amount, interest_rate, current_value, monthly_rent, coordinates) VALUES
  (gjest_id, 'Tøyenbekken 5', 'Oslo', '0188', 'Leilighet', 65, 2, 3200000, '2023-03-20', 2400000, 4.5, 3400000, 14000, ARRAY[10.7692, 59.9171]) RETURNING id INTO prop1_id;
  INSERT INTO properties (owner_id, address, city, postal_code, property_type, size_sqm, bedrooms, purchase_price, purchase_date, loan_amount, interest_rate, current_value, monthly_rent, coordinates) VALUES
  (gjest_id, 'Grønland 12', 'Oslo', '0188', 'Leilighet', 45, 1, 2100000, '2022-06-15', 1800000, 4.2, 2300000, 11000, ARRAY[10.7595, 59.9127]) RETURNING id INTO prop2_id;
  INSERT INTO properties (owner_id, address, city, postal_code, property_type, size_sqm, bedrooms, purchase_price, purchase_date, loan_amount, interest_rate, current_value, monthly_rent, coordinates) VALUES
  (gjest_id, 'Fossveien 24', 'Oslo', '0551', 'Leilighet', 55, 2, 2800000, '2021-09-10', 2200000, 4.8, 3000000, 13000, ARRAY[10.7889, 59.9247]) RETURNING id INTO prop3_id;
  INSERT INTO properties (owner_id, address, city, postal_code, property_type, size_sqm, bedrooms, purchase_price, purchase_date, loan_amount, interest_rate, current_value, monthly_rent, coordinates) VALUES
  (gjest_id, 'Bentsebrugata 7', 'Oslo', '0476', 'Leilighet', 38, 1, 1900000, '2023-01-20', 1500000, 4.3, 2000000, 10000, ARRAY[10.7511, 59.9208]) RETURNING id INTO prop4_id;

  -- GJEST tenants
  INSERT INTO tenants (property_owner_id, first_name, last_name, email, phone, national_id, address, occupation, monthly_income, emergency_contact, emergency_phone) VALUES
  (gjest_id, 'Lars', 'Hansen', 'lars.hansen@email.no', '98765432', '12345678901', 'Tøyenbekken 5, 0188 Oslo', 'Student', 15000, 'Anne Hansen', '91234567') RETURNING id INTO ten1_id;
  INSERT INTO tenants (property_owner_id, first_name, last_name, email, phone, national_id, address, occupation, monthly_income, emergency_contact, emergency_phone) VALUES
  (gjest_id, 'Kari', 'Olsen', 'kari.olsen@email.no', '97654321', '23456789012', 'Grønland 12, 0188 Oslo', 'Sykepleier', 42000, 'Per Olsen', '92345678') RETURNING id INTO ten2_id;
  INSERT INTO tenants (property_owner_id, first_name, last_name, email, phone, national_id, address, occupation, monthly_income, emergency_contact, emergency_phone) VALUES
  (gjest_id, 'Mohammed', 'Ali', 'mohammed.ali@email.no', '96543210', '34567890123', 'Fossveien 24, 0551 Oslo', 'Ingeniør', 55000, 'Fatima Ali', '93456789') RETURNING id INTO ten3_id;
  INSERT INTO tenants (property_owner_id, first_name, last_name, email, phone, national_id, address, occupation, monthly_income, emergency_contact, emergency_phone) VALUES
  (gjest_id, 'Ingrid', 'Berg', 'ingrid.berg@email.no', '95432109', '45678901234', 'Bentsebrugata 7, 0476 Oslo', 'Lærer', 48000, 'Erik Berg', '94567890') RETURNING id INTO ten4_id;

  -- GJEST leases
  INSERT INTO lease_agreements (property_id, tenant_id, property_owner_id, monthly_rent, deposit_amount, start_date, end_date, utilities_included, parking_included, pets_allowed, status)
  VALUES (prop1_id, ten1_id, gjest_id, 14000, 42000, '2024-01-01', '2025-12-31', true, false, false, 'active');
  INSERT INTO lease_agreements (property_id, tenant_id, property_owner_id, monthly_rent, deposit_amount, start_date, end_date, utilities_included, parking_included, pets_allowed, status)
  VALUES (prop2_id, ten2_id, gjest_id, 11000, 33000, '2024-01-01', '2025-12-31', false, false, false, 'active');
  INSERT INTO lease_agreements (property_id, tenant_id, property_owner_id, monthly_rent, deposit_amount, start_date, end_date, utilities_included, parking_included, pets_allowed, status)
  VALUES (prop3_id, ten3_id, gjest_id, 13000, 39000, '2024-01-01', '2025-12-31', true, true, false, 'active');
  INSERT INTO lease_agreements (property_id, tenant_id, property_owner_id, monthly_rent, deposit_amount, start_date, end_date, utilities_included, parking_included, pets_allowed, status)
  VALUES (prop4_id, ten4_id, gjest_id, 10000, 30000, '2024-01-01', '2025-12-31', false, false, true, 'active');

  -- PRO USER - Mid-range properties across Norway
  INSERT INTO properties (owner_id, address, city, postal_code, property_type, size_sqm, bedrooms, purchase_price, purchase_date, loan_amount, interest_rate, current_value, monthly_rent, coordinates) VALUES
  (pro_id, 'Solheimsgaten 15', 'Bergen', '5058', 'Leilighet', 75, 3, 4200000, '2022-04-12', 3000000, 4.1, 4500000, 17000, ARRAY[5.3356, 60.3835]) RETURNING id INTO prop1_id;
  INSERT INTO properties (owner_id, address, city, postal_code, property_type, size_sqm, bedrooms, purchase_price, purchase_date, loan_amount, interest_rate, current_value, monthly_rent, coordinates) VALUES
  (pro_id, 'Olav Tryggvasons gate 28', 'Trondheim', '7011', 'Leilighet', 68, 2, 3600000, '2021-11-05', 2700000, 4.4, 3900000, 15500, ARRAY[10.3951, 63.4305]) RETURNING id INTO prop2_id;
  INSERT INTO properties (owner_id, address, city, postal_code, property_type, size_sqm, bedrooms, purchase_price, purchase_date, loan_amount, interest_rate, current_value, monthly_rent, coordinates) VALUES
  (pro_id, 'Kirkegata 45', 'Stavanger', '4006', 'Leilighet', 82, 3, 4800000, '2023-02-28', 3500000, 4.0, 5100000, 18500, ARRAY[5.7331, 58.9700]) RETURNING id INTO prop3_id;
  INSERT INTO properties (owner_id, address, city, postal_code, property_type, size_sqm, bedrooms, purchase_price, purchase_date, loan_amount, interest_rate, current_value, monthly_rent, coordinates) VALUES
  (pro_id, 'Youngstorget 2', 'Oslo', '0181', 'Leilighet', 92, 3, 5500000, '2022-08-15', 4000000, 3.9, 5900000, 21000, ARRAY[10.7467, 59.9147]) RETURNING id INTO prop4_id;
  INSERT INTO properties (owner_id, address, city, postal_code, property_type, size_sqm, bedrooms, purchase_price, purchase_date, loan_amount, interest_rate, current_value, monthly_rent, coordinates) VALUES
  (pro_id, 'Strandgata 89', 'Tromsø', '9008', 'Leilighet', 70, 2, 3800000, '2021-05-20', 2800000, 4.5, 4100000, 16000, ARRAY[18.9560, 69.6492]) RETURNING id INTO prop5_id;
  INSERT INTO properties (owner_id, address, city, postal_code, property_type, size_sqm, bedrooms, purchase_price, purchase_date, loan_amount, interest_rate, current_value, monthly_rent, coordinates) VALUES
  (pro_id, 'Nedre Slottsgate 6', 'Oslo', '0157', 'Leilighet', 105, 4, 7200000, '2023-06-10', 5000000, 3.8, 7600000, 24000, ARRAY[10.7387, 59.9139]) RETURNING id INTO prop6_id;

  -- PRO tenants
  INSERT INTO tenants (property_owner_id, first_name, last_name, email, phone, national_id, address, occupation, monthly_income, emergency_contact, emergency_phone) VALUES
  (pro_id, 'Erik', 'Johansen', 'erik.johansen@email.no', '94321098', '56789012345', 'Solheimsgaten 15, 5058 Bergen', 'IT-konsulent', 62000, 'Maria Johansen', '95678901') RETURNING id INTO ten1_id;
  INSERT INTO tenants (property_owner_id, first_name, last_name, email, phone, national_id, address, occupation, monthly_income, emergency_contact, emergency_phone) VALUES
  (pro_id, 'Nina', 'Pettersen', 'nina.pettersen@email.no', '93210987', '67890123456', 'Olav Tryggvasons gate 28, 7011 Trondheim', 'Arkitekt', 68000, 'Ole Pettersen', '96789012') RETURNING id INTO ten2_id;
  INSERT INTO tenants (property_owner_id, first_name, last_name, email, phone, national_id, address, occupation, monthly_income, emergency_contact, emergency_phone) VALUES
  (pro_id, 'Anders', 'Nilsen', 'anders.nilsen@email.no', '92109876', '78901234567', 'Kirkegata 45, 4006 Stavanger', 'Økonom', 71000, 'Solveig Nilsen', '97890123') RETURNING id INTO ten3_id;
  INSERT INTO tenants (property_owner_id, first_name, last_name, email, phone, national_id, address, occupation, monthly_income, emergency_contact, emergency_phone) VALUES
  (pro_id, 'Lise', 'Christensen', 'lise.christensen@email.no', '91098765', '89012345678', 'Youngstorget 2, 0181 Oslo', 'Journalist', 52000, 'Petter Christensen', '98901234') RETURNING id INTO ten4_id;
  INSERT INTO tenants (property_owner_id, first_name, last_name, email, phone, national_id, address, occupation, monthly_income, emergency_contact, emergency_phone) VALUES
  (pro_id, 'Bjørn', 'Andersen', 'bjorn.andersen@email.no', '90987654', '90123456789', 'Strandgata 89, 9008 Tromsø', 'Læge', 75000, 'Hilde Andersen', '99012345') RETURNING id INTO ten5_id;
  INSERT INTO tenants (property_owner_id, first_name, last_name, email, phone, national_id, address, occupation, monthly_income, emergency_contact, emergency_phone) VALUES
  (pro_id, 'Marit', 'Eriksen', 'marit.eriksen@email.no', '89876543', '01234567890', 'Nedre Slottsgate 6, 0157 Oslo', 'Advokat', 85000, 'Knut Eriksen', '90123456') RETURNING id INTO ten6_id;

  -- PRO leases
  INSERT INTO lease_agreements (property_id, tenant_id, property_owner_id, monthly_rent, deposit_amount, start_date, end_date, utilities_included, parking_included, pets_allowed, status)
  VALUES (prop1_id, ten1_id, pro_id, 17000, 51000, '2024-02-01', '2026-01-31', true, false, false, 'active');
  INSERT INTO lease_agreements (property_id, tenant_id, property_owner_id, monthly_rent, deposit_amount, start_date, end_date, utilities_included, parking_included, pets_allowed, status)
  VALUES (prop2_id, ten2_id, pro_id, 15500, 46500, '2024-02-01', '2026-01-31', false, true, false, 'active');
  INSERT INTO lease_agreements (property_id, tenant_id, property_owner_id, monthly_rent, deposit_amount, start_date, end_date, utilities_included, parking_included, pets_allowed, status)
  VALUES (prop3_id, ten3_id, pro_id, 18500, 55500, '2024-02-01', '2026-01-31', true, true, true, 'active');
  INSERT INTO lease_agreements (property_id, tenant_id, property_owner_id, monthly_rent, deposit_amount, start_date, end_date, utilities_included, parking_included, pets_allowed, status)
  VALUES (prop4_id, ten4_id, pro_id, 21000, 63000, '2024-02-01', '2026-01-31', false, false, false, 'active');
  INSERT INTO lease_agreements (property_id, tenant_id, property_owner_id, monthly_rent, deposit_amount, start_date, end_date, utilities_included, parking_included, pets_allowed, status)
  VALUES (prop5_id, ten5_id, pro_id, 16000, 48000, '2024-02-01', '2026-01-31', true, false, true, 'active');
  INSERT INTO lease_agreements (property_id, tenant_id, property_owner_id, monthly_rent, deposit_amount, start_date, end_date, utilities_included, parking_included, pets_allowed, status)
  VALUES (prop6_id, ten6_id, pro_id, 24000, 72000, '2024-02-01', '2026-01-31', true, true, false, 'active');

  -- AMBASSADOR USER - Premium properties
  INSERT INTO properties (owner_id, address, city, postal_code, property_type, size_sqm, bedrooms, purchase_price, purchase_date, loan_amount, interest_rate, current_value, monthly_rent, coordinates, primary_residence) VALUES
  (ambassador_id, 'Bygdøy Allé 65', 'Oslo', '0265', 'Leilighet', 145, 4, 12500000, '2020-03-15', 8000000, 3.5, 14000000, 35000, ARRAY[10.7065, 59.9182], true) RETURNING id INTO prop1_id;
  INSERT INTO properties (owner_id, address, city, postal_code, property_type, size_sqm, bedrooms, purchase_price, purchase_date, loan_amount, interest_rate, current_value, monthly_rent, coordinates) VALUES
  (ambassador_id, 'Holbergs gate 1', 'Bergen', '5003', 'Leilighet', 120, 3, 9800000, '2021-07-20', 6500000, 3.7, 10500000, 28000, ARRAY[5.3220, 60.3913]) RETURNING id INTO prop2_id;
  INSERT INTO properties (owner_id, address, city, postal_code, property_type, size_sqm, bedrooms, purchase_price, purchase_date, loan_amount, interest_rate, current_value, monthly_rent, coordinates) VALUES
  (ambassador_id, 'Dronningens gate 22', 'Trondheim', '7011', 'Leilighet', 135, 4, 8900000, '2022-09-12', 6000000, 3.6, 9600000, 26000, ARRAY[10.3947, 63.4299]) RETURNING id INTO prop3_id;
  INSERT INTO properties (owner_id, address, city, postal_code, property_type, size_sqm, bedrooms, purchase_price, purchase_date, loan_amount, interest_rate, current_value, monthly_rent, coordinates) VALUES
  (ambassador_id, 'Frogner Terrasse 5', 'Oslo', '0260', 'Leilighet', 165, 5, 15800000, '2019-11-30', 10000000, 3.4, 17500000, 42000, ARRAY[10.7035, 59.9212]) RETURNING id INTO prop4_id;
  INSERT INTO properties (owner_id, address, city, postal_code, property_type, size_sqm, bedrooms, purchase_price, purchase_date, loan_amount, interest_rate, current_value, monthly_rent, coordinates) VALUES
  (ambassador_id, 'Stranden 3', 'Bergen', '5004', 'Leilighet', 110, 3, 9200000, '2021-04-18', 6200000, 3.8, 9900000, 27000, ARRAY[5.3245, 60.3974]) RETURNING id INTO prop5_id;

  -- AMBASSADOR tenants
  INSERT INTO tenants (property_owner_id, first_name, last_name, email, phone, national_id, address, occupation, monthly_income, emergency_contact, emergency_phone) VALUES
  (ambassador_id, 'Kristian', 'Svendsen', 'kristian.svendsen@email.no', '88765432', '11234567890', 'Bygdøy Allé 65, 0265 Oslo', 'CEO', 120000, 'Elisabeth Svendsen', '91234568') RETURNING id INTO ten1_id;
  INSERT INTO tenants (property_owner_id, first_name, last_name, email, phone, national_id, address, occupation, monthly_income, emergency_contact, emergency_phone) VALUES
  (ambassador_id, 'Hanna', 'Larsen', 'hanna.larsen@email.no', '87654321', '22345678901', 'Holbergs gate 1, 5003 Bergen', 'Finansdirektør', 95000, 'Thomas Larsen', '92345679') RETURNING id INTO ten2_id;
  INSERT INTO tenants (property_owner_id, first_name, last_name, email, phone, national_id, address, occupation, monthly_income, emergency_contact, emergency_phone) VALUES
  (ambassador_id, 'Martin', 'Abrahamsen', 'martin.abrahamsen@email.no', '86543210', '33456789012', 'Dronningens gate 22, 7011 Trondheim', 'Partner', 110000, 'Silje Abrahamsen', '93456780') RETURNING id INTO ten3_id;
  INSERT INTO tenants (property_owner_id, first_name, last_name, email, phone, national_id, address, occupation, monthly_income, emergency_contact, emergency_phone) VALUES
  (ambassador_id, 'Sofie', 'Halvorsen', 'sofie.halvorsen@email.no', '85432109', '44567890123', 'Frogner Terrasse 5, 0260 Oslo', 'Overlæge', 105000, 'Marius Halvorsen', '94567891') RETURNING id INTO ten4_id;
  INSERT INTO tenants (property_owner_id, first_name, last_name, email, phone, national_id, address, occupation, monthly_income, emergency_contact, emergency_phone) VALUES
  (ambassador_id, 'Jonas', 'Martinsen', 'jonas.martinsen@email.no', '84321098', '55678901234', 'Stranden 3, 5004 Bergen', 'Tech Lead', 98000, 'Emma Martinsen', '95678902') RETURNING id INTO ten5_id;

  -- AMBASSADOR leases
  INSERT INTO lease_agreements (property_id, tenant_id, property_owner_id, monthly_rent, deposit_amount, start_date, end_date, utilities_included, parking_included, pets_allowed, status)
  VALUES (prop1_id, ten1_id, ambassador_id, 35000, 105000, '2023-09-01', '2025-08-31', true, true, false, 'active');
  INSERT INTO lease_agreements (property_id, tenant_id, property_owner_id, monthly_rent, deposit_amount, start_date, end_date, utilities_included, parking_included, pets_allowed, status)
  VALUES (prop2_id, ten2_id, ambassador_id, 28000, 84000, '2023-09-01', '2025-08-31', true, true, true, 'active');
  INSERT INTO lease_agreements (property_id, tenant_id, property_owner_id, monthly_rent, deposit_amount, start_date, end_date, utilities_included, parking_included, pets_allowed, status)
  VALUES (prop3_id, ten3_id, ambassador_id, 26000, 78000, '2023-09-01', '2025-08-31', true, false, false, 'active');
  INSERT INTO lease_agreements (property_id, tenant_id, property_owner_id, monthly_rent, deposit_amount, start_date, end_date, utilities_included, parking_included, pets_allowed, status)
  VALUES (prop4_id, ten4_id, ambassador_id, 42000, 126000, '2023-09-01', '2025-08-31', true, true, true, 'active');
  INSERT INTO lease_agreements (property_id, tenant_id, property_owner_id, monthly_rent, deposit_amount, start_date, end_date, utilities_included, parking_included, pets_allowed, status)
  VALUES (prop5_id, ten5_id, ambassador_id, 27000, 81000, '2023-09-01', '2025-08-31', true, true, false, 'active');

  -- ADMIN USER - Diverse portfolio
  INSERT INTO properties (owner_id, address, city, postal_code, property_type, size_sqm, bedrooms, purchase_price, purchase_date, loan_amount, interest_rate, current_value, monthly_rent, coordinates) VALUES
  (admin_id, 'Thereses gate 55', 'Oslo', '0354', 'Leilighet', 88, 3, 5800000, '2022-01-15', 4200000, 4.0, 6300000, 22000, ARRAY[10.7389, 59.9274]) RETURNING id INTO prop1_id;
  INSERT INTO properties (owner_id, address, city, postal_code, property_type, size_sqm, bedrooms, purchase_price, purchase_date, loan_amount, interest_rate, current_value, monthly_rent, coordinates) VALUES
  (admin_id, 'Kaigata 7', 'Bergen', '5015', 'Leilighet', 72, 2, 4400000, '2021-10-22', 3200000, 4.2, 4700000, 18000, ARRAY[5.3308, 60.3951]) RETURNING id INTO prop2_id;
  INSERT INTO properties (owner_id, address, city, postal_code, property_type, size_sqm, bedrooms, purchase_price, purchase_date, loan_amount, interest_rate, current_value, monthly_rent, coordinates) VALUES
  (admin_id, 'Kongens gate 8', 'Trondheim', '7013', 'Leilighet', 95, 3, 6200000, '2023-03-05', 4500000, 3.9, 6600000, 23000, ARRAY[10.3970, 63.4297]) RETURNING id INTO prop3_id;
  INSERT INTO properties (owner_id, address, city, postal_code, property_type, size_sqm, bedrooms, purchase_price, purchase_date, loan_amount, interest_rate, current_value, monthly_rent, coordinates) VALUES
  (admin_id, 'Valbergtårnet 12', 'Stavanger', '4008', 'Leilighet', 102, 3, 6800000, '2022-07-18', 4800000, 4.1, 7300000, 24500, ARRAY[5.7308, 58.9699]) RETURNING id INTO prop4_id;
  INSERT INTO properties (owner_id, address, city, postal_code, property_type, size_sqm, bedrooms, purchase_price, purchase_date, loan_amount, interest_rate, current_value, monthly_rent, coordinates) VALUES
  (admin_id, 'Storgata 102', 'Tromsø', '9008', 'Leilighet', 78, 2, 4600000, '2021-12-10', 3400000, 4.4, 4900000, 19000, ARRAY[18.9551, 69.6489]) RETURNING id INTO prop5_id;

  -- ADMIN tenants
  INSERT INTO tenants (property_owner_id, first_name, last_name, email, phone, national_id, address, occupation, monthly_income, emergency_contact, emergency_phone) VALUES
  (admin_id, 'Ola', 'Nordmann', 'ola.nordmann@email.no', '83210987', '66789012345', 'Thereses gate 55, 0354 Oslo', 'Prosjektleder', 72000, 'Kari Nordmann', '96789013') RETURNING id INTO ten1_id;
  INSERT INTO tenants (property_owner_id, first_name, last_name, email, phone, national_id, address, occupation, monthly_income, emergency_contact, emergency_phone) VALUES
  (admin_id, 'Sara', 'Iversen', 'sara.iversen@email.no', '82109876', '77890123456', 'Kaigata 7, 5015 Bergen', 'UX Designer', 58000, 'Henrik Iversen', '97890124') RETURNING id INTO ten2_id;
  INSERT INTO tenants (property_owner_id, first_name, last_name, email, phone, national_id, address, occupation, monthly_income, emergency_contact, emergency_phone) VALUES
  (admin_id, 'Thomas', 'Johannesen', 'thomas.johannesen@email.no', '81098765', '88901234567', 'Kongens gate 8, 7013 Trondheim', 'Data Scientist', 78000, 'Linda Johannesen', '98901235') RETURNING id INTO ten3_id;
  INSERT INTO tenants (property_owner_id, first_name, last_name, email, phone, national_id, address, occupation, monthly_income, emergency_contact, emergency_phone) VALUES
  (admin_id, 'Emma', 'Kristiansen', 'emma.kristiansen@email.no', '80987654', '99012345678', 'Valbergtårnet 12, 4008 Stavanger', 'Marketing Manager', 65000, 'Fredrik Kristiansen', '99012346') RETURNING id INTO ten4_id;
  INSERT INTO tenants (property_owner_id, first_name, last_name, email, phone, national_id, address, occupation, monthly_income, emergency_contact, emergency_phone) VALUES
  (admin_id, 'Henrik', 'Haugen', 'henrik.haugen@email.no', '79876543', '00123456789', 'Storgata 102, 9008 Tromsø', 'Veterinær', 69000, 'Mette Haugen', '90123457') RETURNING id INTO ten5_id;

  -- ADMIN leases
  INSERT INTO lease_agreements (property_id, tenant_id, property_owner_id, monthly_rent, deposit_amount, start_date, end_date, utilities_included, parking_included, pets_allowed, status)
  VALUES (prop1_id, ten1_id, admin_id, 22000, 66000, '2024-03-01', '2026-02-28', true, false, false, 'active');
  INSERT INTO lease_agreements (property_id, tenant_id, property_owner_id, monthly_rent, deposit_amount, start_date, end_date, utilities_included, parking_included, pets_allowed, status)
  VALUES (prop2_id, ten2_id, admin_id, 18000, 54000, '2024-03-01', '2026-02-28', false, true, true, 'active');
  INSERT INTO lease_agreements (property_id, tenant_id, property_owner_id, monthly_rent, deposit_amount, start_date, end_date, utilities_included, parking_included, pets_allowed, status)
  VALUES (prop3_id, ten3_id, admin_id, 23000, 69000, '2024-03-01', '2026-02-28', true, true, false, 'active');
  INSERT INTO lease_agreements (property_id, tenant_id, property_owner_id, monthly_rent, deposit_amount, start_date, end_date, utilities_included, parking_included, pets_allowed, status)
  VALUES (prop4_id, ten4_id, admin_id, 24500, 73500, '2024-03-01', '2026-02-28', false, false, false, 'active');
  INSERT INTO lease_agreements (property_id, tenant_id, property_owner_id, monthly_rent, deposit_amount, start_date, end_date, utilities_included, parking_included, pets_allowed, status)
  VALUES (prop5_id, ten5_id, admin_id, 19000, 57000, '2024-03-01', '2026-02-28', true, true, true, 'active');
  
END $$;