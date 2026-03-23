
-- Create the MD user properly with all required fields
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  aud, role, raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change_token_new, email_change_token_current,
  created_at, updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'jkkn@gmail.com',
  crypt('12345678', gen_salt('bf')),
  now(),
  'authenticated',
  'authenticated',
  '{"provider":"email","providers":["email"]}',
  '{}',
  '', '', '', '',
  now(),
  now()
);

-- Create identity for the user
INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
SELECT id, id, email, 'email', jsonb_build_object('sub', id::text, 'email', email), now(), now(), now()
FROM auth.users WHERE email = 'jkkn@gmail.com';

-- Create profile
INSERT INTO public.profiles (user_id, full_name, institute)
SELECT id, 'JKKN Admin', 'JKKNCET' FROM auth.users WHERE email = 'jkkn@gmail.com';

-- Assign MD role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'md' FROM auth.users WHERE email = 'jkkn@gmail.com';
