
-- Create profiles table for institute/department info
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name text NOT NULL DEFAULT '',
  institute text,
  department text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Everyone can read profiles (needed for hierarchy checks)
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- MD can insert any profile
CREATE POLICY "MD can insert profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'md') OR
    public.has_role(auth.uid(), 'principal') OR
    public.has_role(auth.uid(), 'hod') OR
    auth.uid() = user_id
  );

-- Update user_roles insert policy to allow hierarchy creation
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;
CREATE POLICY "Authorized users can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id OR
    public.has_role(auth.uid(), 'md') OR
    public.has_role(auth.uid(), 'principal') OR
    public.has_role(auth.uid(), 'hod')
  );
