
-- Update outpass insert policy to allow all roles that can create outpasses
DROP POLICY IF EXISTS "Admins can create outpasses" ON public.outpasses;
CREATE POLICY "Authorized users can create outpasses"
  ON public.outpasses FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'md') OR
    public.has_role(auth.uid(), 'principal') OR
    public.has_role(auth.uid(), 'hod') OR
    public.has_role(auth.uid(), 'staff')
  );
