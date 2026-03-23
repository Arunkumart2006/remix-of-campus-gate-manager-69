CREATE POLICY "MD/Principal/HOD can view created users roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'md'::app_role) OR
  has_role(auth.uid(), 'principal'::app_role) OR
  has_role(auth.uid(), 'hod'::app_role)
);