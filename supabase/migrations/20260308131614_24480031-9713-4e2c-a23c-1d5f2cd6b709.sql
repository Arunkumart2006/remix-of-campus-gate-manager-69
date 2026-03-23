
UPDATE auth.users SET 
  phone = '',
  phone_change_token = '',
  phone_change = '',
  reauthentication_token = ''
WHERE email = 'jkkn@gmail.com' AND (phone IS NULL OR phone_change IS NULL);
