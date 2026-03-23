
-- Fix user_roles policies: drop restrictive, create permissive
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authorized users can insert roles" ON public.user_roles;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authorized users can insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    (auth.uid() = user_id)
    OR has_role(auth.uid(), 'md'::app_role)
    OR has_role(auth.uid(), 'principal'::app_role)
    OR has_role(auth.uid(), 'hod'::app_role)
  );

-- Fix profiles policies: drop restrictive, create permissive
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "MD can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authorized users can insert profiles" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'md'::app_role)
    OR has_role(auth.uid(), 'principal'::app_role)
    OR has_role(auth.uid(), 'hod'::app_role)
    OR (auth.uid() = user_id)
  );

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fix outpasses policies
DROP POLICY IF EXISTS "Authenticated users can view outpasses" ON public.outpasses;
DROP POLICY IF EXISTS "Authorized users can create outpasses" ON public.outpasses;
DROP POLICY IF EXISTS "Authenticated users can update outpass status" ON public.outpasses;

CREATE POLICY "Authenticated users can view outpasses" ON public.outpasses
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authorized users can create outpasses" ON public.outpasses
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'md'::app_role)
    OR has_role(auth.uid(), 'principal'::app_role)
    OR has_role(auth.uid(), 'hod'::app_role)
    OR has_role(auth.uid(), 'staff'::app_role)
  );

CREATE POLICY "Authenticated users can update outpass status" ON public.outpasses
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Fix buses policies
DROP POLICY IF EXISTS "Authenticated users can insert buses" ON public.buses;
DROP POLICY IF EXISTS "Authenticated users can view buses" ON public.buses;

CREATE POLICY "Authenticated users can view buses" ON public.buses
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert buses" ON public.buses
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Fix visitors policies
DROP POLICY IF EXISTS "Authenticated users can insert visitors" ON public.visitors;
DROP POLICY IF EXISTS "Authenticated users can view visitors" ON public.visitors;

CREATE POLICY "Authenticated users can view visitors" ON public.visitors
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert visitors" ON public.visitors
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);
