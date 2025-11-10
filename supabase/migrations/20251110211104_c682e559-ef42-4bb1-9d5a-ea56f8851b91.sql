-- Add apellido paterno and materno fields to profiles table
ALTER TABLE public.profiles 
  DROP COLUMN IF EXISTS last_name,
  ADD COLUMN last_name_paterno text,
  ADD COLUMN last_name_materno text,
  ADD COLUMN display_name text;

-- Update the handle_new_user function to include apellidos
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    first_name, 
    last_name_paterno, 
    last_name_materno,
    display_name
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
    ))
  );
  RETURN new;
END;
$$;