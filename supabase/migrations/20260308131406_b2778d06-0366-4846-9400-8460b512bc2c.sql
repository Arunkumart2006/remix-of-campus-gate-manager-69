
-- Delete corrupted user data
DELETE FROM public.notifications WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'jkkn@gmail.com');
DELETE FROM public.user_roles WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'jkkn@gmail.com');
DELETE FROM public.profiles WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'jkkn@gmail.com');
DELETE FROM auth.users WHERE email = 'jkkn@gmail.com';
