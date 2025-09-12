-- Opprett testbruker profil for staging (med 'pro' istedenfor 'premium')
INSERT INTO public.profiles (id, email, full_name, avatar_url, subscription_tier, subscription_end)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'stager@vipps.no', 'Stager', '/ninja-avatar.png', 'pro', now() + interval '10 years')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  subscription_tier = EXCLUDED.subscription_tier,
  subscription_end = EXCLUDED.subscription_end;

-- Gi testbrukeren bruker-rolle
INSERT INTO public.user_roles (user_id, role)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'user'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;