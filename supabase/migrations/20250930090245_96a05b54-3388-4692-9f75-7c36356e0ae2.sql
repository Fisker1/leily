-- Oppdater passord for testbrukere
UPDATE auth.users
SET encrypted_password = crypt('blåmeis', gen_salt('bf'))
WHERE email = 'gjest@leily.no';

UPDATE auth.users
SET encrypted_password = crypt('rødspette', gen_salt('bf'))
WHERE email = 'pro@leily.no';

UPDATE auth.users
SET encrypted_password = crypt('hærverk', gen_salt('bf'))
WHERE email = 'ambassador@leily.no';