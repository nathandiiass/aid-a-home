-- Create or replace security definer function to check roles (prevents RLS recursion)
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

-- Update profiles table RLS - restrict public access
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Public can view limited profile info" ON public.profiles;

-- Policy: Users can only view their own full profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Update specialist_profiles RLS - hide sensitive PII from non-owners
DROP POLICY IF EXISTS "Authenticated users can view specialist profiles" ON public.specialist_profiles;
DROP POLICY IF EXISTS "Users can view specialist profiles without PII" ON public.specialist_profiles;

-- Owners see everything, others cannot see phone/RFC/id_document_url
CREATE POLICY "Specialists view own profile fully"
  ON public.specialist_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create a view for public specialist info (without sensitive PII)
CREATE OR REPLACE VIEW public.specialist_profiles_public AS
SELECT 
  id,
  user_id,
  warranty_days,
  materials_policy,
  status,
  created_at,
  updated_at
FROM public.specialist_profiles
WHERE status = 'approved';

-- Grant access to the public view
GRANT SELECT ON public.specialist_profiles_public TO authenticated;
GRANT SELECT ON public.specialist_profiles_public TO anon;

-- Create or replace function to automatically assign 'user' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN new;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;

-- Create trigger to assign user role on signup
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- Create or replace function to assign specialist role when specialist_profile is created
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

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_specialist_profile_created ON public.specialist_profiles;

-- Create trigger to assign specialist role when specialist profile is created
CREATE TRIGGER on_specialist_profile_created
  AFTER INSERT ON public.specialist_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_specialist_role();