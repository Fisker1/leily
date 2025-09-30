-- Opprett testbrukere direkt i auth.users
-- MERK: Dette fungerer kun i staging/test, ikke production

-- Gjest bruker
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'gjest@leily.no',
  crypt('testpassword123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Test Gjest"}'::jsonb,
  now(),
  now(),
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, email, full_name, credits, subscription_tier)
VALUES ('11111111-1111-1111-1111-111111111111', 'gjest@leily.no', 'Test Gjest', 0, 'free')
ON CONFLICT (id) DO UPDATE SET credits = 0, subscription_tier = 'free';

INSERT INTO user_roles (user_id, role)
VALUES ('11111111-1111-1111-1111-111111111111', 'user')
ON CONFLICT (user_id, role) DO NOTHING;

-- Pro bruker
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  '00000000-0000-0000-0000-000000000000',
  'pro@leily.no',
  crypt('testpassword123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Test Pro"}'::jsonb,
  now(),
  now(),
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, email, full_name, credits, subscription_tier)
VALUES ('22222222-2222-2222-2222-222222222222', 'pro@leily.no', 'Test Pro', 50, 'premium')
ON CONFLICT (id) DO UPDATE SET credits = 50, subscription_tier = 'premium';

INSERT INTO user_roles (user_id, role)
VALUES ('22222222-2222-2222-2222-222222222222', 'user')
ON CONFLICT (user_id, role) DO NOTHING;

-- Ambassador bruker
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  '00000000-0000-0000-0000-000000000000',
  'ambassador@leily.no',
  crypt('testpassword123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Test Ambassador"}'::jsonb,
  now(),
  now(),
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, email, full_name, credits, subscription_tier)
VALUES ('33333333-3333-3333-3333-333333333333', 'ambassador@leily.no', 'Test Ambassador', 100, 'premium')
ON CONFLICT (id) DO UPDATE SET credits = 100, subscription_tier = 'premium';

INSERT INTO user_roles (user_id, role)
VALUES ('33333333-3333-3333-3333-333333333333', 'ambassador')
ON CONFLICT (user_id, role) DO NOTHING;