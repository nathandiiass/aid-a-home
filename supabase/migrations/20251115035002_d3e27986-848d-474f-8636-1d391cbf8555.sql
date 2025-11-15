-- Add missing fields to profiles table for user registration
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS accepted_terms_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS accepted_privacy_at timestamp with time zone;

-- Create index on phone for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);

-- Update the handle_new_user function to include phone from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    first_name, 
    last_name_paterno, 
    last_name_materno,
    display_name,
    date_of_birth,
    gender,
    phone,
    accepted_terms_at,
    accepted_privacy_at
  )
  VALUES (
    new.id, 
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name_paterno',
    new.raw_user_meta_data ->> 'last_name_materno',
    TRIM(CONCAT(
      COALESCE(new.raw_user_meta_data ->> 'first_name', ''),
      ' ',
      COALESCE(new.raw_user_meta_data ->> 'last_name_paterno', '')
    )),
    CASE 
      WHEN new.raw_user_meta_data ->> 'date_of_birth' IS NOT NULL 
      THEN (new.raw_user_meta_data ->> 'date_of_birth')::date 
      ELSE NULL 
    END,
    new.raw_user_meta_data ->> 'gender',
    new.raw_user_meta_data ->> 'phone',
    CASE 
      WHEN (new.raw_user_meta_data ->> 'accepted_terms')::boolean = true 
      THEN now() 
      ELSE NULL 
    END,
    CASE 
      WHEN (new.raw_user_meta_data ->> 'accepted_privacy')::boolean = true 
      THEN now() 
      ELSE NULL 
    END
  );
  RETURN new;
END;
$$;