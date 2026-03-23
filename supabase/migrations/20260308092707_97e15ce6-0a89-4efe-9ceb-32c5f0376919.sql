
-- Add institute column to outpasses, buses, visitors
ALTER TABLE public.outpasses ADD COLUMN institute text;
ALTER TABLE public.buses ADD COLUMN institute text;
ALTER TABLE public.visitors ADD COLUMN institute text;

-- Create function to get current user's institute
CREATE OR REPLACE FUNCTION public.get_user_institute(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT institute FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Update outpasses SELECT policy to filter by institute
DROP POLICY IF EXISTS "Authenticated users can view outpasses" ON public.outpasses;
CREATE POLICY "Authenticated users can view outpasses"
ON public.outpasses FOR SELECT
USING (
  institute IS NULL 
  OR institute = public.get_user_institute(auth.uid())
  OR public.get_user_institute(auth.uid()) IS NULL
);

-- Update buses SELECT policy to filter by institute
DROP POLICY IF EXISTS "Authenticated users can view buses" ON public.buses;
CREATE POLICY "Authenticated users can view buses"
ON public.buses FOR SELECT
USING (
  institute IS NULL 
  OR institute = public.get_user_institute(auth.uid())
  OR public.get_user_institute(auth.uid()) IS NULL
);

-- Update visitors SELECT policy to filter by institute
DROP POLICY IF EXISTS "Authenticated users can view visitors" ON public.visitors;
CREATE POLICY "Authenticated users can view visitors"
ON public.visitors FOR SELECT
USING (
  institute IS NULL 
  OR institute = public.get_user_institute(auth.uid())
  OR public.get_user_institute(auth.uid()) IS NULL
);

-- Update notifications SELECT policy to also filter by user_id (already correct)
-- No change needed for notifications since they're already user_id scoped
