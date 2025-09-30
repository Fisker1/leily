-- Oppdater anderslundoy@gmail.com til admin
UPDATE profiles 
SET credits = 100, subscription_tier = 'premium', full_name = 'Anders Lundoy (Admin)'
WHERE email = 'anderslundoy@gmail.com';

-- Slett gamle roller og legg til admin
DELETE FROM user_roles WHERE user_id = '93fc5322-fe85-441d-b711-66eca054fa58';

INSERT INTO user_roles (user_id, role)
VALUES ('93fc5322-fe85-441d-b711-66eca054fa58', 'admin');