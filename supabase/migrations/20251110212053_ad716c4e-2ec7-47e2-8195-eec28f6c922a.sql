-- First drop any existing constraint with same name if exists
ALTER TABLE public.specialist_profiles 
  DROP CONSTRAINT IF EXISTS specialist_profiles_user_id_fkey;

-- Now create the foreign key constraint
ALTER TABLE public.specialist_profiles
  ADD CONSTRAINT specialist_profiles_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;