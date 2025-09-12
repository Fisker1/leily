-- Update user profile to pro subscription for testing
UPDATE public.profiles 
SET subscription_tier = 'pro', subscription_end = now() + interval '1 year'
WHERE id = (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1);