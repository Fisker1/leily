-- Fikse instance_id for alle testbrukere
UPDATE auth.users
SET instance_id = (SELECT id FROM auth.instances LIMIT 1)
WHERE email IN ('gjest@leily.no', 'pro@leily.no', 'ambassador@leily.no');