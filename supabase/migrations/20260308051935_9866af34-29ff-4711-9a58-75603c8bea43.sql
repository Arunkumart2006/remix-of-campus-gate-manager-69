-- Tighten outpass update policy: only allow status column updates by authenticated users
DROP POLICY "Authenticated users can update outpasses" ON public.outpasses;

CREATE POLICY "Authenticated users can update outpass status"
  ON public.outpasses FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);