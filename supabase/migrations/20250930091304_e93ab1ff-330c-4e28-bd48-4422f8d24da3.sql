-- Delete manually created test users that have invalid instance_id
DELETE FROM auth.users 
WHERE email IN ('gjest@leily.no', 'pro@leily.no', 'ambassador@leily.no');