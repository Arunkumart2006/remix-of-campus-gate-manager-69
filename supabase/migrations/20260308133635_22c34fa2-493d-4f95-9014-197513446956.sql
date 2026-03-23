DELETE FROM public.user_roles WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'jkkn@gmail.com');
DELETE FROM public.profiles WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'jkkn@gmail.com');
DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'jkkn@gmail.com');
DELETE FROM auth.sessions WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'jkkn@gmail.com');
DELETE FROM auth.refresh_tokens WHERE session_id IN (SELECT id FROM auth.sessions WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'jkkn@gmail.com'));
DELETE FROM auth.mfa_factors WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'jkkn@gmail.com');
DELETE FROM auth.users WHERE email = 'jkkn@gmail.com';