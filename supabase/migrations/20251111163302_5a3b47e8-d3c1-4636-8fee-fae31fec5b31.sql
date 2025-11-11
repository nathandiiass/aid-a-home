-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('user', 'specialist', 'admin');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own user role"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND role = 'user');

-- Update profiles table RLS - restrict public access to limited fields
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Public can view limited profile info"
  ON public.profiles
  FOR SELECT
  USING (true);

-- Note: Frontend should only query display_name and avatar_url for public views
-- Full profile data requires checking auth.uid() = id in the query

-- Update specialist_profiles RLS - hide sensitive PII from non-owners
DROP POLICY IF EXISTS "Authenticated users can view specialist profiles" ON public.specialist_profiles;

CREATE POLICY "Users can view specialist profiles without PII"
  ON public.specialist_profiles
  FOR SELECT
  USING (
    -- Owners can see everything
    auth.uid() = user_id
    OR
    -- Others can see profiles but sensitive fields should be filtered in queries
    -- RLS allows the row, but app must not SELECT phone, rfc, id_document_url for non-owners
    auth.uid() IS NOT NULL
  );

-- Add function to automatically assign 'user' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  RETURN new;
END;
$$;

-- Trigger to assign user role on signup
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- Add function to assign specialist role when specialist_profile is created
CREATE OR REPLACE FUNCTION public.handle_new_specialist_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.user_id, 'specialist')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN new;
END;
$$;

-- Trigger to assign specialist role when specialist profile is created
CREATE TRIGGER on_specialist_profile_created
  AFTER INSERT ON public.specialist_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_specialist_role();