-- Sett opp testbruker profil med riktig UUID
INSERT INTO public.profiles (id, email, full_name, avatar_url, subscription_tier, subscription_end)
VALUES 
  ('4521f13f-4c59-4fce-b773-d2565d26c5e0', 'stager@vipps.no', 'Stager', '/ninja-avatar.png', 'pro', now() + interval '10 years')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  subscription_tier = EXCLUDED.subscription_tier,
  subscription_end = EXCLUDED.subscription_end;

-- Gi testbrukeren bruker-rolle
INSERT INTO public.user_roles (user_id, role)
VALUES 
  ('4521f13f-4c59-4fce-b773-d2565d26c5e0', 'user'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;

-- Legg til eksempel-eiendommer for testing
INSERT INTO public.properties (
  id, owner_id, address, postal_code, city, property_type,
  size_sqm, bedrooms, purchase_price, current_value, monthly_rent
) VALUES 
  ('11111111-1111-1111-1111-111111111111', '4521f13f-4c59-4fce-b773-d2565d26c5e0', 'Storgata 15', '0155', 'Oslo', 'Leilighet', 85, 2, 2800000, 3200000, 25000),
  ('22222222-2222-2222-2222-222222222222', '4521f13f-4c59-4fce-b773-d2565d26c5e0', 'Havnegata 7', '8310', 'Kabelvåg', 'Leilighet', 65, 2, 1600000, 1850000, 16000),
  ('33333333-3333-3333-3333-333333333333', '4521f13f-4c59-4fce-b773-d2565d26c5e0', 'Grünerløkka 8', '0554', 'Oslo', 'Leilighet', 95, 3, 3100000, 3350000, 28000)
ON CONFLICT (id) DO NOTHING;