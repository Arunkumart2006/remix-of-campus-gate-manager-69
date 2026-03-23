-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'watchman');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Buses table
CREATE TABLE public.buses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_number TEXT NOT NULL,
  driver_name TEXT,
  entry_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.buses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view buses"
  ON public.buses FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert buses"
  ON public.buses FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

-- Outpasses table
CREATE TABLE public.outpasses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name TEXT NOT NULL,
  register_number TEXT NOT NULL,
  department TEXT NOT NULL,
  reason TEXT NOT NULL,
  exit_time TIMESTAMP WITH TIME ZONE NOT NULL,
  return_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.outpasses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view outpasses"
  ON public.outpasses FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can create outpasses"
  ON public.outpasses FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can update outpasses"
  ON public.outpasses FOR UPDATE TO authenticated USING (true);

-- Visitors table
CREATE TABLE public.visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  purpose TEXT NOT NULL,
  meeting_person TEXT NOT NULL,
  entry_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view visitors"
  ON public.visitors FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert visitors"
  ON public.visitors FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);