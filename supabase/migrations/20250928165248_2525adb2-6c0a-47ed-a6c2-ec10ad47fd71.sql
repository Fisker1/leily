-- Fix subscription tiers for test users with correct values
UPDATE profiles 
SET 
  subscription_tier = 'pro',
  subscription_end = now() + interval '365 days',
  updated_at = now()
WHERE email IN ('pro@leily.no', 'ambassador@leily.no');

-- Ensure ambassador user has the ambassador role (remove duplicate user role if exists)
DELETE FROM user_roles 
WHERE user_id = (SELECT id FROM profiles WHERE email = 'ambassador@leily.no') 
  AND role = 'user';

-- Make sure ambassador role exists
INSERT INTO user_roles (user_id, role)
SELECT id, 'ambassador'::app_role
FROM profiles 
WHERE email = 'ambassador@leily.no'
ON CONFLICT (user_id, role) DO NOTHING;