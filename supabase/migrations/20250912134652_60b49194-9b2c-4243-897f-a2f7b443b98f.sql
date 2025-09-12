-- Kopier testbruker og noen sample data til staging

-- Testbruker profil (med staging UUID)
INSERT INTO public.profiles (id, email, full_name, avatar_url, subscription_tier, subscription_end)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'stager@vipps.no', 'Stager', '/ninja-avatar.png', 'pro', now() + interval '10 years')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  subscription_tier = EXCLUDED.subscription_tier,
  subscription_end = EXCLUDED.subscription_end;

-- Gi testbrukeren rolle
INSERT INTO public.user_roles (user_id, role)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'user'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;

-- Sample eiendommer for testbrukeren
INSERT INTO public.properties (
  id, owner_id, address, postal_code, city, property_type, 
  size_sqm, bedrooms, purchase_price, purchase_date, current_value, 
  monthly_rent, primary_residence
) VALUES 
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000001',
    'Storgata 15', '0155', 'Oslo', 'Leilighet',
    85, 2, 2800000, '2022-03-15', 3200000,
    25000, false
  ),
  (
    '22222222-2222-2222-2222-222222222222', 
    '00000000-0000-0000-0000-000000000001',
    'Havnegata 7', '8310', 'Kabelvåg', 'Leilighet',
    65, 2, 1600000, '2021-11-20', 1850000,
    16000, false
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '00000000-0000-0000-0000-000000000001', 
    'Grünerløkka 8', '0554', 'Oslo', 'Leilighet',
    95, 3, 3100000, '2023-01-10', 3350000,
    NULL, true
  )
ON CONFLICT (id) DO NOTHING;